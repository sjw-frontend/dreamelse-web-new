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
        style =>
            setSceneProps(
                prevState =>
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
        suspend =>
            setSceneProps(
                prevState =>
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
        speed =>
            setSceneProps(
                prevState =>
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

    useListenEvent(ctrl, 'runSceneAnimation', animation =>
        setSceneProps(
            prevState =>
                ({
                    ...prevState,
                    animation,
                }) satisfies SceneProps,
        ));

    useListenEvent(ctrl, 'runSceneSpecialEffect', specialEffect =>
        setSceneProps(
            prevState =>
                ({
                    ...prevState,
                    specialEffects: [specialEffect],
                }) satisfies SceneProps,
        ));

    return <SceneContainer ref={ref} {...sceneProps} />;
});
