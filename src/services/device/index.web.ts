// web版：替换 expo-network / react-native Keyboard/Dimensions
import { BaseService, service } from '$/core';
import { DeviceEnums } from '$/enums';

const noopSubscription = { remove: () => {} };

type NetworkState = { isConnected: boolean; isInternetReachable: boolean };
type NetworkStateListener = (state: NetworkState) => void;

@service()
export class DeviceService extends BaseService {
    public readonly addKeyboardListener = (_event: string, _cb: unknown) => noopSubscription;
    public readonly dismissKeyboard = () => {
        (document.activeElement as HTMLElement)?.blur();
    };

    public readonly addSilentListener = (_cb: unknown) => noopSubscription;
    public readonly addVolumeListener = (_cb: unknown) => noopSubscription;

    public readonly addNetworkStateListener = (cb: NetworkStateListener) => {
        const handler = () => cb({ isConnected: navigator.onLine, isInternetReachable: navigator.onLine });
        window.addEventListener('online', handler);
        window.addEventListener('offline', handler);
        return { remove: () => { window.removeEventListener('online', handler); window.removeEventListener('offline', handler); } };
    };

    public readonly getNetworkState = async (): Promise<NetworkState> => ({
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
    });

    public readonly copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    public readonly openSettings = async () => {};

    public readonly appleSign = () => { throw new Error('Apple Sign-In not supported on web'); };
    public readonly checkSupportApple = () => false;

    public get windowDimension() {
        return { width: window.innerWidth, height: window.innerHeight };
    }

    public readonly checkSupportWechat = async () => false;
    public readonly checkSupportQQ = async () => false;

    public readonly vibrate = (_kind = DeviceEnums.VibrateKind.Small) => {
        navigator.vibrate?.(50);
    };

    public readonly requestRecordingPermission = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return { granted: true, expires: 'never' as const, canAskAgain: true, status: 'granted' as const };
        } catch {
            return { granted: false, expires: 'never' as const, canAskAgain: false, status: 'denied' as const };
        }
    };
}
