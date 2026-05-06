import { useReactive, useRegisterRenderController } from '$/hooks';
import { ActivityIndicator } from '$/uis/primitives';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { PlayScriptOpeningController } from './play-script-opening-controller';

export const PlayScriptOpeningPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptOpeningController);

    const state = useReactive(() => ({
        title: ctrl.state.title,
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
        speed: ctrl.state.speed,
    }));

    const speedLabel =
        state.speed === 1.5 ? '1.5x'
        : state.speed === 2 ? '2x'
        : state.speed === 0.75 ? '0.75x'
        : '1x';

    return (
        <RenderParentProvider>
            <div className="relative w-full h-full bg-bg-page overflow-hidden">

                {/* Header: title + close */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center px-4 pt-4 gap-3">
                    <h1 className="flex-1 text-xl font-bold text-text-primary truncate">
                        {state.title}
                    </h1>
                    <button
                        type="button"
                        onClick={ctrl.handleBack}
                        className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
                        aria-label="关闭"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Engine placeholder area */}
                <div className="absolute inset-0 bg-bg-page flex items-center justify-center">
                    {state.showLottie && (
                        <div className="flex flex-col items-center gap-4">
                            <ActivityIndicator size="large" color="#ABFF1A" />
                            <span className="text-text-secondary text-sm">加载中…</span>
                        </div>
                    )}
                </div>

                {/* Loading overlay */}
                {state.showLoading && !state.showLottie && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                        <ActivityIndicator size="large" color="#ABFF1A" />
                    </div>
                )}

                {/* Bottom controls */}
                <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-4">
                    {/* Speed toggle */}
                    <button
                        type="button"
                        onClick={ctrl.onChangeSpeed}
                        className="h-10 px-4 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                    >
                        {speedLabel}
                    </button>

                    {/* Skip button */}
                    <button
                        type="button"
                        onClick={ctrl.toScriptPreparePlay}
                        className="h-12 px-4 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-text-primary text-base font-semibold hover:bg-white/25 transition-colors"
                    >
                        跳过剧情
                    </button>
                </div>
            </div>
        </RenderParentProvider>
    );
});
