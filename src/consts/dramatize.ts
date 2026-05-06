import * as VISUAL from './visual';

export const ScreenWHRatio = VISUAL.OptimalWHRatio;

export const UnitDefaultStyle = {
    layerZIndex: {
        hide: -90,
        bg: 0, // 背景
        role: 100, // 角色
        effect: 500, // 特效
        text: 1000, // 文本
        interaction: 9000, // 交互
    },
    rect: {
        x: -10000,
        y: 0,
        width: 0,
        height: 0,
    },
    opacity: 1,
    scale: 1,
} as const;

export const TextDisplayTimePerCharMS = 60;

export const NarratorRoles = ['旁白', 'narrator'];
