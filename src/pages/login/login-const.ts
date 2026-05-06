export const I18nTexts = {
    phoneLogin: '手机号登录',
    phoneLooginDesc: '使用手机号登录或注册演我账号',
    enterPhoneNum: '请输入手机号',
    enterCode: '请输入验证码',
    getCode: '获取验证码',
    login: '登录',
    wechatLogin: '微信登录',
    qqLogin: 'QQ登录',
    appleLogin: 'Apple登录',
    skip: '跳过',
    agreeContent: '已阅读并同意 <fw>服务协议</fw> 和 <ys>隐私政策</ys>',
    agreeDialogContent:
        '同意演我的<fw>《服务协议》</fw>和<ys>《隐私政策》</ys>，点击不同意将可能导致无法继续使用服务。',
    welcomeTitle: '欢迎使用演我',

    phonePrefix: '+86',
    checkCodeCountdown: '{{count}}s',

    ok: '同意并继续',
    cancel: '不同意并退出',

    invalidCheckCode: '验证码错误！',
    invalidPhoneNumber: '非法手机号！',

    needRegister: '请绑定手机号',
} as const;

export const Settings = {
    emailLink: 'mailto:xxxx@gmail.com',
    phoneNumMaxLength: 11,
    checkCodeMaxLength: 6,
    maxGetCheckCodeCountdown: 60,
    getCheckCodeCountdownChangeDurationMS: 1000,
} as const;
