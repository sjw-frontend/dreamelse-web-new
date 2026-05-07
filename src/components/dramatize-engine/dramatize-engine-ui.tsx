// @ts-nocheck
import { useInjectRenderController } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { Canvas, Front, type FrontProps } from './@parts';
import { Audios } from './@parts/audios';
import { DramatizeEngineController } from '$/component-controllers';

type Props = LibTypes.FrozenDefine<FrontProps>;

export const DramatizeEngine: ReactTypes.FC<Props> = optimize(props => {
    // DramatizeEngineController is registered by the parent page (play-script-ui, play-script-opening-ui)
    // We inject it here to provide it to Canvas and Front via RenderParentContext
    useInjectRenderController(DramatizeEngineController);

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }}
        >
            <Canvas />
            <Audios />
            <Front {...props} />
        </div>
    );
});
