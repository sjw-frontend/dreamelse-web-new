import { NAVBAR, STYLE } from '$/consts';
import { RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { NavbarEnums, RouterEnums } from '$/enums';
import { DeviceService } from '$/services';
import type { StyleTypes } from '$/types';

type Rect = LibTypes.Define<
    StyleTypes.Layout & {
        bottom: number,
        get headToBottom(): number,
    }
>;

type InternalState = LibTypes.VarDefine<{
    internalEnabled: boolean,
    externalEnabled: boolean,

    get enabled(): boolean,

    kind: NavbarEnums.Kind,
    get currentRouteName(): RouterEnums.RouteName | null,
    rect: Rect,
    showOverlay: boolean,

    layoutInsetsBottom: number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'currentRouteName' | 'enabled' | 'kind' | 'rect' | 'showOverlay'
>;

type EventMap = LibTypes.FrozenDefine<{
    pressHome: LibTypes.SimpleFunction,
}>;

@renderController()
export class NavbarController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        deviceService: DeviceService,
        routerController: RouterController,
    ) {
        super();
        this.#deviceService = deviceService;
        this.#routerController = routerController;

        this.#watch();
    }

    readonly #deviceService;
    readonly #routerController;

    #watch() {
        this.watch(
            () => this.#routerController.state.currentRoute?.name,
            currentRouteName => {
                this.internal.internalEnabled = NAVBAR.Routes.some(item => {
                    const value = item[0] === currentRouteName;
                    if (value) {
                        this.internal.kind = item[1];
                    }
                    return value;
                });
            },
        );
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private createRect(
        newRect: Partial<
            LibTypes.DefinePick<Rect, 'height' | 'width' | 'x' | 'y'>
        >,
        currentRect: Rect | null,
    ) {
        const $this = this;
        let y: number | null = newRect.y ?? currentRect?.y ?? null;

        const result: Rect = {
            x: newRect.x ?? currentRect?.x ?? 0,
            get y() {
                y ??=
                    $this.#deviceService.windowDimension.height -
                    STYLE.Navbar.height -
                    $this.internal.layoutInsetsBottom;
                return y;
            },
            width: newRect.width ?? currentRect?.width ?? 0,
            height:
                newRect.height ?? currentRect?.height ?? STYLE.Navbar.height,
            get bottom() {
                return $this.internal.layoutInsetsBottom;
            },
            get headToBottom() {
                return this.bottom + this.height;
            },
        };

        return result;
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            internalEnabled: false,
            externalEnabled: true,
            kind: NavbarEnums.Kind.Default,
            get currentRouteName() {
                return $this.#routerController.state.currentRoute?.name ?? null;
            },
            rect: this.createRect({}, null),
            get enabled() {
                return this.internalEnabled && this.externalEnabled;
            },
            showOverlay: false,

            layoutInsetsBottom: 0,
        };
    }

    public readonly onLayout = (
        rect: Partial<
            LibTypes.DefinePick<Rect, 'height' | 'width' | 'x' | 'y'>
        >,
    ) => {
        this.internal.rect = this.createRect(rect, this.internal.rect);
    };

    public readonly toHome = () => {
        if (
            this.#routerController.state.currentRoute?.name !==
            RouterEnums.RouteName.Home
        ) {
            this.#routerController.resetToHome();
        }
    };

    public readonly toCharacterList = () => {
        if (
            this.#routerController.state.currentRoute?.name !==
            RouterEnums.RouteName.CharacterList
        ) {
            this.#routerController.navigate(
                RouterEnums.RouteName.CharacterList,
            );
        }
    };

    public readonly toCharacterCreate = () => {
        if (
            this.#routerController.state.currentRoute?.name !==
            RouterEnums.RouteName.CharacterCreate
        ) {
            this.#routerController.navigate(
                RouterEnums.RouteName.CharacterCreate,
            );
        }
    };

    public readonly toMe = () => {
        if (
            this.#routerController.state.currentRoute?.name !==
            RouterEnums.RouteName.Me
        ) {
            this.#routerController.navigate(RouterEnums.RouteName.Me);
        }
    };

    public readonly enabled = (enabled = true) =>
        (this.internal.externalEnabled = enabled);

    public readonly openOverlay = () => {
        this.internal.showOverlay = true;
    };

    public readonly closeOverlay = () => {
        this.internal.showOverlay = false;
    };

    public readonly toStoryCreate = () => {
        if (
            this.#routerController.state.currentRoute?.name !==
            RouterEnums.RouteName.ScriptEdit
        ) {
            this.#routerController.navigate(RouterEnums.RouteName.ScriptEdit);
        }
    };

    public readonly setLayoutInsetsBottom = (layoutInsetsBottom: number) =>
        (this.internal.layoutInsetsBottom = layoutInsetsBottom);
}
