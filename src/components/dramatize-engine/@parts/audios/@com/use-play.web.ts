import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

import {
    AudioPlayStatusCheckIntervalMS,
    VolumeFadeDelayMS,
    VolumeFadeStep,
} from '../../../@com';

export const usePlay = (
    playerRef: RefObject<HTMLAudioElement | null>,
    props: LibTypes.FrozenDefine<{
        play?: boolean,
        loop?: boolean,
        volume?: number,
        volumeFade?: boolean,
        speed?: number,
    }>,
) => {
    const { play, loop, volumeFade, speed = 1, volume = 1 } = props;

    useEffect(() => {
        const audio = playerRef.current;
        if (!audio) return;
        audio.loop = !!loop;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.playbackRate = speed;
    }, [loop, volume, speed]);

    const volumeFadeTimerRef = useRef<LibTypes.TimerHandle>(null);
    const playTimerRef = useRef<LibTypes.TimerHandle>(null);

    useEffect(() => {
        const audio = playerRef.current;
        if (!audio) return;

        audio.volume = Math.max(0, Math.min(1, volume));
        clearInterval(volumeFadeTimerRef.current);
        clearInterval(playTimerRef.current);

        if (play) {
            if (volumeFade) {
                const targetVolume = audio.volume;
                audio.volume = 0;
                volumeFadeTimerRef.current = setInterval(() => {
                    audio.volume = Math.min(audio.volume + VolumeFadeStep, targetVolume);
                    if (audio.volume >= targetVolume) {
                        audio.volume = targetVolume;
                        clearInterval(volumeFadeTimerRef.current);
                    }
                }, VolumeFadeDelayMS);
            }
            audio.play().catch(() => {});
            playTimerRef.current = setInterval(() => {
                if (!audio.paused) {
                    clearInterval(playTimerRef.current);
                } else {
                    audio.play().catch(() => {});
                }
            }, AudioPlayStatusCheckIntervalMS);
        } else if (volumeFade) {
            const currentVolume = audio.volume;
            volumeFadeTimerRef.current = setInterval(() => {
                const newVolume = audio.volume - VolumeFadeStep;
                audio.volume = Math.max(0, newVolume);
                if (newVolume <= 0) {
                    audio.pause();
                    audio.volume = currentVolume;
                    clearInterval(volumeFadeTimerRef.current);
                }
            }, VolumeFadeDelayMS);
        } else {
            audio.pause();
        }

        return () => {
            clearInterval(volumeFadeTimerRef.current);
            clearInterval(playTimerRef.current);
        };
    }, [play]);
};
