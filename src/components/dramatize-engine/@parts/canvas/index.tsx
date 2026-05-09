import { useEffect, useMemo, useRef, useState } from 'react';

import { DRAMATIZE } from '$/consts';
import { useInjectRenderController, useReactive } from '$/hooks';
import type { ReactTypes } from '$/types';
import { ArrayUtils } from '$/utils';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import { WebGPUScope } from '../webgpu-scope';

import { CanvasFrames, CanvasImage, CanvasScene } from './@parts';

export const Canvas: ReactTypes.FC = optimize(() => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        imageElementList: ctrl.state.narrative?.state.imageElementList,
        nextImageElementList: ctrl.state.nextNarrative?.state.imageElementList,
        framesElementList: ctrl.state.narrative?.state.framesElementList,
        nextFramesElementList: ctrl.state.nextNarrative?.state.framesElementList,
    }));

    const imageElementList = useMemo(
        () =>
            ArrayUtils.toDeduplicate([
                ...(reactiveState.imageElementList ?? []),
                ...(reactiveState.nextImageElementList ?? []),
            ]),
        [reactiveState.imageElementList, reactiveState.nextImageElementList],
    );

    const framesElementList = useMemo(
        () =>
            ArrayUtils.toDeduplicate([
                ...(reactiveState.framesElementList ?? []),
                ...(reactiveState.nextFramesElementList ?? []),
            ]),
        [reactiveState.framesElementList, reactiveState.nextFramesElementList],
    );


    const gpuWidth = dimensions.height * DRAMATIZE.ScreenWHRatio;
    const gpuLeft = -(gpuWidth - dimensions.width) / 2;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                height: dimensions.height,
                width: gpuWidth,
                left: gpuLeft,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    backgroundColor: 'black',
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    position: 'absolute',
                }}
            />
            <WebGPUScope>
                <CanvasScene />
                {imageElementList.map(element => (
                    <CanvasImage id={element.id} key={element.id} />
                ))}
                {framesElementList.map(element => (
                    <CanvasFrames id={element.id} key={element.id} />
                ))}
            </WebGPUScope>
        </div>
    );
});
