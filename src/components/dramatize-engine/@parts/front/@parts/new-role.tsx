import { useInjectRenderController, useReactive } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';

export const NewRole: ReactTypes.FC = optimize(() => {
    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        show: ctrl.state.narrative?.state.showNewRoleProfile,
        name: ctrl.state.narrative?.state.director?.roles?.[0]?.roleName
            ?.replaceAll('(', '︵')
            ?.replaceAll(')', '︶'),
        desc: ctrl.state.narrative?.state.director?.roles?.[0]?.roleDesc,
    }));

    if (!reactiveState.show) {
        return null;
    }

    const textShadow = '0 2px 5px rgba(0,0,0,0.5)';

    return (
        <div
            style={{
                position: 'absolute',
                top: '30%',
                left: 40,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
            }}
        >
            {/* desc — vertical large text */}
            <span
                style={{
                    writingMode: 'vertical-rl',
                    color: '#EDEDED',
                    fontWeight: 800,
                    fontSize: 40,
                    lineHeight: '44px',
                    minWidth: 40,
                    textAlign: 'center',
                    textShadow,
                }}
            >
                {reactiveState.desc}
            </span>
            {/* divider */}
            <div style={{ width: 2, marginLeft: 10, marginRight: 10, alignSelf: 'stretch', backgroundColor: 'rgba(237,237,237,0.8)' }} />
            {/* name — vertical small text */}
            <span
                style={{
                    writingMode: 'vertical-rl',
                    color: '#EDEDED',
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: '16px',
                    minWidth: 14,
                    textAlign: 'center',
                    textShadow,
                }}
            >
                {reactiveState.name}
            </span>
        </div>
    );
});
