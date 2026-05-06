// @ts-nocheck
import { Image } from 'expo-image';
import { View } from 'react-native';

import { ASSETS } from '$/consts';
import { useInjectRenderController, useReactive, useStyles } from '$/hooks';
import type { ReactTypes, StyleTypes } from '$/types';
import { VerticalText } from '$/uis';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';

const Settings = {
    descVerticalSpacing: 2,
    nameVerticalSpacing: 2,
} as const;

export const NewRole: ReactTypes.FC = optimize(() => {
    const styles = useStyles(stylesCreator);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        show: ctrl.state.narrative?.state.showNewRoleProfile,
        name: ctrl.state.narrative?.state.director.roles[0]?.roleName
            .replaceAll('(', '︵')
            .replaceAll(')', '︶'),
        desc: ctrl.state.narrative?.state.director.roles[0]?.roleDesc,
    }));

    if (!reactiveState.show) {
        return null;
    }

    return (
        <View style={styles.roleView}>
            <VerticalText
                text={reactiveState.desc ?? ''}
                textStyle={[styles.common, styles.name]}
                spacing={Settings.descVerticalSpacing}
            />
            <View style={styles.roleSplit}>
                <Image
                    source={ASSETS.NewCommon.splitLine}
                    style={styles.roleSplitImag}
                    contentFit='cover'
                />
            </View>
            <VerticalText
                text={reactiveState.name ?? ''}
                textStyle={[styles.common, styles.desc]}
                spacing={Settings.nameVerticalSpacing}
            />
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
        roleView: {
            position: 'absolute',

            top: '30%',
            left: 40,
            flexDirection: 'row',
            alignItems: 'stretch',
        },
        roleSplit: {
            width: 2,
            height: '100%',
            marginHorizontal: 10,
            shadowColor: 'rgba(0, 0, 0, 0.25)',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowRadius: 5.11,
        },
        roleSplitImag: {
            width: '100%',
            height: '100%',
        },
        desc: {
            fontWeight: 800,
            fontSize: 40,
            lineHeight: 44,
            includeFontPadding: false,
            minWidth: 40,
            textAlign: 'center',
            fontFamily: theme.fontFamilys.primaryTitle,
        },
        name: {
            fontWeight: 500,
            fontSize: 14,
            lineHeight: 16,
            includeFontPadding: false,
            minWidth: 14,
            textAlign: 'center',
        },
    });
