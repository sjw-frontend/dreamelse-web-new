// web版：替换 react-native TextStyle/ViewStyle → CSSProperties
import type { CSSProperties } from 'react';
import { StyleEnums } from '$/enums';
import type { StyleTypes } from '$/types';

const transformStyles = <T extends StyleTypes.Styles>(styles: StyleTypes.Styles & T): T => styles;

const createStyles = <T extends StyleTypes.Styles>(styles: StyleTypes.Styles & T): T => styles;

const transform = <const T extends StyleTypes.Style>(style: StyleTypes.Style & T): T => style;
const getPixelSize = (layoutSize: number) => layoutSize;
const getFontPixelSize = (layoutSize: number) => layoutSize;

export const Default = () => ({
    kind: StyleEnums.ThemeKind.Default,
    containers: createStyles({
        center: {
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        } as CSSProperties,
        absoluteCenter: {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        } as CSSProperties,
        autoCenter: {
            justifyContent: 'center',
            alignItems: 'center',
        } as CSSProperties,
        autoAbsoluteCenter: {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
        } as CSSProperties,
    }),
    sizes: createStyles({
        fill: { width: '100%', height: '100%' } as CSSProperties,
        absoluteFill: { position: 'absolute', width: '100%', height: '100%' } as CSSProperties,
    }),
    positions: createStyles({
        center: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        } as CSSProperties,
    }),
    colors: {
        bgPage:          '#0D0D0D',
        bgCard:          '#1A1A1A',
        bgInput:         '#222222',
        bgElevated:      '#1A1A1A',
        bgToast:         '#393939',
        bgSecondary:     '#252525',
        bgTertiary:      '#2A2A2A',
        bgPlaceholder:   '#333333',
        bgGrabber:       '#444444',
        textPrimary:     '#EDEDED',
        textSecondary:   '#A0A0A0',
        textTertiary:    '#888888',
        textQuaternary:  '#777777',
        textPlaceholder: '#666666',
        textSection:     '#B0B0B0',
        textOnAccent:    '#000000',
        accent:          '#ABFF1A',
        danger:          '#FF4444',
        dangerStrong:    '#FF5555',
        dangerSoft:      '#FF8A82',
        purple:          '#B47AFF',
        border:          'rgba(255,255,255,0.08)',
        divider:         'rgba(255,255,255,0.06)',
        overlay:         'rgba(0,0,0,0.65)',
        glassBg:         'rgba(255,255,255,0.08)',
        title:           '#EDEDED',
        text:            '#EDEDED',
        primary:         '#EDEDED',
        secondary:       'rgba(255,255,255,0.35)',
        background:      '#0D0D0D',
    },
    fontFamilys: {
        button:       'Inter',
        title:        'Inter',
        text:         'Inter',
        primaryTitle: 'Playfair Display',
    },
    zIndexs: {
        hide: -5,
        lowest: 0,
        low: 1,
        medium: 10,
        high: 20,
        highest: 30,
        max: 9999,
    },
    transform,
    transformStyles,
    createStyles,
    getPixelSize,
    getFontPixelSize,
});
