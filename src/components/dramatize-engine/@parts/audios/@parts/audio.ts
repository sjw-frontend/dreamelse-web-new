// @ts-nocheck
import { type AudioStatus, useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';

import { useInjectRenderController, useReactive } from '$/hooks';
import type { DramatizeTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import { usePlay } from '../@com';

type Props = LibTypes.FrozenDefine<{
    element: DramatizeTypes.DirectorAudioElement,

    volumeFade: LibTypes.Nullable<boolean>,

    onReady: LibTypes.Func<void, [id: DramatizeTypes.ElementId]> | null,
    onFinish: LibTypes.Func<void, []> | null,
}>;

export const Audio: ReactTypes.FC<Props> = optimize(
    ({
        element,

        volumeFade,

        onReady,
        onFinish,
    }) => {
        const { id, file, state: elementState } = element;

        const ctrl = useInjectRenderController(DramatizeEngineController);

        const uri = useMemo(() => file.uri, []);

        const player = useAudioPlayer(uri);

        const reactiveState = useReactive(() => ({
            muted: !ctrl.state.play || ctrl.state.muted,
            play: elementState.play && ctrl.state.play,
            loop: elementState.loop,
            speed: (elementState.speed ?? 1) * ctrl.state.speed,
            volume: elementState.volume,
        }));

        const { play, loop, speed, volume, muted } = reactiveState;

        // console.log(
        //     '===Audio====',
        //     player,
        //     element,

        //     play,
        //     loop,
        //     speed,
        //     volume,

        //     volumeFade,
        // );

        const refProps = useRef({
            onReady,
            onFinish,
        });

        useMemo(() => {
            refProps.current = {
                onReady,
                onFinish,
            };
        }, [onReady, onFinish]);

        usePlay(player, {
            play,
            loop,
            speed,
            volume: muted ? 0 : volume,

            volumeFade: volumeFade ?? undefined,
        });

        const playRef = useRef(play);
        useMemo(() => (playRef.current = play), [play]);

        useEffect(() => {
            const onReadyCb = (evt: AudioStatus) => {
                if (evt.isLoaded) {
                    refProps.current.onReady?.(id);
                    player.removeListener('playbackStatusUpdate', onReadyCb);
                }
            };
            const onFinishCb = (evt: AudioStatus) => {
                if (evt.didJustFinish) {
                    refProps.current.onFinish?.();
                    player.removeListener('playbackStatusUpdate', onFinishCb);
                }
            };

            if (player.isLoaded) {
                refProps.current.onReady?.(id);
            } else {
                player.addListener('playbackStatusUpdate', onReadyCb);
            }

            player.addListener('playbackStatusUpdate', onFinishCb);

            player.addListener('playbackStatusUpdate', evt => {
                if (playRef.current && !evt.playing && !evt.didJustFinish) {
                    player.play();
                }
            });
            return () => {
                player.removeAllListeners('playbackStatusUpdate');
                // player.pause();
            };
        }, []);

        return null;
    },
);
