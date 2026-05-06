// @ts-nocheck
import { BaseZoneController, zoneController } from '$/core';
import { DeviceService } from '$/services';

type InternalState = LibTypes.VarDefine<{
    internetReachable: boolean,
    keyboardShow: boolean,
    muted: boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'internetReachable' | 'keyboardShow' | 'muted'
>;

@zoneController()
export class DeviceController extends BaseZoneController<State, InternalState> {
    public constructor(deviceService: DeviceService) {
        super();
        this.#deviceService = deviceService;

        this.#init();
    }

    readonly #deviceService;

    async #init() {
        this.#deviceService.addNetworkStateListener(
            ({ isInternetReachable }) => {
                this.internal.internetReachable = !!isInternetReachable;
            },
        );

        this.#deviceService.addKeyboardListener(
            'keyboardDidShow',
            () => (this.internal.keyboardShow = true),
        );
        this.#deviceService.addKeyboardListener(
            'keyboardDidHide',
            () => (this.internal.keyboardShow = false),
        );

        this.#deviceService.addSilentListener(({ isMuted }) => {
            this.internal.muted = isMuted;
        });

        const { isInternetReachable } =
            await this.#deviceService.getNetworkState();
        this.internal.internetReachable = !!isInternetReachable;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            internetReachable: false,
            keyboardShow: false,
            muted: false,
        };
    }
}
