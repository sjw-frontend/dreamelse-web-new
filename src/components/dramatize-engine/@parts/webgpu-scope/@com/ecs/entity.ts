import {
    Anchor,
    Animated,
    type Component,
    Filter,
    Frames,
    Material,
    Misc,
    Parent,
    Position,
    PostProcessing,
    Size,
    Texture,
    Transform,
} from './component';

const withSetterProxy = <T extends Component>(
    instance: T,
    entity: Map<string, Component>,
): T => {
    // eslint-disable-next-line @typescript-eslint/no-misused-spread
    const defaultValues = { ...instance };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const componentClass = instance.constructor as typeof Component;

    return new Proxy(instance, {
        set(target, prop, value, receiver) {
            if (value === undefined) {
                return true;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const defaultValue = defaultValues[prop as keyof T];
            Reflect.set(target, prop, value ?? defaultValue, receiver);
            const animationKey = Animated.createComponentMeta(
                componentClass,
                String(prop),
            );
            entity.delete(animationKey);

            return true;
        },
    });
};

const SPRITE_COMPOSITION = [
    Position,
    Size,
    Transform,
    Misc,
    Texture,
    Material,
    Filter,
    Parent,
    Anchor,
] as const;

type SpriteComponents = {
    [K in (typeof SPRITE_COMPOSITION)[number] as Lowercase<
        (K & { name: string })['name']
    >]: InstanceType<K>;
};

export const createSprite = () => {
    const entity = new Map<string, Component>();
    const proxyEntity = new Map<string, Component>();

    for (const ComponentClass of SPRITE_COMPOSITION) {
        const component = new ComponentClass();
        entity.set(ComponentClass.componentName, component);

        const proxyedComponent = withSetterProxy(component, entity);
        proxyEntity.set(ComponentClass.componentName, proxyedComponent);
    }

    return { entity, proxyEntity, ...ensureSprite(proxyEntity) };
};

export const ensureSprite = (entity: Map<string, Component>) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    Object.fromEntries(
        SPRITE_COMPOSITION.map(ComponentClass => [
            ComponentClass.componentName.toLowerCase(),
            ComponentClass.ensureType(entity.get(ComponentClass.componentName)),
        ]),
    ) as SpriteComponents;

const FRAMESEQ_COMPOSITION = [
    Position,
    Size,
    Transform,
    Misc,
    Texture,
    Material,
    Filter,
    Frames,
    Parent,
    Anchor,
] as const;

type FrameSeqComponents = {
    [K in (typeof FRAMESEQ_COMPOSITION)[number] as Lowercase<
        (K & { name: string })['name']
    >]: InstanceType<K>;
};

export const ensureFrameSeq = (entity: Map<string, Component>) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    Object.fromEntries(
        FRAMESEQ_COMPOSITION.map(ComponentClass => [
            ComponentClass.componentName.toLowerCase(),
            ComponentClass.ensureType(entity.get(ComponentClass.componentName)),
        ]),
    ) as FrameSeqComponents;

export const createFrameSeq = () => {
    const entity = new Map<string, Component>();
    const proxyEntity = new Map<string, Component>();

    for (const ComponentClass of FRAMESEQ_COMPOSITION) {
        const component = new ComponentClass();
        entity.set(ComponentClass.componentName, component);

        const proxyedComponent = withSetterProxy(component, entity);
        proxyEntity.set(ComponentClass.componentName, proxyedComponent);
    }

    return { entity, proxyEntity, ...ensureFrameSeq(proxyEntity) };
};

const CONTAINER_COMPOSITION = [Position, Transform, Misc, Parent] as const;

type ContainerComponents = {
    [K in (typeof CONTAINER_COMPOSITION)[number] as Lowercase<
        (K & { name: string })['name']
    >]: InstanceType<K>;
};

export const ensureContainer = (entity: Map<string, Component>) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    Object.fromEntries(
        CONTAINER_COMPOSITION.map(ComponentClass => [
            ComponentClass.componentName.toLowerCase(),
            ComponentClass.ensureType(entity.get(ComponentClass.componentName)),
        ]),
    ) as ContainerComponents;

export const createContainer = () => {
    const entity = new Map<string, Component>();
    const proxyEntity = new Map<string, Component>();

    for (const ComponentClass of CONTAINER_COMPOSITION) {
        const component = new ComponentClass();
        entity.set(ComponentClass.componentName, component);

        const proxyedComponent = withSetterProxy(component, entity);
        proxyEntity.set(ComponentClass.componentName, proxyedComponent);
    }

    return { entity, proxyEntity, ...ensureContainer(proxyEntity) };
};

const SCENE_COMPOSITION = [PostProcessing] as const;

type SceneComponents = {
    [K in (typeof SCENE_COMPOSITION)[number] as Lowercase<
        (K & { name: string })['name']
    >]: InstanceType<K>;
};

export const ensureScene = (entity: Map<string, Component>) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    Object.fromEntries(
        SCENE_COMPOSITION.map(ComponentClass => [
            ComponentClass.componentName.toLowerCase(),
            ComponentClass.ensureType(entity.get(ComponentClass.componentName)),
        ]),
    ) as SceneComponents;

export const createScene = () => {
    const entity = new Map<string, Component>();
    const proxyEntity = new Map<string, Component>();

    for (const ComponentClass of SCENE_COMPOSITION) {
        const component = new ComponentClass();
        entity.set(ComponentClass.componentName, component);

        const proxyedComponent = withSetterProxy(component, entity);
        proxyEntity.set(ComponentClass.componentName, proxyedComponent);
    }

    return { entity, proxyEntity, ...ensureScene(proxyEntity) };
};
