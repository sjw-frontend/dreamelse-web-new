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

import { flatHeights } from '../../modules/text-measure';

type HeightLevel = 'high' | 'low' | 'middle';

export type Item = LibTypes.FrozenDefine<{
    id: ScriptTypes.ScriptId,
    height: number,
    contentHeight: number,
    contentWidth: number,
    heightLevel: HeightLevel,
}>;

type InternalState = LibTypes.VarDefine<{
    ids: LibTypes.Arr<ScriptTypes.ScriptId>,
    list: LibTypes.VarArr<Item>,
    itemContentWidth: number | null,

    reportKind: ApiTypes.Protocol.ReportScriptsReq['source'] | null,
}>;

type State = LibTypes.FrozenPick<InternalState, 'list'>;

type Props = LibTypes.FrozenDefine<{
    reportKind?: ApiTypes.Protocol.ReportScriptsReq['source'],
}>;

@renderController()
export class ScriptWaterfallV2Controller extends BaseRenderController<
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
    readonly #textLinesCache: LibTypes.VarGeneralObj<number> = {};

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
        if (
            !ObjectUtils.isShallowEqual(this.internal.ids, ids) ||
            this.internal.itemContentWidth !== itemContentWidth
        ) {
            const infoList = ids
                .map(id => this.#scriptController.getScript(id))
                .filter(item => !!item);

            const imageHeightLevelMap: LibTypes.VarGeneralObj<HeightLevel> = {};

            infoList.forEach(item => {
                if (this.#heightLevelCache[item.id] != null) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    imageHeightLevelMap[item.id] = this.#heightLevelCache[item.id]!;
                    return;
                }

                const sceneInfo =
                    sceneKey == null
                        ? null
                        : item.state.sceneInfoRecord[sceneKey];

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

                imageHeightLevelMap[item.id] = level;
                this.#heightLevelCache[item.id] = level;
            });

            const fontSize = 14;

            // 只对没有缓存的 ids 调用 flatHeights
            const needMeasureList = infoList.filter(
                item => this.#textLinesCache[item.id] == null,
            );

            // 先用默认值（textLines=1）立即构建 list，让列表可以继续滚动
            const buildList = () => {
                const result: LibTypes.VarArr<Item> = [];
                infoList.forEach(info => {
                    const textLines = this.#textLinesCache[info.id] ?? 1;
                    const heightLv = imageHeightLevelMap[info.id];
                    const imageRatio =
                        heightLv === 'low'
                            ? 183 / 137
                            : heightLv === 'middle'
                              ? 183 / 183
                              : 183 / 248;
                    const imageHeight = itemContentWidth / imageRatio;
                    const contentWidth = itemContentWidth;
                    const contentHeight =
                        imageHeight + 8 + textLines * 19 + 4 + 20 + 12;
                    result.push({
                        id: info.id,
                        height: contentHeight + 8,
                        contentWidth,
                        contentHeight,
                        heightLevel: heightLv ?? 'high',
                    });
                });
                return result;
            };

            // 立即用估算高度更新 list（新 ids 用 textLines=1 估算）
            const immediateList = buildList();
            const oldList = this.internal.list;
            const immediateUnchanged =
                oldList.length === immediateList.length &&
                oldList.every(
                    (item, i) =>
                        item.id === immediateList[i]?.id &&
                        item.height === immediateList[i]?.height,
                );
            // 始终更新 ids 和 itemContentWidth，确保下次 onEndReached 能正常触发
            this.internal.ids = ids;
            this.internal.itemContentWidth = itemContentWidth;
            if (!immediateUnchanged) {
                this.internal.list = immediateList;
            }

            // 再精确测量新增 ids 的文字行数
            if (needMeasureList.length > 0) {
                const textInfos = await flatHeights({
                    texts: needMeasureList.map(item => item.state.title),
                    width: itemContentWidth - 24,
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    fontSize,
                });

                needMeasureList.forEach((info, index) => {
                    const { lines = 1 } = textInfos[index] ?? {};
                    this.#textLinesCache[info.id] = Math.max(Math.min(lines, 2), 1);
                });

                // 用精确高度再次更新 list
                const preciseList = buildList();
                const preciseUnchanged =
                    this.internal.list.length === preciseList.length &&
                    this.internal.list.every(
                        (item, i) =>
                            item.id === preciseList[i]?.id &&
                            item.height === preciseList[i]?.height,
                    );
                if (!preciseUnchanged) {
                    this.internal.list = preciseList;
                }
            }
        }
    };

    public readonly reportShow = async (
        list: LibTypes.Arr<ScriptTypes.FrozenScriptInfo>,
    ) => {
        if (list.length > 0) {
            const reportReqList: LibTypes.VarArr<ApiTypes.Protocol.ReportScriptEntity> =
                [];
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
                    list: [
                        {
                            impression_id: impressionId ?? '',
                            script_id: id,
                        },
                    ],
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
                    this.#apiService.call.feed.favourite_script({
                        script_id: data.id,
                    });
                } else {
                    this.#apiService.call.feed.unfavourite_script({
                        script_id: data.id,
                    });
                }

                this.#userController.setMyScriptStats(prevValue => ({
                    collectCount:
                        prevValue.collectCount +
                        (data.state.isCollected ? -1 : 1),
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
}
