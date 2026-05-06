// web版：替换 expo-device / react-native Platform
import { DeviceEnums } from '$/enums';

export const OS = {
    Name: 'web' as const,
    Kind: DeviceEnums.OSKind.Android as DeviceEnums.OSKind,
    Version: navigator.userAgent,
    IsIOS: false,
    IsAndroid: false,
} as const;

export const ModelName = navigator.userAgent;

export const Platform = {
    Kind: DeviceEnums.PlatformKind.Android as DeviceEnums.PlatformKind,
    Id: 'web',
} as const;

export const Kind = DeviceEnums.Kind.GooglePhone as DeviceEnums.Kind;
