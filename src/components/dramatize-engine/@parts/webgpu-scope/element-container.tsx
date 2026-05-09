/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useEffect, useMemo } from 'react';

import type { DramatizeTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';

import { useRenderContext } from './@com';
import { Animated, Position, Transform } from './@com/ecs/component';

type Props = LibTypes.FrozenDefine<{
    id: DramatizeTypes.UnitId,
    style: DramatizeTypes.UnitStyle,
    show: LibTypes.Nullable<boolean>,
    animated: LibTypes.Nullable<DramatizeTypes.UnitAnimated>,
    parentId: LibTypes.Nullable<DramatizeTypes.UnitId>,
}>;

export const ElementContainer: ReactTypes.FC<Props> = optimize(
    ({ id, style, animated, show, parentId }) => {
        const { world } = useRenderContext();
        const container = useMemo(() => world.registerContainer(id), []);

        useEffect(
            () => () => {
                world.cleanEntity(container.id);
            },
            [],
        );

        useEffect(() => {
            if (show) container.misc.visible = true;
            else container.misc.visible = false;
        }, [show]);

        useEffect(() => {
            if (parentId != null) container.parent.id = parentId;
        }, [parentId]);

        useEffect(() => {
            container.position.x = style.x!;
            container.position.y = style.y!;

            container.transform.rotation = style.rotation!;
            container.transform.scale = style.scale!;
            container.transform.x = style.translate?.x ?? 0;
            container.transform.y = style.translate?.y ?? 0;
        }, [style]);

        useEffect(() => {
            if (!animated) return;
            const loop =
                animated.repeat === 'default' ||
                animated.repeat === true ||
                animated.repeat === 'reverse';
            const loopback = animated.repeat === 'reverse';

            if (animated.style.x != null) {
                const anim = new Animated(
                    Position,
                    'x',
                    container.position.x,
                    animated.style.x,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animated.style.y != null) {
                const anim = new Animated(
                    Position,
                    'y',
                    container.position.y,
                    animated.style.y,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animated.style.scale != null) {
                const anim = new Animated(
                    Transform,
                    'scale',
                    container.transform.scale,
                    animated.style.scale,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animated.style.rotation != null) {
                const anim = new Animated(
                    Transform,
                    'rotation',
                    container.transform.rotation,
                    animated.style.rotation,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animated.style.translate?.x != null) {
                const anim = new Animated(
                    Transform,
                    'x',
                    container.transform.x,
                    animated.style.translate.x,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }

            if (animated.style.translate?.y != null) {
                const anim = new Animated(
                    Transform,
                    'y',
                    container.transform.y,
                    animated.style.translate.y,
                    animated.durationMS ?? 1000,
                    loop,
                    loopback,
                );
                world.registerComponent(container.id, anim);
            }
        }, [animated]);

        return <></>;
    },
);
