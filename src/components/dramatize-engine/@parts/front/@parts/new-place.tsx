import { useInjectRenderController, useReactive } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';

export const NewPlace: ReactTypes.FC = optimize(() => {
    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        show: ctrl.state.narrative?.state.showNewPlaceProfile,
        name: ctrl.state.narrative?.state.director.place?.name,
        desc: ctrl.state.narrative?.state.director.place?.desc,
    }));

    if (!reactiveState.show) {
        return null;
    }

    const textShadow = '0 2px 5px rgba(0,0,0,0.5)';

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 200,
                left: 40,
                borderLeft: '6px solid #EDEDED',
                paddingLeft: 12,
            }}
        >
            <span
                style={{
                    display: 'block',
                    color: '#EDEDED',
                    fontWeight: 800,
                    fontSize: 40,
                    marginBottom: 6,
                    textShadow,
                    fontFamily: 'MiSans, Inter, sans-serif',
                }}
            >
                {reactiveState.name}
            </span>
            <span
                style={{
                    display: 'block',
                    color: '#EDEDED',
                    fontWeight: 600,
                    fontSize: 24,
                    textShadow,
                }}
            >
                {reactiveState.desc}
            </span>
        </div>
    );
});
