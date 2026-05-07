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
    ({ element, volumeFade, onReady, onFinish }) => {
        const { id, file, state: elementState } = element;

        const ctrl = useInjectRenderController(DramatizeEngineController);

        const reactiveState = useReactive(() => ({
            muted: !ctrl.state.play || ctrl.state.muted,
            play: elementState.play && ctrl.state.play,
            loop: elementState.loop,
            speed: (elementState.speed ?? 1) * ctrl.state.speed,
            volume: elementState.volume,
        }));

        const audioRef = useRef<HTMLAudioElement | null>(null);
        const onReadyRef = useRef(onReady);
        const onFinishRef = useRef(onFinish);

        useMemo(() => {
            onReadyRef.current = onReady;
            onFinishRef.current = onFinish;
        }, [onReady, onFinish]);

        // Create HTMLAudioElement once
        useMemo(() => {
            const audio = new window.Audio(file.uri);
            audioRef.current = audio;

            const handleCanPlay = () => {
                onReadyRef.current?.(id);
                audio.removeEventListener('canplaythrough', handleCanPlay);
            };
            audio.addEventListener('canplaythrough', handleCanPlay);
            if (audio.readyState >= 3) {
                onReadyRef.current?.(id);
            }

            audio.addEventListener('ended', () => {
                onFinishRef.current?.();
            });

            return () => {
                audio.pause();
                audio.src = '';
            };
        }, []);

        usePlay(audioRef, {
            play: reactiveState.play,
            loop: reactiveState.loop,
            speed: reactiveState.speed,
            volume: reactiveState.muted ? 0 : (reactiveState.volume ?? 1),
            volumeFade: volumeFade ?? undefined,
        });

        return null;
    },
);
