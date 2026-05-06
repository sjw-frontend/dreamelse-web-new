export enum Kind {
    iPhone = 1,
    GooglePhone = 2,
    // WindowsPC = 3,
    // MacPC = 4,
}

export enum PlatformKind {
    iPhone = 1,
    Android = 2,
    // 以下为预留
    Web = 3,
    iPad = 4,
    AndroidPad = 5,
}

// declare type VerifyPlatformKind = LibTypes.VerifyExtends<
//     ApiTypes.Protocol.GoogleLoginReq['deviceType'],
//     PlatformKind
// >;

export enum OSKind {
    iOS = 1,
    Android = 2,
    // 以下为预留
    Harmony = 3,
    Windows = 4,
    MacOS = 5,
}

export enum VibrateKind {
    Slight = 1, // 轻微震动
    Small = 2, // 小震动
    General = 3, // 普通震动
    Long = 4, // 长震动
}
