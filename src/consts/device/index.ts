// @ts-nocheck
import * as Device from 'expo-device';
import { Platform as RNPlatform } from 'react-native';

import { DeviceEnums } from '$/enums';
import { AppError, ErrorMessages } from '$/errors';
import { ObjectUtils } from '$/utils';

import { iPhoneModelNameMap } from './maps';

export const OS = {
    get Name() {
        if (RNPlatform.OS === 'ios' || RNPlatform.OS === 'android' || RNPlatform.OS === 'web') {
            return RNPlatform.OS;
        }
        throw new AppError(ErrorMessages.IllegalOS);
    },
    get Kind() {
        if (OS.Name === 'ios') {
            return DeviceEnums.OSKind.iOS;
        }
        return DeviceEnums.OSKind.Android;
    },
    get Version() {
        return Device.osVersion ?? '';
    },
    get IsIOS() {
        return this.Kind === DeviceEnums.OSKind.iOS;
    },
    get IsAndroid() {
        return this.Kind === DeviceEnums.OSKind.Android;
    },
} as const;

export const ModelName = (() => {
    const modelName = Device.modelName ?? '';

    if (Device.isDevice) {
        return modelName;
    }

    if (OS.Name === 'ios') {
        return typeof Device.modelId === 'string' &&
            ObjectUtils.isKey(Device.modelId, iPhoneModelNameMap)
            ? iPhoneModelNameMap[Device.modelId]
            : modelName;
    }

    // TODO 适配安卓
    return modelName;
})();

export const Platform = {
    get Kind() {
        if (OS.Name === 'ios') {
            return DeviceEnums.PlatformKind.iPhone;
        }
        return DeviceEnums.PlatformKind.Android;
    },
    get Id() {
        // TODO
        return ModelName;
    },
} as const;

export const Kind = (() => {
    if (OS.Name === 'ios') {
        return DeviceEnums.Kind.iPhone;
    }
    return DeviceEnums.Kind.GooglePhone;
})();
