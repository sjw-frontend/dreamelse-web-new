import type * as THREE from 'three/webgpu';

import { FramesNormalSpeedInterval } from '../../../../@com';

import { ROOT_CONTAINER_ID } from './misc';

export class Component {
    public static componentName: string = 'base' as const;
    public meta?: string;
}

export class Misc extends Component {
    public static componentName = 'misc' as const;
    public static ensureType(component: Component | undefined): Misc {
        if (!(component instanceof Misc)) {
            throw new Error('Component is not of type Misc');
        }
        return component;
    }

    public constructor() {
        super();
        this.visible = false;
    }

    public visible: boolean;
}

export class Position extends Component {
    public static componentName = 'position' as const;
    public static ensureType(component: Component | undefined): Position {
        if (!(component instanceof Position)) {
            throw new Error('Component is not of type Position');
        }
        return component;
    }

    public constructor(x?: number, y?: number, z?: number) {
        super();
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }

    public x: number;
    public y: number;
    public z: number;
}

export class Size extends Component {
    public static componentName = 'size' as const;
    public static ensureType(component: Component | undefined): Size {
        if (!(component instanceof Size)) {
            throw new Error('Component is not of type Size');
        }
        return component;
    }

    public constructor(width?: number, height?: number) {
        super();
        this.width = width ?? 1;
        this.height = height ?? 1;
    }

    public width: number;
    public height: number;
}

export class Animated<
    T extends Component,
    K extends keyof T = keyof T,
> extends Component {
    public static componentName = 'animated' as const;

    public static createComponentMeta(
        componentClass: new () => Component,
        property?: string,
    ): string {
        if (property === undefined || property === '') {
            return `${Animated.componentName}<${(componentClass as any).componentName ?? componentClass.name}>`;
        }
        return `${Animated.componentName}<${(componentClass as any).componentName ?? componentClass.name}:${property}>`;
    }

    public constructor(
        componentClass: new () => T,
        property: K,
        from: T[K],
        to: T[K],
        duration?: number,
        loop?: boolean,
        loopBack?: boolean,
        speed?: number,
        onComplete?: () => void,
    ) {
        super();
        this.progress = 0;
        this.duration = duration ?? 1000;
        this.property = property;
        this.from = from;
        this.to = to;
        this.targetComponentClass = componentClass;

        this.loop = loop ?? false;
        this.loopBack = loopBack ?? false;

        this.speed = speed ?? 1;

        this.onComplete = onComplete;

        this.meta = Animated.createComponentMeta(
            componentClass,
            String(property),
        );
    }

    public progress: number;
    public duration: number;

    public property: K;
    public from: T[K];
    public to: T[K];
    public targetComponentClass: new () => T;

    public loop: boolean;
    public loopBack: boolean;
    public speed: number;

    public onComplete?: () => void;

    public override meta: string;
}

export class Transform extends Component {
    public static componentName = 'transform' as const;
    public static ensureType(component: Component | undefined): Transform {
        if (!(component instanceof Transform)) {
            throw new Error('Component is not of type Transform');
        }
        return component;
    }

    public constructor(
        scale?: number,
        rotation?: number,
        x?: number,
        y?: number,
    ) {
        super();
        this.scale = scale ?? 1;
        this.rotation = rotation ?? 0;
        this.x = x ?? 0;
        this.y = y ?? 0;
    }

    public scale: number;
    public rotation: number;
    public x: number;
    public y: number;
}

export class Texture extends Component {
    public static componentName = 'texture' as const;
    public static ensureType(component: Component | undefined): Texture {
        if (!(component instanceof Texture)) {
            throw new Error('Component is not of type Texture');
        }
        return component;
    }

    public constructor() {
        super();
        this.image = null;
        this.enable = true;
    }

    public image: THREE.Texture | null;
    public enable: boolean;
}

export class TextureRef extends Component {
    public static componentName = 'texture-ref' as const;
    public static ensureType(component: Component | undefined): TextureRef {
        if (!(component instanceof TextureRef)) {
            throw new Error('Component is not of type TextureRef');
        }
        return component;
    }

    public constructor(id?: string) {
        super();
        this.id = id;
    }

    public id?: string;
}

export class Frames extends Component {
    public static componentName = 'frames' as const;
    public static ensureType(component: Component | undefined): Frames {
        if (!(component instanceof Frames)) {
            throw new Error('Component is not of type Frames');
        }
        return component;
    }

    public constructor() {
        super();
        this.images = [];
        this.index = 0;
        this.interval = FramesNormalSpeedInterval;
        this.elasped = 0;

        this.loop = true;
        this.play = false;
    }

    public images: LibTypes.VarArr<THREE.Texture>;
    public index: number;
    public interval: number;
    public elasped: number;

    public loop: boolean;
    public play: boolean;
}

export class Material extends Component {
    public static componentName = 'material' as const;
    public static ensureType(component: Component | undefined): Material {
        if (!(component instanceof Material)) {
            throw new Error('Component is not of type Material');
        }
        return component;
    }

    public constructor(opacity?: number, brightness?: number, color?: string) {
        super();
        this.opacity = opacity ?? 1;
        this.brightness = brightness ?? 1;
        this.color = color ?? '#ffffff';
    }

    public opacity: number;
    public brightness: number;
    public color: string;
}

export class Filter extends Component {
    public static componentName = 'filter' as const;
    public static ensureType(component: Component | undefined): Filter {
        if (!(component instanceof Filter)) {
            throw new Error('Component is not of type Filter');
        }
        return component;
    }

    public constructor(blur?: number) {
        super();
        this.blur = blur ?? 0;
    }

    public blur: number;
}

export class Parent extends Component {
    public static componentName = 'parent' as const;
    public static ensureType(component: Component | undefined): Parent {
        if (!(component instanceof Parent)) {
            throw new Error('Component is not of type Parent');
        }
        return component;
    }

    public constructor(parentId?: string) {
        super();
        this.id = parentId ?? ROOT_CONTAINER_ID;
    }

    public id: string;
}

export class PostProcessing extends Component {
    public static componentName = 'post-processing' as const;
    public static ensureType(component: Component | undefined): PostProcessing {
        if (!(component instanceof PostProcessing)) {
            throw new Error('Component is not of type PostProcessing');
        }
        return component;
    }

    public constructor(
        color?: string,
        opacity?: number,
        blur?: number,
        brightness?: number,
        sharpness?: number,
    ) {
        super();
        this.color = color ?? '#ffffff';
        this.opacity = opacity ?? 1;
        this.blur = blur ?? 0;
        this.brightness = brightness ?? 1;
        this.sharpness = sharpness ?? 0;
    }

    public color: string;
    public opacity: number;
    public blur: number;
    public brightness: number;
    public sharpness: number;
}

export class SinusoidalShaking extends Component {
    public static componentName = 'sinusoidal-shaking' as const;
    public static ensureType(
        component: Component | undefined,
    ): SinusoidalShaking {
        if (!(component instanceof SinusoidalShaking)) {
            throw new Error('Component is not of type SinusoidalShaking');
        }
        return component;
    }

    public constructor(amplitude?: number, frequency?: number) {
        super();
        this.amplitude = amplitude ?? 1;
        this.speed = frequency ?? 1;
        this.elapsed = 0;

        this.offsetX = 0;
        this.offsetY = 0;
    }

    public amplitude: number;
    public speed: number;
    public elapsed: number;
    public offsetX: number;
    public offsetY: number;
}

export class Anchor extends Component {
    public static componentName = 'anchor' as const;
    public static ensureType(component: Component | undefined): Anchor {
        if (!(component instanceof Anchor)) {
            throw new Error('Component is not of type Anchor');
        }
        return component;
    }

    public constructor(x?: number, y?: number) {
        super();
        this.x = x ?? 0;
        this.y = y ?? 0;
    }

    public x: number;
    public y: number;
}
