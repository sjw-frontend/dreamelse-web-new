import { useEffect } from 'react';
import { useInjectRenderController, useReactive, useRegisterRenderController } from '$/hooks';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { optimize } from '$/view';
import { useWaterfallContentWidth } from '../../@com/use-waterfall-content-width';
import { HomeController } from '../../home-controller';
import { CharacterFeedController } from './character-feed-controller';

type Props = { id: string };

export const CharacterFeed = optimize((props: Props) => {
    const homeCtrl = useInjectRenderController(HomeController);
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterFeedController, { id: props.id });

    useEffect(() => {
        ctrl.setRelatedControllers({ homeCtrl });
    }, []);

    const state = useReactive(() => ({
        info: ctrl.state.info,
        currentPlayWithId: homeCtrl.state.currentPlayWithId,
    }));

    const contentWidth = useWaterfallContentWidth();
    const isVisible = state.currentPlayWithId === props.id;

    return (
        <RenderParentProvider>
            <div className="flex flex-col flex-1 overflow-hidden mx-2" style={{ display: isVisible ? 'flex' : 'none' }}>
                <ScriptWaterfall
                    scriptIds={state.info?.scriptIds ?? []}
                    itemContentWidth={contentWidth}
                    onEndReached={ctrl.requestList}
                    onRefresh={ctrl.refresh}
                    onPressItem={homeCtrl.onPressScript}
                    bottomRightButton="collect"
                    showTags
                    sceneKey={`play_with-${props.id}`}
                />
            </div>
        </RenderParentProvider>
    );
});
