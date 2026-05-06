// @ts-nocheck
import type { CharacterFiguresPanelController } from '$/component-controllers';
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService } from '$/services';
import type { CharacterTypes, FileTypes } from '$/types';

import { getCharacterInfoFromRoute } from '../@com';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,
    detailsPanelExpanded: boolean,
    isNameEdit: boolean,
    showMoreMenu: boolean,

    showFigureEditPanel: boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'data'
    | 'detailsPanelExpanded'
    | 'isNameEdit'
    | 'showFigureEditPanel'
    | 'showMoreMenu'
>;
type EventMap = LibTypes.FrozenDefine<{
    noData: LibTypes.SimpleFunction,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    characterFiguresPanelCtrl: CharacterFiguresPanelController,
}>;
@renderController()
export class CharacterDetailsController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        characterController: CharacterController,
        routerController: RouterController,
        apiService: ApiService,
    ) {
        super();
        this.#characterController = characterController;
        this.#routerController = routerController;
        this.#apiService = apiService;

        this.#init();
    }

    readonly #characterController;
    readonly #routerController;
    readonly #apiService;
    // #relatedControllers?: RelatedControllers;

    #init() {
        this.internal.data = getCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            detailsPanelExpanded: true, // 默认展开
            isNameEdit: false,
            showMoreMenu: false,
            showFigureEditPanel: false,
        };
    }

    // 详情面板展开/收起
    public readonly toggleDetailsPanel = () => {
        this.internal.detailsPanelExpanded =
            !this.internal.detailsPanelExpanded;
    };

    public readonly saveNameAndHonorary = (name: string, honorary: string) => {
        if (!this.internal.data) {
            return;
        }

        // 更新角色信息
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'name',
            name,
            true,
        );
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'honorary',
            honorary,
            true,
        );
    };

    // 导航相关
    public readonly goBack = () => {
        this.#routerController.goBack();
    };

    public readonly openMoreMenu = () => {
        this.internal.showMoreMenu = true;
    };

    public readonly closeMoreMenu = () => {
        this.internal.showMoreMenu = false;
    };

    public readonly togglePublic = () => {
        if (!this.internal.data) {
            return;
        }

        const newIsPublic = !this.internal.data.state.isPublic;
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'isPublic',
            newIsPublic,
            true,
        );

        this.closeMoreMenu();
    };

    // 跳转到属性页面
    public readonly toStats = () => {
        if (!this.internal.data) {
            return;
        }
        if (
            this.internal.data.state.stats?.abilityValue == null ||
            this.internal.data.state.stats.abilityValue === 0
        ) {
            this.emitEvent('noData');
            return;
        }
        this.#routerController.navigate(RouterEnums.RouteName.CharacterStats, {
            ids: [this.internal.data.id],
        });
    };

    public readonly setNameEdit = (value: boolean) => {
        this.internal.isNameEdit = value;
    };

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        const { characterFiguresPanelCtrl } = relatedControllers;
        this.autoClearRelatedControllers(
            characterFiguresPanelCtrl.addEventListener('onEdit', () => {
                this.internal.showFigureEditPanel = true;
            }),
        );
    };

    public readonly closeFigureEditPanel = () => {
        this.internal.showFigureEditPanel = false;
    };

    public readonly confirmUpdateFigure = async (
        image: FileTypes.ImageResource,
        id: string | null,
    ) => {
        this.closeFigureEditPanel();
        if (this.internal.data) {
            await this.#apiService.call.character.update_appearance({
                character_id: this.internal.data.id,
                outfit_id: this.internal.data.state.currentFigureSkinId ?? '',
                appearance_id: id ?? '',
                image: {
                    bucket_name: '',
                    object_key: '',
                    object_type: '',
                    request_id: '',
                    url: image.remote?.uri ?? image.uri,
                },
            });

            this.#characterController.updateFigure(
                this.internal.data.id,
                this.internal.data.state.currentFigureSkinId ?? '',
                id ?? '',
                image,
            );
        }
    };
}
