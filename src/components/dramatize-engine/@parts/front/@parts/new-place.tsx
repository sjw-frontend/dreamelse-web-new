// @ts-nocheck
import { Text, View } from 'react-native';

import { useInjectRenderController, useReactive, useStyles } from '$/hooks';
import type { ReactTypes, StyleTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';

export const NewPlace: ReactTypes.FC = optimize(() => {
    const styles = useStyles(stylesCreator);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        show: ctrl.state.narrative?.state.showNewPlaceProfile,
        name: ctrl.state.narrative?.state.director.place?.name,
        desc: ctrl.state.narrative?.state.director.place?.desc,
    }));

    if (!reactiveState.show) {
        return null;
    }

    return (
        <View style={styles.main}>
            <Text style={[styles.common, styles.name]}>
                {reactiveState.name}
            </Text>
            <Text style={[styles.common, styles.desc]}>
                {reactiveState.desc}
            </Text>
        </View>
    );
});

const stylesCreator = (theme: StyleTypes.Theme) =>
    theme.transformStyles({
        common: {
            color: theme.colors.textPrimary,
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: {
                width: 0,
                height: 2,
            },
            textShadowRadius: 5.11,
        },
        main: {
            position: 'absolute',

            bottom: 200,
            left: 40,
            borderLeftColor: theme.colors.textPrimary,
            borderLeftWidth: 6,
            paddingLeft: 12,
        },
        name: {
            fontWeight: 800,
            fontSize: 40,
            marginBottom: 6,
            fontFamily: theme.fontFamilys.primaryTitle,
        },
        desc: {
            fontWeight: 600,
            fontSize: 24,
        },
    });
