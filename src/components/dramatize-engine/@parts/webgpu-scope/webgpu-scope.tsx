import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';

import { DRAMATIZE } from '$/consts';

import { RenderContext, type RenderContextValue } from './@com';
import { World } from './@com/ecs/world';

export const WebGPUScope = ({ children }: PropsWithChildren) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const [renderContext, setRenderContext] =
        useState<RenderContextValue | null>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;

        const cssWidth =
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
        const cssHeight = Math.round(cssWidth / DRAMATIZE.ScreenWHRatio);

        console.log('[WebGPUScope] canvas size:', cssWidth, cssHeight, 'canvas.clientWidth:', canvas.clientWidth, 'parent:', canvas.parentElement?.clientWidth);

        const renderer = new THREE.WebGPURenderer({
            alpha: true,
            antialias: true,
            canvas,
        } as ConstructorParameters<typeof THREE.WebGPURenderer>[0]);

        const dpr = window.devicePixelRatio !== 0 ? window.devicePixelRatio : 1;

        const world = new World(
            { present: () => {} },
            renderer,
            cssWidth,
            cssHeight,
        );

        renderer.setPixelRatio(dpr);
        renderer.setSize(cssWidth, cssHeight, false);

        setRenderContext({ world });
        world.run().then(() => {
            console.log('[WebGPUScope] renderer initialized, backend:', (renderer as any).backend?.constructor?.name);
        }).catch(e => {
            console.error('[WebGPUScope] renderer init failed:', e);
        });

        return () => {
            setRenderContext(null);
            world.clearWorld();
        };
    }, []);

    return (
        <>
            <canvas
                ref={ref}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    aspectRatio: String(DRAMATIZE.ScreenWHRatio),
                    overflow: 'hidden',
                    imageRendering: 'crisp-edges',
                }}
            />
            {renderContext && (
                <RenderContext.Provider value={renderContext}>
                    {children}
                </RenderContext.Provider>
            )}
        </>
    );
};
