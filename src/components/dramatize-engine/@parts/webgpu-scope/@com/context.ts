import { createContext, useContext } from 'react';

import type { World } from './ecs/world';

export type RenderContextValue = LibTypes.VarDefine<{
    world: World,
}>;

export const RenderContext = createContext<RenderContextValue | null>(null);

export const useRenderContext = () => {
    const context = useContext(RenderContext);
    if (!context) {
        throw new Error(
            'useRenderContext must be used within a RenderProvider',
        );
    }
    return context;
};
