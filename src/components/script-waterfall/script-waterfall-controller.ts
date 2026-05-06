// @ts-nocheck
import {
    RouterController,
    ScriptController,
    UserController,
} from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService } from '$/services';
import type { ApiTypes, ScriptTypes } from '$/types';
import { ObjectUtils } from '$/utils';

type HeightLevel = 'high' | 'low' | 'middle';

export type Item = {
    readonly id: ScriptTypes.ScriptId;
    readonly height: number;
    readonly contentHeight: number;
    readonly contentWidth: number;
    readonly heightLevel: HeightLevel;
};

type InternalState = LibTypes.VarDefine<{
    ids: LibTypes.Arr<ScriptTypes.ScriptId>;
    list: LibTypes.VarArr<Item>;
    itemContentWidth: number | null;
    reportKind: ApiTypes.Protocol.ReportScriptsReq['source'] | null;
}>;

type State = LibTypes.FrozenPick<InternalState, 'list'>;

type Props = LibTypes.FrozenDefine<{
    reportKind?: ApiTypes.Protocol.ReportScriptsReq['source'];
    isDraft?: boolean;
}>;

@renderController()
export class ScriptWaterfallController extends BaseRenderController<
    State,
    InternalState,
    never,
    Props
> {
    public constructor(
        scriptController: ScriptController,
        apiService: ApiService,
        userController: UserController,
        routerController: RouterController,
    ) {
        super();
        this.#scriptController = scriptController;
        this.#apiService = apiService;
        this.#userController = userController;
        this.#routerController = routerController;
    }

    readonly #scriptController;
    readonly #apiService;
    readonly #userController;
    readonly #routerController;

    readonly #showMap: LibTypes.VarGeneralObj<boolean> = {};
    readonly #clickMap: LibTypes.VarGeneralObj<boolean> = {};
    readonly #heightLevelCache: LibTypes.VarGeneralObj<HeightLevel> = {};

    protected override getInitialInternalState(): InternalState {
        return {
            ids: [],
            list: [],
            itemContentWidth: null,
            reportKind: this.props.reportKind ?? null,
        };
    }

    public readonly updateIds = async (
        ids: LibTypes.Arr<ScriptTypes.ScriptId>,
        itemContentWidth: number,
        sceneKey: string | null,
    ) => {
        const idsEqual = ObjectUtils.isShallowEqual(this.internal.ids, ids);
        const widthEqual = this.internal.itemContentWidth === itemContentWidth;
        if (!idsEqual || !widthEqual) {
            this.internal.ids = ids;
            this.internal.itemContentWidth = itemContentWidth;
            const list: LibTypes.VarArr<Item> = [];

            const infoList = ids
                .map(id => this.#scriptController.getScript(id))
                .filter(item => !!item);

            const heightLevelMap: LibTypes.VarGeneralObj<HeightLevel> = {};

            infoList.forEach(info => {
                if (this.#heightLevelCache[info.id] != null) {
                    heightLevelMap[info.id] = this.#heightLevelCache[info.id]!;
                    return;
                }

                const sceneInfo = sceneKey == null ? null : info.state.sceneInfoRecord[sceneKey];

                let level: HeightLevel;
                if (!sceneInfo) {
                    level = 'low';
                } else if (sceneInfo.backgroundImage) {
                    level = 'high';
                } else if (sceneInfo.coverRoles.length >= 2) {
                    level = 'high';
                } else if (sceneInfo.coverRoles.length === 1) {
                    level = 'middle';
                } else {
                    level = 'low';
                }

                heightLevelMap[info.id] = level;
                this.#heightLevelCache[info.id] = level;
            });

            infoList.forEach(info => {
                const heightLv = heightLevelMap[info.id] ?? 'low';
                // v2 image aspect ratios: high=183/248, middle=183/183, low=183/137
                const imageRatio =
                    heightLv === 'low'
                        ? 183 / 137
                        : heightLv === 'middle'
                          ? 183 / 183
                          : 183 / 248;

                const contentWidth = itemContentWidth;
                const imageHeight = contentWidth / imageRatio;
                // v2 height formula: imageHeight + 8(marginTop) + textLines*19 + 4(marginTop) + 20(bottomContent height) + 12(margin)
                const textLines = Math.min(Math.max(Math.ceil((info.state.title?.length ?? 0) / 12), 1), 2);
                const contentHeight = imageHeight + 8 + textLines * 19 + 4 + 20 + 12;

                list.push({
                    id: info.id,
                    height: contentHeight + 8,
                    contentWidth,
                    contentHeight,
                    heightLevel: heightLv,
                });
            });

            const oldList = this.internal.list;
            const listUnchanged =
                oldList.length === list.length &&
                oldList.every(
                    (item, i) =>
                        item.id === list[i]?.id &&
                        item.height === list[i]?.height,
                );

            if (!listUnchanged) {
                this.internal.list = list;
            }
        }
    };

    public readonly reportShow = async (
        list: LibTypes.Arr<ScriptTypes.FrozenScriptInfo>,
    ) => {
        if (list.length > 0) {
            const reportReqList: any[] = [];
            list.forEach(info => {
                const id = info.id;
                const impressionId = info.impressionId;
                if (!this.#showMap[id]) {
                    this.#showMap[id] = true;
                    reportReqList.push({
                        impression_id: impressionId ?? '',
                        script_id: id,
                    });
                }
            });

            if (this.internal.reportKind != null && reportReqList.length > 0) {
                try {
                    await this.#apiService.call.feed.report({
                        list: reportReqList,
                        source: this.internal.reportKind,
                        action: 'show',
                    });
                } catch {
                    list.forEach(item => {
                        this.#showMap[item.id] = false;
                    });
                }
            }
        }
    };

    public readonly reportClick = async (
        info: ScriptTypes.FrozenScriptInfo,
    ) => {
        const id = info.id;
        const impressionId = info.impressionId;
        if (!this.#clickMap[id] && this.internal.reportKind != null) {
            this.#clickMap[id] = true;
            try {
                await this.#apiService.call.feed.report({
                    list: [{ impression_id: impressionId ?? '', script_id: id }],
                    source: this.internal.reportKind,
                    action: 'click',
                });
            } catch {
                this.#clickMap[id] = false;
            }
        }
    };

    public readonly collect = (id: string) => {
        if (this.#userController.isLoggedIn()) {
            const data = this.#scriptController.getScript(id);
            if (data) {
                if (!data.state.isCollected) {
                    this.#apiService.call.feed.favourite_script({ script_id: data.id });
                } else {
                    this.#apiService.call.feed.unfavourite_script({ script_id: data.id });
                }

                this.#userController.setMyScriptStats(prevValue => ({
                    collectCount: prevValue.collectCount + (data.state.isCollected ? -1 : 1),
                }));

                this.#scriptController.setScriptState(
                    data.id,
                    'isCollected',
                    !data.state.isCollected,
                );
            }
        }
    };

    public readonly onEdit = async (id: string) => {
        await this.#scriptController.requestCreateDraftByScript(id);
        this.#routerController.navigate(RouterEnums.RouteName.ScriptEdit, {
            ids: [id],
        });
    };

    public readonly deleteDraft = async (id: string, version: string) => {
        await this.#scriptController.requestDeleteDraft(id, version);
        if (
            this.internal.ids.find(item => item === id) != null &&
            this.props.isDraft &&
            this.internal.itemContentWidth != null
        ) {
            const ids = this.internal.ids.filter(item => item !== id);
            this.updateIds(ids, this.internal.itemContentWidth, null);
        }
    };
}
