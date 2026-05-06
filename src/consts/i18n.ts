import { CharacterEnums } from '$/enums';

export const Texts = {
    mute: 'Mute',
    muteCanceled: 'Mute Canceled',
    updateApp: ' ✨ New Update Available ✨ ',
    updateNow: 'Update Now',
    later: 'Remind me Later',
    updateAppContent:
        'The current app version is no longer available, please upgrade to the latest version of the app',
    networkBusy: '网络繁忙，请稍后再试',
    networkBusyContent: 'The network is busy, please try again later.',
    networkDisabled: 'Network is Disabled',
    networkDisabledContent:
        'The network is disabled, please go to settings to allow myapp to access the network',
    comingSoon: '敬请期待！',
    openingSoon: '暂未开放，敬请期待',
} as const;

export const CharacterGender = {
    [CharacterEnums.Gender.Boy]: '男',
    [CharacterEnums.Gender.Girl]: '女',
    [CharacterEnums.Gender.Other]: '其它',
} as const satisfies LibTypes.FrozenGeneralObj<string, CharacterEnums.Gender>;
