// @ts-nocheck
import type { AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import {
    AudioPlayStatusCheckIntervalMS,
    VolumeFadeDelayMS,
    VolumeFadeStep,
} from '../../../@com';

export const usePlay = (
    player: AudioPlayer,
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
        player.loop = !!loop;
        player.volume = volume;
        player.setPlaybackRate(speed);
    }, [loop, volume, speed]);

    const volumeFadeTimerRef = useRef<LibTypes.TimerHandle>(null);
    const playTimerRef = useRef<LibTypes.TimerHandle>(null);

    useEffect(() => {
        player.volume = volume;
        clearInterval(volumeFadeTimerRef.current);
        clearInterval(playTimerRef.current);
        if (play) {
            if (volumeFade) {
                const currentVolume = player.volume;
                player.volume = 0;
                volumeFadeTimerRef.current = setInterval(() => {
                    player.volume += VolumeFadeStep;
                    if (player.volume >= currentVolume) {
                        player.volume = currentVolume;
                        clearInterval(volumeFadeTimerRef.current);
                    }
                }, VolumeFadeDelayMS);
            }
            player.play();
            playTimerRef.current = setInterval(() => {
                if (player.playing) {
                    clearInterval(playTimerRef.current);
                } else {
                    player.play();
                }
            }, AudioPlayStatusCheckIntervalMS);
        } else if (volumeFade) {
            const currentVolume = player.volume;
            volumeFadeTimerRef.current = setInterval(() => {
                const newVolume = player.volume - VolumeFadeStep;
                // clamp to 0 to avoid HTMLMediaElement volume range error on web
                player.volume = Math.max(0, newVolume);
                if (newVolume <= 0) {
                    player.pause();
                    player.volume = currentVolume;
                    clearInterval(volumeFadeTimerRef.current);
                }
            }, VolumeFadeDelayMS);
        } else {
            player.pause();
        }

        return () => {
            clearInterval(volumeFadeTimerRef.current);
            clearInterval(playTimerRef.current);
        };
    }, [play]);
};
