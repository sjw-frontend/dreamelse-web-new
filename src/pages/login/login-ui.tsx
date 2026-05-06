import { useRegisterRenderController, useReactive } from '$/hooks';
import { ActivityIndicator } from '$/uis/primitives';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { ASSETS } from '$/consts';
import { Agree } from './@parts/agree';
import { PhoneModal } from './@parts/phone-modal';
import { LoginController } from './login-controller';
import { I18nTexts } from './login-const';

export const LoginPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(LoginController);
    const state = useReactive(() => ({ ready: ctrl.state.ready }));

    return (
        <RenderParentProvider>
            {/* bgCard = #1A1A1A, matches RN styles.view */}
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>

                {/* Background image: full width, aspect 363/390, absolute top */}
                <img
                    src={ASSETS.Login.bg}
                    alt=""
                    className="absolute top-0 left-0 w-full pointer-events-none"
                    style={{ aspectRatio: '363 / 390', objectFit: 'fill' }}
                />

                {/* Skip button: ButtonKindEnum.Special, size=tiny, absolute top+24 right-4 */}
                {state.ready && (
                    <div
                        className="absolute right-4 z-20"
                        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
                    >
                        <Button
                            kind="Special"
                            size="tiny"
                            onPress={ctrl.toHome}
                        >
                            {I18nTexts.skip}
                        </Button>
                    </div>
                )}

                {state.ready ? (
                    /* ScrollView equivalent: flex-1, paddingTop = safeTop, paddingBottom = safeBottom */
                    <div
                        className="relative flex flex-col w-full h-full overflow-y-auto"
                        style={{
                            paddingTop: 'env(safe-area-inset-top, 0px)',
                            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                        }}
                    >
                        {/* Logo: 112×112, centered, marginTop ~140 */}
                        <img
                            src={ASSETS.Logo.common}
                            alt="演我"
                            className="self-center rounded-3xl object-contain"
                            style={{ width: 112, height: 112, marginTop: 140 }}
                        />

                        {/* Title: fontSize 60, fontWeight 600, centered, marginTop 8, color textPrimary #EDEDED */}
                        <span
                            className="self-center font-semibold"
                            style={{ fontSize: 60, lineHeight: '72px', marginTop: 8, color: '#EDEDED' }}
                        >
                            演我
                        </span>

                        {/* Buttons: paddingHorizontal 24, marginTop 82, gap 12 */}
                        <div
                            className="flex flex-col w-full"
                            style={{ paddingLeft: 24, paddingRight: 24, marginTop: 82, gap: 12 }}
                        >
                            {/* Default Button kind=Black: bg-text-primary (#EDEDED), text bg-page (#0D0D0D) */}
                            <Button
                                onPress={ctrl.openPhoneLoginModal}
                                icon={<img src={ASSETS.Login.iconPhone} alt="" className="w-6 h-6" />}
                            >
                                {I18nTexts.phoneLogin}
                            </Button>
                        </div>

                        {/* Agree: marginTop 20 inside */}
                        <Agree ctrl={ctrl} />
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center w-full h-full">
                        <ActivityIndicator size="large" />
                    </div>
                )}

                <PhoneModal ctrl={ctrl} />
            </div>
        </RenderParentProvider>
    );
});
