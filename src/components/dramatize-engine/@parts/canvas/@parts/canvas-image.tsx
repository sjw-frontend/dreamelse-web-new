import { useEffect, useRef, useState } from 'react';

import { useInjectRenderController, useReactive, useWatch } from '$/hooks';
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

    const reactiveState = useReactive(() => ({
        element:
            ctrl.state.narrative?.context.imageElementRecord[id] ??
            ctrl.state.nextNarrative?.context.imageElementRecord[id],
        isDry: ctrl.state.isDry,
    }));

    const element = reactiveState.element;
    const getShow = (
        controlShow: LibTypes.Nullable<boolean>,
        style: DramatizeTypes.DirectorVisualStyle | undefined,
    ) => !!controlShow && !!style;

    const [elementProps, setElementProps] = useState<ElementProps | undefined>(
        element && {
            show: false,
            style: element.state.style,
            translate: null,
            anchor: null,
            animation: null,
            specialEffects: [],
        },
    );

    useWatch(
        () => element?.state.controlShow,
        controlShow => {
            const show = getShow(controlShow, element?.state.style);
            setElementProps(
                prevState =>
                    prevState &&
                    ({
                        ...prevState,
                        show,
                    } satisfies ElementProps),
            );
        },
        {
            immediate: true,
        },
        [element],
    );

    useWatch(
        () => element?.state.style,
        style => {
            const show = getShow(element?.state.controlShow, style);
            setElementProps(
                prevState =>
                    prevState &&
                    ({
                        ...prevState,
                        show,
                        style,
                    } satisfies ElementProps),
            );
        },
        {
            immediate: true,
        },
        [element],
    );

    useWatch(
        () => element?.state.translate,
        translate =>
            setElementProps(
                prevState =>
                    prevState &&
                    ({
                        ...prevState,
                        translate,
                    } satisfies ElementProps),
            ),
        {
            immediate: true,
        },
        [element],
    );

    useWatch(
        () => element?.state.anchor,
        anchor =>
            setElementProps(
                prevState =>
                    prevState &&
                    ({
                        ...prevState,
                        anchor,
                    } satisfies ElementProps),
            ),
        {
            immediate: true,
        },
        [element],
    );

    useEffect(() => {
        element?.addEventListener('breakAnimations', () =>
            ref.current?.breakAnimations());

        element?.addEventListener('removeSpecialEffects', () => {
            ref.current?.removeSpecialEffects();
        });

        element?.addEventListener('runVisualAnimation', animation =>
            setElementProps(
                prevState =>
                    prevState &&
                    ({
                        ...prevState,
                        animation,
                    } satisfies ElementProps),
            ));

        element?.addEventListener('runVisualSpecialEffect', specialEffect =>
            setElementProps(
                prevState =>
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
