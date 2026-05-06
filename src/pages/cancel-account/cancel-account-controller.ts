import { RouterController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { ApiService } from '$/services';

import { Settings } from './cancel-account-const';

const GetCheckCodeTimerSymbol = Symbol('GetCheckCodeTimer');

type InternalState = LibTypes.VarDefine<{
    get phoneNum(): string,
    get maskedPhoneNum(): string,
    checkCode: string,
    getCheckCodeCountdown: number,

    get phoneValid(): boolean,
    get canGetCheckCode(): boolean,
    get canSubmit(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'canGetCheckCode'
    | 'canSubmit'
    | 'checkCode'
    | 'getCheckCodeCountdown'
    | 'maskedPhoneNum'
    | 'phoneNum'
    | 'phoneValid'
>;

type EventMap = LibTypes.FrozenDefine<{
    invalidPhone: LibTypes.SimpleFunction,
    invalidCheckCode: LibTypes.SimpleFunction,
    sendCodeFailed: LibTypes.SimpleFunction,
    success: LibTypes.SimpleFunction,
}>;

@renderController()
export class CancelAccountController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        apiService: ApiService,
        userController: UserController,
        routerController: RouterController,
    ) {
        super();
        this.#apiService = apiService;
        this.#routerController = routerController;
        this.#userController = userController;
    }

    readonly #apiService;
    readonly #routerController;
    readonly #userController;

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            checkCode: '',
            getCheckCodeCountdown: 0,

            get phoneNum() {
                return (
                    $this.#userController.state.loggedInUser?.state
                        .phoneNumber ?? ''
                );
            },

            get maskedPhoneNum() {
                const phoneNum = this.phoneNum;
                if (phoneNum.length < 4) {
                    return '';
                }
                return `****${phoneNum.slice(-4)}`;
            },

            get phoneValid() {
                return /^1\d{10}$/.test(this.phoneNum);
            },

            get canGetCheckCode() {
                return this.getCheckCodeCountdown <= 0;
            },

            get canSubmit() {
                return (
                    this.phoneValid &&
                    this.checkCode.length === Settings.checkCodeMaxLength
                );
            },
        };
    }

    public readonly back = () => this.#routerController.goBackOrHome();

    public readonly setCheckCode = (checkCode: string) => {
        this.internal.checkCode = checkCode;
    };

    public readonly getCheckCode = async () => {
        if (!this.internal.canGetCheckCode) {
            return false;
        }

        if (!this.internal.phoneValid) {
            this.emitEvent('invalidPhone');
            return false;
        }

        try {
            await this.#apiService.call.auth.send_code({
                phone_number: this.internal.phoneNum,
                scene: 'deregister',
            });

            this.internal.getCheckCodeCountdown =
                Settings.maxGetCheckCodeCountdown;
            const timer = setInterval(() => {
                this.internal.getCheckCodeCountdown--;
                if (this.internal.getCheckCodeCountdown <= 0) {
                    clearInterval(timer);
                }
            }, Settings.getCheckCodeCountdownChangeDurationMS);
            this.autoClear(GetCheckCodeTimerSymbol, () => clearInterval(timer));

            return true;
        } catch {
            this.emitEvent('sendCodeFailed');
            return false;
        }
    };

    public readonly submit = async () => {
        if (!this.internal.canSubmit) {
            return;
        }

        try {
            const res = await this.#apiService.call.auth.verify_code({
                phone_number: this.internal.phoneNum,
                code: this.internal.checkCode,
                scene: 'deregister',
            });
            if (!res.is_valid) {
                this.emitEvent('invalidCheckCode');
            } else {
                this.emitEvent('success');
                // TODO
                this.#userController.logout();
            }
        } catch {
            this.emitEvent('invalidCheckCode');
        }
    };
}
