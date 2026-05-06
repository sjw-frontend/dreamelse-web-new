import { useReactive } from '$/hooks';
import { useWaterfallContentWidth } from '$/pages/home/@com';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { optimize } from '$/view';
import type { MeController } from '../me-controller';

export const CreateList = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const itemContentWidth = useWaterfallContentWidth();
    const state = useReactive(() => ({
        ids: ctrl.state.createScript.ids as readonly string[],
    }));

    return (
        <ScriptWaterfall
            scriptIds={state.ids}
            itemContentWidth={itemContentWidth}
            onEndReached={ctrl.requestCreateList}
            sceneKey="me-create"
            isDraft={false}
            bottomRightButton="more"
        />
    );
});
