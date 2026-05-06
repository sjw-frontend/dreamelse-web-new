import { RouterController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService, DeviceService, LinkingService } from '$/services';
import { StringUtils } from '$/utils';

import { Settings } from './login-const';

type InternalState = LibTypes.VarDefine<{
    ready: boolean,
    supportApple: boolean,
    supportWechat: boolean,
    supportQQ: boolean,
    agree: boolean,

    showPhoneLoginModal: boolean,
    phoneNum: string,
    checkCode: string,
    getCheckCodeCountdown: number,

    get canGetCheckCode(): boolean,

    needRegister: boolean,
    registerToken: string | null,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'agree'
    | 'canGetCheckCode'
    | 'checkCode'
    | 'getCheckCodeCountdown'
    | 'needRegister'
    | 'phoneNum'
    | 'ready'
    | 'showPhoneLoginModal'
    | 'supportApple'
    | 'supportQQ'
    | 'supportWechat'
>;

type EventMap = LibTypes.FrozenDefine<{
    waitAgree: LibTypes.Asyncable<boolean>,
    invalidCheckCode: LibTypes.SimpleFunction,
    invalidPhoneNum: LibTypes.SimpleFunction,
    loginFail: LibTypes.Func<void, [msg: string]>,
}>;

@renderController()
export class LoginController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        deviceService: DeviceService,
        linkingService: LinkingService,
        userController: UserController,
        routerController: RouterController,
        apiService: ApiService,
    ) {
        super();

        this.#deviceService = deviceService;
        this.#linkingService = linkingService;
        this.#userController = userController;
        this.#routerController = routerController;
        this.#apiService = apiService;

        this.#init();
    }

    readonly #deviceService;
    readonly #linkingService;
    readonly #userController;
    readonly #routerController;
    readonly #apiService;

    async #init() {
        const [supportApple, supportWechat, supportQQ] = await Promise.all([
            this.#deviceService.checkSupportApple(),
            this.#deviceService.checkSupportWechat(),
            this.#deviceService.checkSupportQQ(),
        ]);

        this.internal.ready = true;

        this.internal.supportApple = supportApple;
        this.internal.supportWechat = supportWechat;
        this.internal.supportQQ = supportQQ;
    }

    async #login(token: string) {
        // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJicm8uemhvdSIsImRpZCI6IiIsImV4cCI6MTc2OTU0NDM1OSwibmJmIjoxNzY4NTQ0MzYwLCJpYXQiOjE3Njg1NDQzNjB9.L2SMF6SXunI2aBiPGYT9pEQxXfRPTYO-TwplYPvisUM',
        // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzdHJpbmciLCJkaWQiOiJzdHJpbmciLCJleHAiOjE3NzY1NjYyMjQsIm5iZiI6MTc2NzY3NzMzNiwiaWF0IjoxNzY3Njc3MzM2fQ.Xe0FGPXwQHfrCMX-abNxqoHp16Kj1hy_ZB3Q21FtH3s',
        const userRes = await this.#apiService.call.user.get_user_info(
            {},
            {
                token,
            },
        );

        this.#userController.login(
            this.#userController.createInitialUserInfoFromApiRes(userRes.info),
            token,
        );
        this.#routerController.goBackOrHome();
    }

    async #checkCanLogin() {
        if (this.internal.agree || (await this.emitEvent('waitAgree').race)) {
            this.internal.agree = true;
            return true;
        }

        return false;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            ready: false,
            supportApple: false,
            supportWechat: false,
            supportQQ: false,
            agree: false,

            showPhoneLoginModal: false,
            phoneNum: '',
            checkCode: '',
            getCheckCodeCountdown: 0,

            get canGetCheckCode() {
                return (
                    this.getCheckCodeCountdown <= 0 &&
                    StringUtils.validatePhoneNumber(this.phoneNum)
                );
            },

            needRegister: false,
            registerToken: null,
        };
    }

    public readonly mockLogin = () => {
        this.#login(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI2OGY2NjZmNDRmNTM0NGY4YmQ0MjM5ZmMwOTU3N2MxYyIsImRpZCI6IjAiLCJleHAiOjE5Njk5NDg0OTAsIm5iZiI6MTc2OTU3MjA2OSwiaWF0IjoxNzY5NTcyMDY5fQ.0b4ao0lLOHqgD_yzrpoH75mKsJba_osoAhWjUf-rENM',
        );
    };

    public readonly appleLogin = async () => {
        const support = await this.#deviceService.checkSupportApple();

        if (support && (await this.#checkCanLogin())) {
            const result = await this.#deviceService.appleSign();
            console.log(result);
            if (result.identityToken != null) {
                const res = await this.#apiService.call.auth.apple_login({
                    identity_token: result.identityToken,
                    user: result.user,
                    email: result.email ?? undefined,
                    full_name:
                        (result.fullName &&
                            [
                                result.fullName.namePrefix,
                                result.fullName.givenName,
                                result.fullName.middleName,
                                result.fullName.familyName,
                                result.fullName.nameSuffix,
                            ]
                                .filter(item => !StringUtils.isEmpty(item))
                                .join(' ')) ??
                        result.fullName?.nickname ??
                        undefined,
                });

                if (!res.token) {
                    if (!StringUtils.isEmpty(res.auth_token)) {
                        this.internal.needRegister = true;
                        this.internal.showPhoneLoginModal = true;
                        this.internal.registerToken = res.auth_token;
                    }
                } else {
                    await this.#login(res.token.jwt_token);
                }
            }
            console.log('appleLogin result', result);
        }
    };

    public readonly phoneLogin = async () => {
        if (await this.#checkCanLogin()) {
            const res = await this.#apiService.call.auth.verify_code({
                phone_number: this.internal.phoneNum,
                code: this.internal.checkCode,
                scene: 'login',
                temp_auth_token: this.internal.registerToken ?? undefined,
            });
            if (res.is_valid && !StringUtils.isEmpty(res.jwt_token)) {
                await this.#login(res.jwt_token);
            } else {
                this.emitEvent('loginFail', res.message);
            }
        }
    };

    public readonly openPhoneLoginModal = () => {
        // console.log('myPhoneNumLogin', '152xxxxxxx');
        this.internal.showPhoneLoginModal = true;
        // this.#mockLogin();
    };

    public readonly hidePhoneLoginModal = () => {
        this.internal.showPhoneLoginModal = false;
        this.internal.needRegister = false;
        this.internal.registerToken = null;
    };

    public readonly setPhoneNum = (phoneNum: string) => {
        this.internal.phoneNum = phoneNum;
    };

    public readonly setCheckCode = (checkCode: string) => {
        this.internal.checkCode = checkCode;
    };

    public readonly getCheckCode = async () => {
        if (this.internal.canGetCheckCode) {
            this.internal.getCheckCodeCountdown =
                Settings.maxGetCheckCodeCountdown;
            const timer = setInterval(() => {
                this.internal.getCheckCodeCountdown--;
                if (this.internal.getCheckCodeCountdown <= 0) {
                    clearInterval(timer);
                }
            }, Settings.getCheckCodeCountdownChangeDurationMS);

            await this.#apiService.call.auth.send_code({
                phone_number: this.internal.phoneNum,
                scene: 'login',
            });
        }
    };

    public readonly concatUs = () => {
        this.#linkingService.open(Settings.emailLink);
    };

    public readonly toTermsOfService = () => {
        this.#routerController.navigate(RouterEnums.RouteName.PDF, {
            pdfKind: RouterEnums.PDFPageKind.TermsOfService,
        });
    };

    public readonly toPrivacyPolicy = () => {
        this.#routerController.navigate(RouterEnums.RouteName.PDF, {
            pdfKind: RouterEnums.PDFPageKind.PrivacyPolicy,
        });
    };

    public readonly toHome = () => {
        this.#routerController.resetToHome();
    };

    public readonly toggleAgree = () => {
        this.internal.agree = !this.internal.agree;
    };
}
