import { useReactive } from '$/hooks';
import { WorldLineList } from '$/components/world-line-list/world-line-list-ui';
import { optimize } from '$/view';
import type { MeController } from '../me-controller';

export const PlayList = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const state = useReactive(() => ({
        ids: ctrl.state.playScript.ids as readonly string[],
    }));

    return (
        <WorldLineList
            ids={state.ids as string[]}
            onEndReached={ctrl.requestPlayList}
            onPressItem={ctrl.onPressPlayedScript}
            onRefresh={ctrl.refreshPlayList}
        />
    );
});
