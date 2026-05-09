// @ts-nocheck
import { useListenEvent, useReactive, useRegisterRenderController } from '$/hooks';
import { usePopup } from '$/hooks';
import { optimize } from '$/view';

import { I18nTexts, Settings } from './cancel-account-const';
import { CancelAccountController } from './cancel-account-controller';

export const CancelAccountPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CancelAccountController);
    const popup = usePopup();

    const state = useReactive(() => ({
        maskedPhoneNum: ctrl.state.maskedPhoneNum,
        checkCode: ctrl.state.checkCode,
        canGetCheckCode: ctrl.state.canGetCheckCode,
        canSubmit: ctrl.state.canSubmit,
        getCheckCodeCountdown: ctrl.state.getCheckCodeCountdown,
        isSubmitting: ctrl.state.isSubmitting,
    }));

    useListenEvent(ctrl, 'sendCodeFailed', () => popup.showToast('发送验证码失败'));
    useListenEvent(ctrl, 'invalidPhone', () => popup.showToast('手机号格式不正确'));
    useListenEvent(ctrl, 'invalidCheckCode', () => popup.showToast('验证码错误'));
    useListenEvent(ctrl, 'success', () => { popup.showToast('账号已注销'); ctrl.back?.(); });

    const countdownLabel =
        state.getCheckCodeCountdown > 0
            ? `${state.getCheckCodeCountdown}s`
            : I18nTexts.getCode;

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 px-4 pt-5 overflow-y-auto">
                    <h1 className="text-text text-xl font-semibold leading-6">{I18nTexts.pageTitle}</h1>
                    <p className="mt-2 text-text/75 text-sm font-light leading-[18px]">{I18nTexts.desc}</p>

                    <div className="mt-4 h-[60px] flex flex-row items-center gap-[11px] px-4 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                        <span className="text-text/20 text-xl font-normal">{I18nTexts.phonePrefix}</span>
                        <span className="flex-1 text-white/10 text-xl">
                            {state.maskedPhoneNum || I18nTexts.phonePlaceholder}
                        </span>
                    </div>

                    <div className="mt-3 h-[60px] flex flex-row items-center gap-[11px] px-4 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder={I18nTexts.codePlaceholder}
                            value={state.checkCode}
                            onChange={e => ctrl.setCheckCode(e.target.value.slice(0, Settings.checkCodeMaxLength))}
                            className="flex-1 bg-transparent text-text text-xl outline-none placeholder:text-text/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            type="button"
                            onClick={ctrl.getCheckCode}
                            disabled={!state.canGetCheckCode}
                            className="text-text text-xl font-medium disabled:opacity-20 active:opacity-70 transition-opacity shrink-0"
                        >
                            {countdownLabel}
                        </button>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="px-4 pt-2.5 pb-4 bg-bg-card">
                    <button
                        type="button"
                        onClick={ctrl.submit}
                        disabled={!state.canSubmit || state.isSubmitting}
                        className="w-full h-14 rounded-2xl bg-red-500 disabled:bg-[#E6E6E6] disabled:text-gray-400 text-white text-lg font-medium active:opacity-80 transition-all"
                    >
                        {state.isSubmitting ? '提交中...' : I18nTexts.confirmSubmit}
                    </button>
                </div>
            </div>
        </RenderParentProvider>
    );
});
