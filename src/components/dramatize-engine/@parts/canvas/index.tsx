// @ts-nocheck
import { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { DRAMATIZE } from '$/consts';
import { useInjectRenderController, useReactive, useStyles } from '$/hooks';
import type { ReactTypes, StyleTypes } from '$/types';
import { ArrayUtils } from '$/utils';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import { WebGPUScope } from '../webgpu-scope';

import { CanvasFrames, CanvasImage, CanvasScene } from './@parts';

export const Canvas: ReactTypes.FC = optimize(() => {
    const dimensions = useWindowDimensions();

    const styles = useStyles(stylesCreator, {
        height: dimensions.height,
        width: dimensions.width,
    });

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        imageElementList: ctrl.state.narrative?.state.imageElementList,
        nextImageElementList: ctrl.state.nextNarrative?.state.imageElementList,

        framesElementList: ctrl.state.narrative?.state.framesElementList,
        nextFramesElementList:
            ctrl.state.nextNarrative?.state.framesElementList,
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

    return (
        <View style={styles.gpu}>
            <View style={styles.bg} />
            <WebGPUScope>
                <CanvasScene />
                {imageElementList.map(element => (
                    <CanvasImage id={element.id} key={element.id} />
                ))}
                {framesElementList.map(element => (
                    <CanvasFrames id={element.id} key={element.id} />
                ))}
            </WebGPUScope>
        </View>
    );
});

const stylesCreator = (
    theme: StyleTypes.Theme,
    options: LibTypes.FrozenDefine<{
        height: number,
        width: number,
    }>,
) =>
    theme.transformStyles({
        bg: {
            backgroundColor: 'black',
            width: '100%',
            height: '100%',
            zIndex: 0,
        },
        gpu: {
            position: 'absolute',
            height: options.height,
            width: options.height * DRAMATIZE.ScreenWHRatio,
            get left() {
                return -(this.width - options.width) / 2;
            },

            overflow: 'hidden',
        },
    });
