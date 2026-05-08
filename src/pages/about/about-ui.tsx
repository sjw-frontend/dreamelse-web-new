import { useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { APP } from '$/consts';

import { AboutController } from './about-controller';

export const AboutPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(AboutController);

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card relative">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3 z-10">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 15l-5-5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-text"
                            />
                        </svg>
                    </button>
                    <span className="text-text text-lg font-semibold">关于</span>
                </div>

                {/* Centered content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                    {/* App icon placeholder */}
                    <img src="/assets/images/logo.png" alt="演我" style={{ width: 68, height: 68, borderRadius: 14 }} />
                    <span className="text-text text-3xl font-semibold">演我</span>
                    <span className="text-text/48 text-[15px] font-normal tracking-wide">
                        版本 {APP.Version}
                    </span>
                </div>
            </div>
        </RenderParentProvider>
    );
});
