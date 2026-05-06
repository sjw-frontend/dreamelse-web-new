// @ts-nocheck
import { BaseZoneController, zoneController } from '$/core';
import { PermissionEnums, RouterEnums } from '$/enums';
import { PermissionService } from '$/services';

import { RouterController } from '../router/router-controller';

type InternalState = LibTypes.VarDefine<{
    mediaStatus: PermissionEnums.Status,
    audioRecordingStatus: PermissionEnums.Status,
    speechRecognitionStatus: PermissionEnums.Status,
    get allowMedia(): boolean,
    get allowAudioRecording(): boolean,
    get allowSpeechRecognition(): boolean,
}>;

type State = LibTypes.FrozenPick<InternalState, 'allowMedia'>;

@zoneController()
export class PermissionController extends BaseZoneController<
    State,
    InternalState
> {
    public constructor(
        permissionService: PermissionService,
        routerController: RouterController,
    ) {
        super();
        this.#permissionService = permissionService;
        this.#routerController = routerController;

        this.#permissionService.addEventListener('media', ({ granted }) => {
            if (granted) {
                this.internal.mediaStatus = PermissionEnums.Status.GrantedAll;
            } else {
                this.#routerController.navigate(
                    RouterEnums.RouteName.PermissionDenied,
                    {
                        permissionKind: PermissionEnums.Kind.Media,
                    },
                );
                this.internal.mediaStatus = PermissionEnums.Status.Denied;
            }
        });

        this.#permissionService.addEventListener(
            'audioRecording',
            ({ granted }) => {
                if (granted) {
                    this.internal.audioRecordingStatus =
                        PermissionEnums.Status.GrantedAll;
                } else {
                    this.#routerController.navigate(
                        RouterEnums.RouteName.PermissionDenied,
                        {
                            permissionKind: PermissionEnums.Kind.AudioRecording,
                        },
                    );
                    this.internal.audioRecordingStatus =
                        PermissionEnums.Status.Denied;
                }
            },
        );

        this.#permissionService.addEventListener(
            'speechRecognition',
            ({ granted }) => {
                if (granted) {
                    this.internal.speechRecognitionStatus =
                        PermissionEnums.Status.GrantedAll;
                } else {
                    this.#routerController.navigate(
                        RouterEnums.RouteName.PermissionDenied,
                        {
                            permissionKind:
                                PermissionEnums.Kind.SpeechRecognition,
                        },
                    );
                    this.internal.speechRecognitionStatus =
                        PermissionEnums.Status.Denied;
                }
            },
        );
    }

    readonly #permissionService;
    readonly #routerController;

    protected override getInitialInternalState(): InternalState {
        return {
            mediaStatus: PermissionEnums.Status.Undetermined,
            audioRecordingStatus: PermissionEnums.Status.Undetermined,
            speechRecognitionStatus: PermissionEnums.Status.Undetermined,
            get allowMedia() {
                return this.mediaStatus === PermissionEnums.Status.GrantedAll;
            },
            get allowAudioRecording() {
                return (
                    this.audioRecordingStatus ===
                    PermissionEnums.Status.GrantedAll
                );
            },
            get allowSpeechRecognition() {
                return (
                    this.speechRecognitionStatus ===
                    PermissionEnums.Status.GrantedAll
                );
            },
        };
    }
}
