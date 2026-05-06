// @ts-nocheck
import {
    getRecordingPermissionsAsync,
    requestRecordingPermissionsAsync,
} from 'expo-audio';
import {
    getPermissionsAsync,
    requestPermissionsAsync,
} from 'expo-media-library';
import type { PermissionResponse } from 'expo-modules-core';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { BaseService, service } from '$/core';

type PermissionEventMap = LibTypes.FrozenDefine<{
    media: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
    audioRecording: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
    speechRecognition: LibTypes.Func<void, [PermissionRes: PermissionResponse]>,
}>;

@service()
export class PermissionService extends BaseService<PermissionEventMap> {
    public readonly getMediaPermissions = async () => {
        let permissions = await getPermissionsAsync();
        if (!permissions.granted) {
            permissions = await requestPermissionsAsync();
        }
        this.emitEvent('media', permissions);
        return permissions;
    };

    // public readonly getTrackingPermissions = async () => {
    //     let permissions = await getTrackingPermissionsAsync();
    //     if (!permissions.granted) {
    //         permissions = await requestTrackingPermissionsAsync();
    //     }
    //     // this.#events.emitEvent('tracking', permissions);
    //     return permissions;
    // };

    public readonly getAudioRecordingPermission = async () => {
        let permissions = await getRecordingPermissionsAsync();
        if (!permissions.granted) {
            permissions = await requestRecordingPermissionsAsync();
        }
        this.emitEvent('audioRecording', permissions);
        return permissions;
    };

    public readonly getSpeechRecognitionPermission = async () => {
        let permissions =
            await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (!permissions.granted) {
            permissions =
                await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        }
        this.emitEvent('speechRecognition', permissions);
        return permissions;
    };
}
