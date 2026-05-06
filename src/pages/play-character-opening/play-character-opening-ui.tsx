import { useReactive, useRegisterRenderController } from '$/hooks';
import { ActivityIndicator } from '$/uis/primitives';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { PlayCharacterOpeningController } from './play-character-opening-controller';

export const PlayCharacterOpeningPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayCharacterOpeningController);

    const state = useReactive(() => ({
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
    }));

    return (
        <RenderParentProvider>
            <div className="relative w-full h-full bg-bg-page overflow-hidden">

                {/* Engine placeholder */}
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

                {/* Skip button — top right */}
                <div className="absolute top-4 right-4 z-20">
                    <Button
                        onPress={ctrl.toDetails}
                        kind="Blur"
                        size="small"
                        className="bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 rounded-full px-4"
                    >
                        跳过
                    </Button>
                </div>
            </div>
        </RenderParentProvider>
    );
});
