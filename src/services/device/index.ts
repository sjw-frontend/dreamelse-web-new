// @ts-nocheck
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { isAvailableAsync, signInAsync } from 'expo-apple-authentication';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { setStringAsync } from 'expo-clipboard';
import { impactAsync, notificationAsync, selectionAsync } from 'expo-haptics';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { Dimensions, Keyboard, Vibration } from 'react-native';
import { openSettings } from 'react-native-permissions';
import {
    addSilentListener,
    addVolumeListener,
} from 'react-native-volume-manager';

// import { APP } from '$/consts';
import { BaseService, service } from '$/core';
import { DeviceEnums } from '$/enums';

// GoogleSignin.configure({
//     iosClientId: APP.Extra.GoogleLoginIosClientId,
// });

@service()
export class DeviceService extends BaseService {
    public readonly addKeyboardListener = Keyboard.addListener.bind(Keyboard);
    public readonly dismissKeyboard = Keyboard.dismiss.bind(Keyboard);

    public readonly addSilentListener = addSilentListener;
    public readonly addVolumeListener = addVolumeListener;

    public readonly addNetworkStateListener = addNetworkStateListener;
    public readonly getNetworkState = getNetworkStateAsync;

    public readonly copyToClipboard = setStringAsync;

    public readonly openSettings = openSettings;

    public readonly appleSign = signInAsync;

    public readonly checkSupportApple = isAvailableAsync;

    // public readonly googleSign = GoogleSignin.signIn;

    // public readonly checkSupportGoogle = GoogleSignin.hasPlayServices;

    public get windowDimension() {
        return Dimensions.get('window');
    }

    public readonly checkSupportWechat = async () => Promise.resolve(true);

    public readonly checkSupportQQ = async () => Promise.resolve(true);

    public readonly vibrate = (kind = DeviceEnums.VibrateKind.Small) => {
        switch (kind) {
            case DeviceEnums.VibrateKind.Slight:
                selectionAsync();
                break;
            case DeviceEnums.VibrateKind.Small:
                impactAsync();
                break;
            case DeviceEnums.VibrateKind.General:
                notificationAsync();
                break;
            case DeviceEnums.VibrateKind.Long:
                Vibration.vibrate();
                break;
        }
    };

    public readonly requestRecordingPermission = async () =>
        requestRecordingPermissionsAsync();
}
