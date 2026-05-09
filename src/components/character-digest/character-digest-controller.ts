import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { CharacterEnums, RouterEnums } from '$/enums';
import type { CharacterTypes } from '$/types';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    showArtStyleList: boolean,
    needRequestTimbres: boolean,
    speciesList: LibTypes.Arr<CharacterTypes.Species>,
    get artStyleList(): LibTypes.Arr<CharacterTypes.ArtStyle>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    'artStyleList' | 'data' | 'showArtStyleList' | 'speciesList'
>;

type EventMap = LibTypes.FrozenDefine<{
    noData: LibTypes.SimpleFunction,
}>;

type Props = LibTypes.FrozenDefine<
    {
        data: CharacterTypes.FrozenCharacterInfo,
        needRequestTimbres?: boolean,
        submitToRemote: boolean,
    },
    'data'
>;

type Context = LibTypes.VarDefine<{
    submitToRemote: boolean,
}>;

@renderController()
export class CharacterDigestController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(
        characterController: CharacterController,
        routerController: RouterController,
    ) {
        super();
        this.#characterController = characterController;
        this.#routerController = routerController;
        this.#watch();
        this.#init();
    }

    readonly #characterController;
    readonly #routerController;

    readonly #ctx: Context = {
        submitToRemote: false,
    };

    #watch() {
        this.watch(
            () => ({
                needRequestTimbres: this.internal.needRequestTimbres,
                gender: this.internal.data.state.gender,
                species: this.internal.data.state.species?.name,
            }),
            async ({ needRequestTimbres }) =>
                needRequestTimbres &&
                this.#characterController.requestTimbres(this.internal.data),
            { immediate: true },
        );

        this.watch(
            () => ({
                menuCustomSpeciesList: this.#characterController.state.menuCustomSpeciesList,
                species: this.internal.data.state.species?.name,
                speciesList: this.#characterController.state.defaultConfig?.speciesList,
            }),
            ({ species, menuCustomSpeciesList, speciesList = [] }) => {
                if (
                    [...speciesList, ...menuCustomSpeciesList].find(item => item.id === species) ||
                    species == null
                ) {
                    this.internal.speciesList = speciesList;
                } else {
                    this.internal.speciesList = [...speciesList, { id: species, name: species }];
                }
            },
            { immediate: true },
        );
    }

    #init() {
        this.#ctx.submitToRemote = this.props.submitToRemote;
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            data: this.props.data,
            needRequestTimbres: !!this.props.needRequestTimbres,
            showArtStyleList: false,
            speciesList: [],
            get artStyleList() {
                return $this.#characterController.state.defaultConfig?.artStyleList ?? [];
            },
        };
    }

    public readonly setData = (data: CharacterTypes.FrozenCharacterInfo) => {
        this.internal.data = data;
    };

    public readonly updateGender = (gender: CharacterEnums.Gender) => {
        this.#characterController.setCharacterState(
            this.internal.data.id, 'gender', gender, this.#ctx.submitToRemote,
        );
    };

    public readonly updateSpecies = (species: CharacterTypes.Species) => {
        this.#characterController.setCharacterState(
            this.internal.data.id, 'species', species, this.#ctx.submitToRemote,
        );
    };

    public readonly updateRelation = (title: string, regard: string) => {
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'relation',
            { characterName: '', title, regard, weight: null },
            this.#ctx.submitToRemote,
        );
    };

    public readonly updateArtStyle = (artStyle: CharacterTypes.ArtStyle) => {
        this.#characterController.setCharacterState(
            this.internal.data.id,
            'initial',
            prevValue => prevValue && { ...prevValue, artStyle },
            this.#ctx.submitToRemote,
        );
    };

    public readonly showTimbreList = () => {
        this.#routerController.navigate(
            RouterEnums.RouteName.CharacterTimbreList,
            { ids: [this.internal.data.id], value: this.#ctx.submitToRemote },
        );
    };

    public readonly toSocialCount = () => {
        if (
            this.internal.data.state.relationships?.length == null ||
            this.internal.data.state.relationships.length === 0
        ) {
            this.emitEvent('noData');
            return;
        }
        this.#routerController.navigate(
            RouterEnums.RouteName.CharacterRelationships,
            { ids: [this.internal.data.id] },
        );
    };

    public readonly toggleArtStyleList = () => {
        this.internal.showArtStyleList = !this.internal.showArtStyleList;
    };

    public readonly hideArtStyleList = () => {
        this.internal.showArtStyleList = false;
    };

    public readonly needRequestTimbres = (needRequestTimbres: boolean) =>
        (this.internal.needRequestTimbres = needRequestTimbres);

    public readonly submitToRemote = (submitToRemote: boolean) =>
        (this.#ctx.submitToRemote = submitToRemote);
}
