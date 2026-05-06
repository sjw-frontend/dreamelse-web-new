import { useReactive } from '$/hooks';
import { useWaterfallContentWidth } from '$/pages/home/@com';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { optimize } from '$/view';
import type { MeController } from '../me-controller';

export const PlayList = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const itemContentWidth = useWaterfallContentWidth();
    const state = useReactive(() => ({
        ids: ctrl.state.playScript.ids as readonly string[],
    }));

    return (
        <ScriptWaterfall
            scriptIds={state.ids}
            itemContentWidth={itemContentWidth}
            onEndReached={ctrl.requestPlayList}
            sceneKey="me-play"
            bottomRightButton="more"
        />
    );
});
