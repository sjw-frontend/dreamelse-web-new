import { useEffect, useRef, useState } from 'react';

import { useInjectRenderController, useReactive } from '$/hooks';
import type { DramatizeTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';
import type { CanavsObjRef } from '../../@types';
import { ImageElement, type ImageElementProps } from '../../webgpu-scope';

type ElementProps = LibTypes.FrozenOmit<
    ImageElementProps,
    | 'dry'
    | 'file'
    | 'height'
    | 'id'
    | 'isSingle'
    | 'onAnimationEnd'
    | 'onReady'
    | 'parentId'
    | 'ref'
    | 'width'
>;

type Props = LibTypes.FrozenDefine<{
    id: DramatizeTypes.ElementId,
}>;

export const CanvasImage: ReactTypes.FC<Props> = optimize(({ id }) => {
    const ref = useRef<CanavsObjRef>(null);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => {
        const element =
            ctrl.state.narrative?.context.imageElementRecord[id] ??
            ctrl.state.nextNarrative?.context.imageElementRecord[id];
        const controlShow = element?.state.controlShow;
        const style = element?.state.style;
        return {
            element,
            isDry: ctrl.state.isDry,
            show: !!controlShow && !!style,
            style,
            translate: element?.state.translate,
            anchor: element?.state.anchor,
        };
    });

    const element = reactiveState.element;

    const [elementProps, setElementProps] = useState<ElementProps | undefined>(
        element && {
            show: reactiveState.show,
            style: reactiveState.style,
            translate: reactiveState.translate ?? null,
            anchor: reactiveState.anchor ?? null,
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
        element?.addEventListener('breakAnimations', () =>
            ref.current?.breakAnimations());

        element?.addEventListener('removeSpecialEffects', () => {
            ref.current?.removeSpecialEffects();
        });

        element?.addEventListener('runVisualAnimation', (animation: any) => {
            setElementProps(
                (prevState: any) =>
                    prevState &&
                    ({
                        ...prevState,
                        animation,
                    } satisfies ElementProps),
            );
        });

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
        <ImageElement
            id={id}
            ref={ref}
            dry={reactiveState.isDry}
            file={element.file}
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
