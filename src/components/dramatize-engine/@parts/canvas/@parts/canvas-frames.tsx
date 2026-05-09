import { useEffect, useRef, useState } from 'react';

import { useInjectRenderController, useReactive } from '$/hooks';
import type { DramatizeTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import type { CanavsObjRef } from '../../@types';
import { FramesElement, type FramesElementProps } from '../../webgpu-scope';

type ElementProps = LibTypes.FrozenOmit<
    FramesElementProps,
    | 'dry'
    | 'files'
    | 'height'
    | 'id'
    | 'isSingle'
    | 'onAnimationEnd'
    | 'onReady'
    | 'parentId'
    | 'ref'
    | 'resourceId'
    | 'width'
>;

type Props = LibTypes.FrozenDefine<{
    id: DramatizeTypes.ElementId,
}>;

export const CanvasFrames: ReactTypes.FC<Props> = optimize(({ id }) => {
    const ref = useRef<CanavsObjRef>(null);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => {
        const element =
            ctrl.state.narrative?.context.framesElementRecord[id] ??
            ctrl.state.nextNarrative?.context.framesElementRecord[id];
        const controlShow = element?.state.controlShow;
        const style = element?.state.style;
        return {
            element,
            isDry: ctrl.state.isDry,
            show: !!controlShow && !!style,
            style,
            translate: element?.state.translate,
            anchor: element?.state.anchor,
            play: !!element?.state.play,
            loop: !!element?.state.loop,
            speed: element?.state.speed,
        };
    });

    const element = reactiveState.element;

    const [elementProps, setElementProps] = useState<ElementProps | undefined>(
        element && {
            show: reactiveState.show,
            style: reactiveState.style,
            translate: reactiveState.translate ?? null,
            anchor: reactiveState.anchor ?? null,
            play: reactiveState.play,
            loop: reactiveState.loop,
            speed: reactiveState.speed ?? null,
            animation: null,
            specialEffects: [],
        },
    );

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, show: reactiveState.show });
    }, [reactiveState.show]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, style: reactiveState.style, show: reactiveState.show });
    }, [reactiveState.style]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, translate: reactiveState.translate ?? null });
    }, [reactiveState.translate]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, anchor: reactiveState.anchor ?? null });
    }, [reactiveState.anchor]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, play: reactiveState.play });
    }, [reactiveState.play]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, loop: reactiveState.loop });
    }, [reactiveState.loop]);

    useEffect(() => {
        if (!elementProps) return;
        setElementProps(prev => prev && { ...prev, speed: reactiveState.speed ?? null });
    }, [reactiveState.speed]);

    useEffect(() => {
        element?.addEventListener('breakAnimations', () =>
            ref.current?.breakAnimations());

        element?.addEventListener('removeSpecialEffects', () => {
            ref.current?.removeSpecialEffects();
        });

        element?.addEventListener('runVisualAnimation', (animation: any) =>
            setElementProps(
                (prevState: any) =>
                    prevState &&
                    ({
                        ...prevState,
                        animation,
                    } satisfies ElementProps),
            ));

        element?.addEventListener('runVisualSpecialEffect', (specialEffect: any) =>
            setElementProps(
                (prevState: any) =>
                    prevState &&
                    ({
                        ...prevState,
                        specialEffects: [specialEffect],
                    } satisfies ElementProps),
            ));

        return () => element?.removeAllEventListeners();
    }, [element]);

    if (!elementProps || !element) {
        return null;
    }

    return (
        <FramesElement
            id={id}
            ref={ref}
            dry={reactiveState.isDry}
            resourceId={element.resourceId}
            files={element.files}
            width={element.width}
            height={element.height}
            parentId={element.parentId}
            isSingle={element.isSingle}
            onAnimationEnd={ctrl.setCurrentAnimationStyle}
            onReady={ctrl.elementReady}
            {...elementProps}
        />
    );
});
