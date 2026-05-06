export const I18nTexts = {
    pageTitle: '注销账号',
    desc: '请使用与账号绑定的手机号进行注销验证',
    phonePrefix: '+86',
    phonePlaceholder: '请输入手机号',
    codePlaceholder: '请输入验证码',
    getCode: '获取验证码',
    checkCodeCountdown: '{{count}}s',
    confirmSubmit: '确定注销',
    submitting: '注销中',
    invalidPhone: '手机号有误，请重新输入',
    invalidCheckCode: '验证码错误，请重新输入',
    sendCodeFailed: '获取验证码失败',
    cancelSuccess: '注销成功',
} as const;

export const Settings = {
    phoneNumMaxLength: 11,
    checkCodeMaxLength: 6,
    maxGetCheckCodeCountdown: 60,
    getCheckCodeCountdownChangeDurationMS: 1000,
} as const;
