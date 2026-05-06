// @ts-nocheck
import type { PermissionResponse } from 'expo-modules-core';

import { BaseService, service } from '$/core';

type PermissionEventMap = LibTypes.FrozenDefine<{
    media: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
    audioRecording: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
    speechRecognition: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
}>;

const deniedPermission = (): PermissionResponse => ({
    canAskAgain: false,
    expires: 'never',
    granted: false,
    status: 'denied',
});

@service()
export class PermissionService extends BaseService<PermissionEventMap> {
    public readonly getMediaPermissions = async () => {
        const permissions = deniedPermission();
        this.emitEvent('media', permissions);
        return permissions;
    };

    public readonly getAudioRecordingPermission = async () => {
        const permissions = deniedPermission();
        this.emitEvent('audioRecording', permissions);
        return permissions;
    };

    public readonly getSpeechRecognitionPermission = async () => {
        const permissions = deniedPermission();
        this.emitEvent('speechRecognition', permissions);
        return permissions;
    };
}
