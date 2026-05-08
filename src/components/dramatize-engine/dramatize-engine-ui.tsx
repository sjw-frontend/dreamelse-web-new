// @ts-nocheck
import { useEffect } from 'react';
import { useInjectRenderController } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { Canvas, Front, type FrontProps } from './@parts';
import { Audios } from './@parts/audios';
import { DramatizeEngineController } from '$/component-controllers';

type Props = LibTypes.FrozenDefine<FrontProps>;

export const DramatizeEngine: ReactTypes.FC<Props> = optimize(props => {
    useInjectRenderController(DramatizeEngineController);

    useEffect(() => {
        let wakeLock: WakeLockSentinel | null = null;
        navigator.wakeLock?.request('screen').then(lock => { wakeLock = lock; }).catch(() => {});
        return () => { wakeLock?.release(); };
    }, []);

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }}
        >
            <Canvas />
            <Audios />
            {/* Front 在最后渲染，确保 z-index 最高 */}
            <Front {...props} />
        </div>
    );
});
