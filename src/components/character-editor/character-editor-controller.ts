import { CharacterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';
import { StringUtils } from '$/utils';
import type { GenerateImageController } from '../generate-image/generate-image-controller';

type InternalState = LibTypes.VarDefine<{
    get defaultConfig(): CharacterTypes.DefaultConfig | null,
    _data: CharacterTypes.FrozenCharacterInfo | null,
    get data(): CharacterTypes.FrozenCharacterInfo,
    isNew: boolean,
    writable: boolean,
    openGenerateImage: boolean,
    get allowSubmit(): boolean,
    get showFigures(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'allowSubmit'
    | 'data'
    | 'defaultConfig'
    | 'isNew'
    | 'openGenerateImage'
    | 'showFigures'
    | 'writable'
>;

type EventMap = LibTypes.FrozenDefine<{
    back: LibTypes.SimpleFunction,
    submit: LibTypes.Func<void, [data: CharacterTypes.FrozenCharacterInfo]>,
}>;

type Props = LibTypes.FrozenDefine<{
    data?: CharacterTypes.FrozenCharacterInfo | null,
    fromScript?: boolean,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    generateImageCtrl: GenerateImageController,
}>;

@renderController()
export class CharacterEditorController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(characterController: CharacterController) {
        super();
        this.#characterController = characterController;
    }

    readonly #characterController;

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        const isNew = !this.props.data;
        return {
            get defaultConfig() {
                return $this.#characterController.state.defaultConfig;
            },
            _data: this.props.data ?? null,
            get data() {
                this._data ??= $this.#characterController.createNewCharacter({
                    fromScript: $this.props.fromScript,
                });
                return this._data;
            },
            isNew,
            writable: true,
            openGenerateImage: false,
            get allowSubmit() {
                if (!this.writable) return true;
                if (StringUtils.isEmpty(this.data.state.name)) return false;
                if (StringUtils.isEmpty(this.data.state.honorary)) return false;
                if (this.data.state.gender == null) return false;
                if (StringUtils.isEmpty(this.data.state.species?.name)) return false;
                if (StringUtils.isEmpty(this.data.state.relation?.title)) return false;
                if (!this.data.state.currentTimbre) return false;
                if (!this.data.state.currentFigure) return false;
                return true;
            },
            get showFigures() {
                if (this.data.state.currentFigures == null) return false;
                return this.data.state.currentFigures.length > 1;
            },
        };
    }

    public readonly setRelatedControllers = (relatedControllers: RelatedControllers) => {
        const { generateImageCtrl } = relatedControllers;
        this.autoClearRelatedControllers(
            generateImageCtrl.addEventListener('close', () => this.closeGenerateImage()),
            generateImageCtrl.addEventListener('confirm', (image, backgroundColor) => {
                this.#characterController.updateDefaultFigureSkin(
                    this.internal.data.id, image, backgroundColor,
                );
                this.closeGenerateImage();
            }),
        );
    };

    public readonly submit = () => {
        this.emitEvent('submit', this.internal.data);
    };

    public readonly setName = (name: string) => {
        if (this.internal.writable) {
            this.#characterController.setCharacterState(this.internal.data.id, 'name', name);
        }
    };

    public readonly setHonorary = (honorary: string) => {
        if (this.internal.writable) {
            this.#characterController.setCharacterState(this.internal.data.id, 'honorary', honorary);
        }
    };

    public readonly toggleIsPublic = () => {
        if (this.internal.writable) {
            this.#characterController.setCharacterState(
                this.internal.data.id, 'isPublic', !this.internal.data.state.isPublic,
            );
        }
    };

    public readonly openGenerateImage = () => {
        if (this.internal.writable) {
            this.internal.openGenerateImage = true;
        }
    };

    public readonly closeGenerateImage = () => {
        this.internal.openGenerateImage = false;
    };

    public readonly back = () => {
        this.emitEvent('back');
    };

    public readonly writable = (writable: boolean) =>
        (this.internal.writable = writable);
}
