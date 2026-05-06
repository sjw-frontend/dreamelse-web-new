import { RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { PermissionEnums } from '$/enums';
import { DeviceService } from '$/services';

type InternalState = LibTypes.VarDefine<{
    kind: PermissionEnums.Kind | null,
    get isMedia(): boolean,
    get isAudioRecording(): boolean,
    get isSpeechRecognition(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'isAudioRecording' | 'isMedia' | 'isSpeechRecognition' | 'kind'
>;

@renderController()
export class PermissionDeniedController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        deviceService: DeviceService,
        routerController: RouterController,
    ) {
        super();
        this.#deviceService = deviceService;
        this.#routerController = routerController;

        this.#init();
    }

    readonly #deviceService;
    readonly #routerController;

    #init() {
        this.internal.kind =
            this.internal.route?.params?.permissionKind ?? null;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            kind: null,
            get isMedia() {
                return this.kind === PermissionEnums.Kind.Media;
            },
            get isAudioRecording() {
                return this.kind === PermissionEnums.Kind.AudioRecording;
            },
            get isSpeechRecognition() {
                return this.kind === PermissionEnums.Kind.SpeechRecognition;
            },
        };
    }

    public readonly back = () => this.#routerController.goBackOrHome();

    public readonly openDeviceSettings = async () =>
        this.#deviceService.openSettings();
}
