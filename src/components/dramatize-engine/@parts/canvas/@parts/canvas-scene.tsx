import { useRef, useState } from 'react';

import { useInjectRenderController, useListenEvent, useWatch } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import type { CanavsObjRef } from '../../@types';
import { SceneContainer, type SceneContainerProps } from '../../webgpu-scope';

type SceneProps = LibTypes.DefineOmit<SceneContainerProps, 'ref'>;

const getNewSceneProps = (): SceneProps => ({
    style: {},
    surroundingShadow: {
        show: true,
        z: 1,
    },
    suspend: false,
    speed: null,

    animation: null,
    specialEffects: [],
});

export const CanvasScene: ReactTypes.FC = optimize(() => {
    const ctrl = useInjectRenderController(DramatizeEngineController);
    const ref = useRef<CanavsObjRef>(null);

    const [sceneProps, setSceneProps] =
        useState<SceneProps>(getNewSceneProps());

    useWatch(
        () => ctrl.state.narrative?.state.sceneStyle,
        (style: any) =>
            setSceneProps(
                (prevState: any) =>
                    ({
                        ...prevState,
                        style,
                    }) satisfies SceneProps,
            ),
        {
            immediate: true,
        },
    );

    useWatch(
        () => !ctrl.state.play,
        (suspend: any) =>
            setSceneProps(
                (prevState: any) =>
                    ({
                        ...prevState,
                        suspend,
                    }) satisfies SceneProps,
            ),
        {
            immediate: true,
        },
    );

    useWatch(
        () => ctrl.state.speed,
        (speed: any) =>
            setSceneProps(
                (prevState: any) =>
                    ({
                        ...prevState,
                        speed,
                    }) satisfies SceneProps,
            ),
        {
            immediate: true,
        },
    );

    useListenEvent(ctrl, 'reset', () => {
        ref.current?.breakAnimations();
        ref.current?.removeSpecialEffects();
        setSceneProps(getNewSceneProps());
    });

    useListenEvent(ctrl, 'breakSceneAnimations', () =>
        ref.current?.breakAnimations());

    useListenEvent(ctrl, 'removeSceneSpecialEffects', () => {
        ref.current?.removeSpecialEffects();
    });

    useListenEvent(ctrl, 'runSceneAnimation', (animation: any) =>
        setSceneProps(
            (prevState: any) =>
                ({
                    ...prevState,
                    animation,
                }) satisfies SceneProps,
        ));

    useListenEvent(ctrl, 'runSceneSpecialEffect', (specialEffect: any) =>
        setSceneProps(
            (prevState: any) =>
                ({
                    ...prevState,
                    specialEffects: [specialEffect],
                }) satisfies SceneProps,
        ));

    return <SceneContainer ref={ref} {...sceneProps} />;
});
