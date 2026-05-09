// @ts-nocheck
import { useEffect } from 'react';
import { DramatizeEngineController } from '$/component-controllers';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { DramatizeEngine } from '$/components/dramatize-engine/dramatize-engine-ui';
import { DramatizeLoading } from '$/components/dramatize-loading/dramatize-loading-ui';
import { PlayCharacterOpeningController } from './play-character-opening-controller';

export const PlayCharacterOpeningPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayCharacterOpeningController);
    const [engineCtrl, EngineProvider] = useRegisterRenderController(DramatizeEngineController);

    useEffect(() => {
        ctrl.setRelatedControllers({ dramatizeEngineCtrl: engineCtrl });
    }, []);

    const state = useReactive(() => ({
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
    }));

    return (
        <RenderParentProvider>
            <EngineProvider>
                <div className="relative w-full h-full bg-black overflow-hidden">

                    {/* DramatizeEngine */}
                    <DramatizeEngine />

                    {/* DramatizeLoading */}
                    <DramatizeLoading
                        show={state.showLoading}
                        kind="default"
                        showLottie={state.showLottie}
                    />

                    {/* 跳过按钮 */}
                    <div className="absolute top-4 right-4 z-20">
                        <Button
                            onPress={ctrl.skip}
                            kind="Blur"
                            size="small"
                        >
                            跳过
                        </Button>
                    </div>
                </div>
            </EngineProvider>
        </RenderParentProvider>
    );
});
