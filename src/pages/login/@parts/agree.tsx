import { useCallback } from 'react';
import { useInjectRenderController, useReactive } from '$/hooks';
import { Radio } from '$/uis/radio/radio-ui';
import { optimize } from '$/view';
import { LoginController } from '../login-controller';

export const Agree = optimize(({ ctrl }: { ctrl?: InstanceType<typeof LoginController> }) => {
    const injected = useInjectRenderController(LoginController);
    const c = ctrl ?? injected;

    const state = useReactive(() => ({ agree: c.state.agree }));

    const handleToTermsOfService = useCallback(() => c.toTermsOfService(), [c]);
    const handleToPrivacyPolicy = useCallback(() => c.toPrivacyPolicy(), [c]);

    return (
        <div
            onClick={c.toggleAgree}
            className="flex flex-row items-center justify-center w-full cursor-pointer"
            style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, marginTop: 20 }}
        >
            <Radio
                checked={state.agree}
            />
            <span
                className="ml-2 text-xs leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.45)' }}
            >
                已阅读并同意{' '}
                <span
                    className="text-white"
                    onClick={e => { e.stopPropagation(); handleToTermsOfService(); }}
                >
                    服务协议
                </span>
                {' '}和{' '}
                <span
                    className="text-white"
                    onClick={e => { e.stopPropagation(); handleToPrivacyPolicy(); }}
                >
                    隐私政策
                </span>
            </span>
        </div>
    );
});
