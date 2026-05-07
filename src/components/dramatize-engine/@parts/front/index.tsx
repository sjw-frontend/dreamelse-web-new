import { useCallback } from 'react';

import { ASSETS } from '$/consts';
import {
    useInjectRenderController,
    useReactive,
    useSafeLayoutInsets,
} from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { Settings } from '../../dramatize-engine-const';
import { DramatizeEngineController } from '$/component-controllers';

import {
    Captions,
    NewPlace,
    NewRole,
    Options,
    type OptionsProps,
} from './@parts';

export type FrontProps = LibTypes.FrozenDefine<
    OptionsProps & {
        frontViewBottom?: number,
    }
>;

export const Front: ReactTypes.FC<FrontProps> = optimize(props => {
    const { frontViewBottom } = props;

    const insets = useSafeLayoutInsets();
    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        play: ctrl.state.play,
        id: ctrl.state.narrative?.state.narrativeId,
    }));

    const handlePress = useCallback(() => {
        ctrl.play(!reactiveState.play);
        ctrl.pressCanvas();
    }, [reactiveState.play]);

    const bottomPadding = insets.bottom + (frontViewBottom ?? 0);
    const topColors = [...Settings.topLinearGradient.colors] as string[];
    const bottomColors = [...Settings.bottomLinearGradient.colors] as string[];

    return (
        <div
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            onClick={handlePress}
        >
            {/* top gradient */}
            <div
                style={{
                    height: 120,
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    background: `linear-gradient(to bottom, ${topColors[0]}, ${topColors[1] ?? 'transparent'})`,
                    pointerEvents: 'none',
                }}
            />
            {/* bottom gradient */}
            <div
                style={{
                    height: 260,
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                    background: `linear-gradient(to bottom, ${bottomColors[0]}, ${bottomColors[1] ?? 'rgba(0,0,0,0.8)'})`,
                    pointerEvents: 'none',
                }}
            />
            {/* content */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: bottomPadding,
                    boxSizing: 'border-box',
                }}
            >
                <NewPlace />
                <NewRole />
                <Captions key={reactiveState.id} />
                <Options {...props} />
            </div>
            {/* pause icon */}
            {!reactiveState.play && (
                <img
                    src={ASSETS.Dramatize.scriptPlay}
                    alt=""
                    style={{
                        width: 62,
                        height: 62,
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
});
