// @ts-nocheck
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';

import { ASSETS } from '$/consts';
import {
    useInjectRenderController,
    useReactive,
    useSafeLayoutInsets,
    useStyles,
} from '$/hooks';
import type { ReactTypes, StyleTypes } from '$/types';
import { AsyncPressable, KeyboardControl } from '$/uis';
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
    const styles = useStyles(
        stylesCreator,
        {
            bottom: insets.bottom,
            frontViewBottom,
        },
        [frontViewBottom],
    );

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        play: ctrl.state.play,
        id: ctrl.state.narrative?.state.narrativeId,
    }));

    const handlePress = useCallback(() => {
        ctrl.play(!reactiveState.play);
        ctrl.pressCanvas();
    }, [reactiveState.play]);

    return (
        <AsyncPressable style={styles.main} onPress={handlePress}>
            <LinearGradient
                style={styles.topGradient}
                colors={Settings.topLinearGradient.colors}
                start={Settings.topLinearGradient.start}
                end={Settings.topLinearGradient.end}
            />
            <LinearGradient
                style={styles.bottomGradient}
                colors={Settings.bottomLinearGradient.colors}
                locations={Settings.bottomLinearGradient.locations}
                start={Settings.bottomLinearGradient.start}
                end={Settings.bottomLinearGradient.end}
            />
            <KeyboardControl style={styles.content}>
                <NewPlace />
                <NewRole />
                <Captions key={reactiveState.id} />
                <Options {...props} />
            </KeyboardControl>
            {!reactiveState.play && (
                <Image
                    source={ASSETS.Dramatize.scriptPlay}
                    style={styles.play}
                />
            )}
        </AsyncPressable>
    );
});

const stylesCreator = (
    theme: StyleTypes.Theme,
    options: LibTypes.FrozenDefine<{
        bottom: number,
        frontViewBottom?: number,
    }>,
) =>
    theme.transformStyles({
        main: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        },
        topGradient: {
            height: 120,
            width: '100%',
            position: 'absolute',
            top: 0,
        },
        bottomGradient: {
            height: 260,
            width: '100%',
            position: 'absolute',
            bottom: 0,
        },
        content: {
            width: '100%',
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: options.bottom + (options.frontViewBottom ?? 0),
        },
        play: {
            width: 62,
            height: 62,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        },
    });
