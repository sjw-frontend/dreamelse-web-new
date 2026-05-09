// @ts-nocheck
import { useEffect } from 'react';
import { DramatizeEngineController } from '$/component-controllers';
import { DramatizeEngine } from '$/components/dramatize-engine/dramatize-engine-ui';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { DramatizeLoading } from '$/components/dramatize-loading/dramatize-loading-ui';
import { PlayScriptOpeningController } from './play-script-opening-controller';

export const PlayScriptOpeningPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptOpeningController);
    const [engineCtrl, EngineProvider] = useRegisterRenderController(DramatizeEngineController);

    useEffect(() => {
        ctrl.setRelatedControllers({ dramatizeEngineCtrl: engineCtrl });
    }, []);

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
            <EngineProvider>
                <div className="relative w-full h-full bg-black overflow-hidden">

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

                    {/* DramatizeEngine — canvas + front (captions, options, etc.) */}
                    <DramatizeEngine
                        frontViewBottom={80}
                    />

                    {/* DramatizeLoading */}
                    <DramatizeLoading
                        show={state.showLoading}
                        kind="default"
                        showLottie={state.showLottie}
                    />

                    {/* Bottom controls */}
                    <div className="absolute bottom-6 left-4 z-20">
                        <button
                            type="button"
                            onClick={ctrl.onChangeSpeed}
                            className="h-10 px-4 rounded-full text-white text-sm font-semibold"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                        >
                            {speedLabel}
                        </button>
                    </div>

                    {/* Skip button — right bottom */}
                    <button
                        type="button"
                        onClick={ctrl.toScriptPreparePlay}
                        className="absolute bottom-6 right-3 z-20 h-12 px-[14px] rounded-3xl text-text-primary text-base font-semibold"
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                    >
                        跳过剧情
                    </button>
                </div>
            </EngineProvider>
        </RenderParentProvider>
    );
});
