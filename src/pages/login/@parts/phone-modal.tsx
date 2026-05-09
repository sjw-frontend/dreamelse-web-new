// @ts-nocheck
import { useListenEvent, useReactive } from '$/hooks';
import { usePopup } from '$/hooks';
import { cn } from '$/utils/cn';
import { Dialog } from '$/uis/dialog/dialog-ui';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { Agree } from './agree';
import type { LoginController } from '../login-controller';
import { I18nTexts, Settings } from '../login-const';

interface PhoneModalProps {
    ctrl: InstanceType<typeof LoginController>;
}

export const PhoneModal = optimize(({ ctrl }: PhoneModalProps) => {
    const popup = usePopup();

    const state = useReactive(() => ({
        showPhoneLoginModal: ctrl.state.showPhoneLoginModal,
        phoneNum: ctrl.state.phoneNum,
        checkCode: ctrl.state.checkCode,
        getCheckCodeCountdown: ctrl.state.getCheckCodeCountdown,
        needRegister: ctrl.state.needRegister,
    }));

    useListenEvent(ctrl, 'loginFail', () => popup.showToast('登录失败，请重试'));
    useListenEvent(ctrl, 'invalidCheckCode', () => popup.showToast('验证码错误'));
    useListenEvent(ctrl, 'invalidPhoneNum', () => popup.showToast('手机号格式不正确'));

    const phoneValid = state.phoneNum.length === Settings.phoneNumMaxLength;
    const countdownActive = state.getCheckCodeCountdown > 0;

    return (
        <Dialog
            active={state.showPhoneLoginModal}
            onClose={ctrl.hidePhoneLoginModal}
            position="bottom"
            showCloseIcon
        >
            {/* Title */}
            <h2 className="text-2xl font-semibold text-text-primary mt-2">
                {state.needRegister ? I18nTexts.needRegister : I18nTexts.phoneLogin}
            </h2>

            {/* Description */}
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {I18nTexts.phoneLooginDesc}
            </p>

            {/* Phone number input */}
            <div className="flex flex-row items-center gap-2 bg-bg-input rounded-xl h-12 px-3 mt-3">
                <span className="text-xl text-text-primary shrink-0 font-normal">
                    {I18nTexts.phonePrefix}
                </span>
                <div className="w-px h-5 bg-white/10 shrink-0" />
                <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={Settings.phoneNumMaxLength}
                    value={state.phoneNum}
                    onChange={e => ctrl.setPhoneNum(e.target.value.replace(/\D/g, ''))}
                    placeholder={I18nTexts.enterPhoneNum}
                    className="flex-1 bg-transparent outline-none border-none text-base text-text-primary placeholder:text-text-placeholder"
                />
            </div>

            {/* Verification code input */}
            <div className="flex flex-row items-center gap-2 bg-bg-input rounded-xl h-12 px-3 mt-3 mb-5">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={Settings.checkCodeMaxLength}
                    value={state.checkCode}
                    onChange={e => ctrl.setCheckCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={I18nTexts.enterCode}
                    className="flex-1 bg-transparent outline-none border-none text-base text-text-primary placeholder:text-text-placeholder"
                />
                <button
                    type="button"
                    onClick={ctrl.getCheckCode}
                    disabled={!phoneValid || countdownActive}
                    className={cn(
                        'shrink-0 text-xl font-normal px-2 transition-opacity duration-150',
                        phoneValid && !countdownActive
                            ? 'text-text-primary'
                            : 'text-text-primary opacity-20 cursor-not-allowed',
                    )}
                >
                    {countdownActive
                        ? `${state.getCheckCodeCountdown}s后重发`
                        : I18nTexts.getCode}
                </button>
            </div>

            {/* Login button: default kind=Black, no size = 60px height, matches RN */}
            <Button
                onPress={ctrl.phoneLogin}
                className="w-full"
            >
                {I18nTexts.login}
            </Button>

            {/* Agree */}
            <Agree ctrl={ctrl} />
        </Dialog>
    );
});
