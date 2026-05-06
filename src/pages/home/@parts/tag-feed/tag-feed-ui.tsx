import { useEffect } from 'react';
import { useInjectRenderController, useReactive, useRegisterRenderController } from '$/hooks';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { optimize } from '$/view';
import { useWaterfallContentWidth } from '../../@com/use-waterfall-content-width';
import { HomeController } from '../../home-controller';
import { TagFeedController } from './tag-feed-controller';

type Props = { id: string };

export const TagFeed = optimize((props: Props) => {
    const homeCtrl = useInjectRenderController(HomeController);
    const [ctrl, RenderParentProvider] = useRegisterRenderController(TagFeedController, { id: props.id });

    useEffect(() => {
        ctrl.setRelatedControllers({ homeCtrl });
    }, []);

    const state = useReactive(() => ({
        info: ctrl.state.info,
        currentTagFeedId: homeCtrl.state.currentTagFeedId,
    }));

    const contentWidth = useWaterfallContentWidth();
    const isVisible = state.currentTagFeedId === props.id;

    if (!isVisible) return null;

    return (
        <RenderParentProvider>
            <ScriptWaterfall
                scriptIds={state.info?.scriptIds ?? []}
                itemContentWidth={contentWidth}
                onEndReached={ctrl.requestList}
                onRefresh={ctrl.refresh}
                onPressItem={homeCtrl.onPressScript}
                bottomRightButton="collect"
                showTags
                sceneKey={`world${state.info?.searchValue != null ? `-${state.info.searchValue}` : ''}`}
            />
        </RenderParentProvider>
    );
});
