import { APP } from '$/consts';
import { AppController, CharacterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { FileEnums } from '$/enums';
import { ApiService, FileService, MediaService } from '$/services';
import type { CharacterTypes, FileTypes } from '$/types';
import {
    ArrayUtils,
    FileUtils,
    StringUtils,
    TaskUtils,
    TosUtils,
} from '$/utils';

import { Settings } from './generate-image-const';

type GeneratedImage = LibTypes.Define<
    | {
          id: number,
          generating: false,
          backgroundColor: string,
          image: FileTypes.ImageResource,
      }
    | {
          id: number,
          generating: true,
          backgroundColor?: undefined,
          image?: undefined,
      }
>;

type InternalState = LibTypes.VarDefine<{
    tab: 'generate' | 'upload',
    get isGenerateTab(): boolean,
    get isUploadTab(): boolean,

    openGeneratePanel: boolean,
    generatePanelTab: 'generate' | 'upload',
    get isGeneratePanelGenerateTab(): boolean,
    get isGeneratePanelUploadTab(): boolean,

    openEditPanel: boolean,
    cacheGenerateInfo: LibTypes.Define<{
        generateText: string,
        selectArtStyleId: CharacterTypes.ArtStyle['id'] | null,
    }> | null,

    generateText: string,
    get allowGenerate(): boolean,

    generatedImageList: LibTypes.Arr<GeneratedImage>,
    get selectGeneratedImage(): GeneratedImage | null,
    selectGeneratedImageId: number | null,
    get hasGeneratingImage(): boolean,

    uploadImage: LibTypes.Define<{
        image: FileTypes.ImageResource,
        backgroundColor: string | null,
    }> | null,
    get showReUploadButton(): boolean,

    get defaultConfig(): CharacterTypes.DefaultConfig | null,
    get artStyleList(): LibTypes.Arr<CharacterTypes.ArtStyle>,
    get selectArtStyle(): CharacterTypes.ArtStyle | null,
    selectArtStyleId: CharacterTypes.ArtStyle['id'] | null,

    get allowApplyGenerated(): boolean,
    get allowApplyUploaded(): boolean,

    characterId: string | null,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'allowApplyGenerated'
    | 'allowApplyUploaded'
    | 'allowGenerate'
    | 'artStyleList'
    | 'generatedImageList'
    | 'generatePanelTab'
    | 'generateText'
    | 'hasGeneratingImage'
    | 'isGeneratePanelGenerateTab'
    | 'isGeneratePanelUploadTab'
    | 'isGenerateTab'
    | 'isUploadTab'
    | 'openEditPanel'
    | 'openGeneratePanel'
    | 'selectArtStyleId'
    | 'selectGeneratedImage'
    | 'selectGeneratedImageId'
    | 'showReUploadButton'
    | 'tab'
    | 'uploadImage'
>;

type EventMap = LibTypes.FrozenDefine<{
    close: LibTypes.SimpleFunction,
    confirm: LibTypes.Func<
        void,
        [image: FileTypes.ImageResource, backgroundColor: string | null]
    >,
    generateFail: LibTypes.SimpleFunction,
    uploadFail: LibTypes.SimpleFunction,
}>;

type Props = LibTypes.FrozenDefine<{
    characterId: string | null,
    generatedImage?: {
        backgroundColor: string,
        image: FileTypes.ImageResource,
    },
}>;

@renderController()
export class GenerateImageController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(
        characterController: CharacterController,
        mediaService: MediaService,
        apiService: ApiService,
        fileService: FileService,
        appController: AppController,
    ) {
        super();
        this.#characterController = characterController;
        this.#mediaService = mediaService;
        this.#apiService = apiService;
        this.#fileService = fileService;
        this.#appController = appController;

        this.#watch();
    }

    readonly #mediaService;
    readonly #apiService;
    readonly #characterController;
    readonly #fileService;
    readonly #appController;

    #generateId = -1;

    #watch() {
        this.watch(
            () => this.internal.isGenerateTab,
            isGenerateTab => {
                if (
                    isGenerateTab &&
                    this.internal.generatedImageList.length === 0
                ) {
                    this.internal.openGeneratePanel = true;
                    this.internal.generatePanelTab = 'generate';
                }
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.internal.openEditPanel,
            openEditPanel => {
                if (openEditPanel) {
                    this.internal.cacheGenerateInfo = {
                        generateText: this.internal.generateText,
                        selectArtStyleId: this.internal.selectArtStyleId,
                    };
                } else if (this.internal.cacheGenerateInfo) {
                    this.internal.generateText =
                        this.internal.cacheGenerateInfo.generateText;
                    this.internal.selectArtStyleId =
                        this.internal.cacheGenerateInfo.selectArtStyleId;
                }
            },
        );

        this.watch(
            () => this.internal.defaultConfig,
            defaultConfig => {
                if (defaultConfig && this.internal.selectArtStyleId == null) {
                    this.internal.selectArtStyleId =
                        defaultConfig.artStyleList[0]?.id ?? null;
                }
            },
        );
    }

    async #upload(img: FileTypes.SimpleVisual) {
        try {
            await this.#appController.longTask(
                TaskUtils.runWithTimeout(async () => {
                    this.internal.tab = 'upload';
                    this.internal.openGeneratePanel = false;

                    const authHeaders = await this.#apiService.getAuthHeaders();
                    const bearerToken = authHeaders?.Authorization;
                    if (bearerToken == null) {
                        this.emitEvent('uploadFail');
                        return;
                    }

                    const token = bearerToken.replace(/^Bearer\s+/i, '');
                    const fileName = FileUtils.createFilenameByUri(img.uri);
                    const key = `temp/character/${fileName}`;

                    const uploaded = await TosUtils.uploadImageToTos({
                        imageUri: img.uri,
                        origin: APP.ENV.ApiOrigin,
                        token,
                        authorizationScheme: 'bearer',
                        key,
                    });

                    const rawUri =
                        uploaded.signedUrl !== ''
                            ? uploaded.signedUrl
                            : uploaded.url;

                    console.info('TOS upload ok', uploaded);

                    const processImg =
                        await this.#apiService.call.file.process_image(
                            {
                                image_url: rawUri,
                            },
                            { isLongTask: true },
                        );

                    const uri = processImg.image_url;

                    const bgRes = await this.#apiService.call.file
                        .image_main_color(
                            {
                                image: {
                                    bucket_name: '',
                                    object_key: '',
                                    object_type: '',
                                    request_id: '',
                                    url: uri,
                                },
                            },
                            { isLongTask: true },
                        )
                        .catch(() => null);

                    this.internal.uploadImage = {
                        image: this.#fileService.createLocalImageResource({
                            kind: FileEnums.Media.Image,
                            width: img.width,
                            height: img.height,
                            uri,
                        }),
                        backgroundColor: bgRes?.bkg_main_color ?? null,
                    };
                }, Settings.timeoutMS),
            );
        } catch (err) {
            this.emitEvent('uploadFail');
            throw err;
        }
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            tab: 'generate',

            openGeneratePanel: false,
            generatePanelTab: 'generate',
            get isGeneratePanelGenerateTab() {
                return this.generatePanelTab === 'generate';
            },
            get isGeneratePanelUploadTab() {
                return this.generatePanelTab === 'upload';
            },
            openEditPanel: false,
            cacheGenerateInfo: null,

            get defaultConfig() {
                return $this.#characterController.state.defaultConfig;
            },
            generateText: '',
            get allowGenerate() {
                return (
                    !StringUtils.isEmpty(this.generateText) &&
                    !!this.selectArtStyle
                );
            },
            selectGeneratedImageId: this.props.generatedImage ? 0 : null,
            get selectGeneratedImage() {
                return (
                    this.generatedImageList.find(
                        item => item.id === this.selectGeneratedImageId,
                    ) ?? null
                );
            },
            generatedImageList: this.props.generatedImage
                ? [
                      {
                          id: 0,
                          generating: false,
                          ...this.props.generatedImage,
                      },
                  ]
                : [],
            uploadImage: null,
            get showReUploadButton() {
                return !!this.uploadImage;
            },
            get hasGeneratingImage() {
                return this.generatedImageList.some(item => item.generating);
            },

            selectArtStyleId: null,
            get selectArtStyle() {
                return (
                    this.artStyleList.find(
                        item => item.id === this.selectArtStyleId,
                    ) ?? null
                );
            },

            get artStyleList() {
                return this.defaultConfig?.artStyleList ?? [];
            },
            get isGenerateTab() {
                return this.tab === 'generate';
            },
            get isUploadTab() {
                return this.tab === 'upload';
            },

            get allowApplyGenerated() {
                return this.selectGeneratedImage?.generating === false;
            },

            get allowApplyUploaded() {
                return !!this.uploadImage;
            },

            characterId: this.props.characterId,
        };
    }

    public readonly setTab = (tab: 'generate' | 'upload') => {
        this.internal.tab = tab;
    };

    public readonly setGeneratePanelTab = (tab: 'generate' | 'upload') => {
        if (tab === 'upload' && this.internal.uploadImage) {
            this.internal.openGeneratePanel = false;
            this.setTab('upload');
        } else {
            this.internal.generatePanelTab = tab;
        }
    };

    public readonly setGenerateText = (text: string) => {
        this.internal.generateText = text;
    };

    public readonly setSelecteArtStyleId = (
        id: CharacterTypes.ArtStyle['id'] | null,
    ) => {
        this.internal.selectArtStyleId = id;
    };

    public readonly setSelecteGeneratedImageId = (id: number | null) => {
        this.internal.selectGeneratedImageId = id;
    };

    public readonly openEditPanel = () => {
        this.internal.openEditPanel = true;
    };

    public readonly closeEditPanel = () => {
        this.internal.openEditPanel = false;
    };

    public readonly changeGenerateInfo = () => {
        this.internal.openEditPanel = false;
    };

    public readonly generate = async () => {
        if (!this.internal.allowGenerate) {
            this.internal.openEditPanel = true;
            return;
        }
        if (this.internal.hasGeneratingImage) {
            return;
        }
        this.internal.openGeneratePanel = false;
        this.internal.cacheGenerateInfo = null;
        this.closeEditPanel();

        this.internal.selectGeneratedImageId = this.#generateId--;
        this.internal.generatedImageList = [
            ...this.internal.generatedImageList,
            {
                id: this.internal.selectGeneratedImageId,
                generating: true,
            },
        ];

        const newItem = this.internal.generatedImageList.at(-1);

        try {
            const res = await this.#apiService.call.character.gen_appearance(
                {
                    description: this.internal.generateText,
                    style_name: this.internal.selectArtStyle?.name ?? '',
                    character_id: this.internal.characterId ?? undefined,
                    scene: 'create_character',
                },
                { isLongTask: true },
            );

            const bgRes = await this.#apiService.call.file
                .image_main_color(
                    {
                        image: {
                            bucket_name: '',
                            object_key: '',
                            object_type: '',
                            request_id: '',
                            url: res.image.url,
                        },
                    },
                    { isLongTask: true },
                )
                .catch(() => null);

            if (newItem) {
                const index = this.internal.generatedImageList.findIndex(
                    item => item === newItem,
                );
                if (index >= 0) {
                    const generatedImageList = [
                        ...this.internal.generatedImageList,
                    ];

                    generatedImageList[index] = {
                        id: newItem.id,
                        generating: false,
                        backgroundColor: bgRes?.bkg_main_color ?? '',
                        image: this.#fileService.createImageResource(
                            res.image.id,
                            FileUtils.getImageInfoFromApiInfo(res.image),
                        ),
                    };

                    this.internal.generatedImageList = generatedImageList;
                }
            }
        } catch {
            this.internal.generatedImageList = ArrayUtils.toDeleteItem(
                this.internal.generatedImageList,
                this.internal.generatedImageList.findIndex(
                    item => item === newItem,
                ),
            );
            if (newItem?.id === this.internal.selectGeneratedImageId) {
                this.internal.selectGeneratedImageId =
                    this.internal.generatedImageList[0]?.id ?? null;
            }
        }
    };

    public readonly applyGeneratedImage = () => {
        const selectGenerated = this.internal.selectGeneratedImage;
        selectGenerated?.image &&
            this.emitEvent(
                'confirm',
                selectGenerated.image,
                selectGenerated.backgroundColor,
            );
    };

    public readonly pickImage = async () => {
        const img = await this.#mediaService.pickImage();
        img && (await this.#upload(img));
    };

    public readonly applyUploadImage = () => {
        this.internal.uploadImage &&
            this.emitEvent(
                'confirm',
                this.internal.uploadImage.image,
                this.internal.uploadImage.backgroundColor,
            );
    };

    public readonly close = () => {
        this.emitEvent('close');
    };
}
