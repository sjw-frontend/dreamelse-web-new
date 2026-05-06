import { RouterController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, LinkingService } from '$/services';
import type { ApiTypes, UserTypes } from '$/types';

import { Settings } from './user-settings-const';

type InternalState = LibTypes.VarDefine<{
    get userInfo(): UserTypes.FrozenUserInfo | null,
    terms: ApiTypes.Protocol.AppTermsResp | null,
}>;

type State = LibTypes.FrozenPick<InternalState, 'terms' | 'userInfo'>;

@renderController()
export class UserSettingsController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        linkingService: LinkingService,
        routerController: RouterController,
        userController: UserController,
        apiService: ApiService,
    ) {
        super();
        this.#linkingService = linkingService;
        this.#routerController = routerController;
        this.#userController = userController;
        this.#apiService = apiService;
    }

    readonly #linkingService;
    readonly #routerController;
    readonly #userController;
    readonly #apiService;

    readonly #getTerms = () => {
        this.#apiService.call.app
            .get_terms()
            .then(res => {
                this.internal.terms = res;
            })
            .catch(() => {
                this.internal.terms = null;
            });
    };

    protected override onMount() {
        this.#getTerms();
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            get userInfo() {
                return $this.#userController.state.loggedInUser ?? null;
            },
            terms: null,
        };
    }

    public readonly back = () => this.#routerController.goBackOrHome();

    public readonly logout = () => this.#userController.logout();

    public readonly openEmail = async () =>
        this.#linkingService.openEmail(Settings.email);

    public readonly openXiaohongshu = async () => {
        try {
            const canOpen = await this.#linkingService.canOpen(
                Settings.xiaohongshuUrl,
            );
            if (!canOpen) {
                return false;
            }
            await this.#linkingService.open(Settings.xiaohongshuUrl);
            return true;
        } catch {
            return false;
        }
    };

    public readonly toCancelAccount = () => {
        this.#routerController.navigate(RouterEnums.RouteName.CancelAccount);
    };

    public readonly toAbout = () => {
        this.#routerController.navigate(RouterEnums.RouteName.About);
    };

    public readonly toPdf = (pdf: RouterEnums.PDFPageKind) => {
        this.#routerController.navigate(RouterEnums.RouteName.PDF, {
            pdfKind: pdf,
        });
    };

    public readonly toWeb = (title: string, url: string) => {
        this.#routerController.navigate(RouterEnums.RouteName.Web, {
            title,
            url,
        });
    };
}
