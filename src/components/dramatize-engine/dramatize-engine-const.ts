export const I18nTexts = {
    youSelect: '你选择了',
} as const;

export const Settings = {
    topLinearGradient: {
        colors: [
            'rgba(0, 0, 0, 0.4)',
            'rgba(0, 0, 0, 0.25)',
            'rgba(0, 0, 0, 0)',
        ],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
    bottomLinearGradient: {
        colors: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 1)'],
        locations: [0, 0.5, 1],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },

    captionsNarratorHeight: 120,
    captionsRoleHeight: 65,
    defaultChatInputExtraStuffHeight: -64,
} as const;
