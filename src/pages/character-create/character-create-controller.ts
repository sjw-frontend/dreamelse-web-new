// @ts-nocheck
import debounce from 'lodash/debounce';

import type { CharacterEditorController } from '$/component-controllers';
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import type { CharacterTypes } from '$/types';
import { ArrayUtils, ErrUtils, StringUtils, TaskUtils } from '$/utils';

import { Settings } from './character-create-const';

type InternalState = LibTypes.VarDefine<{
    _newData: CharacterTypes.FrozenCharacterInfo | null,
    get newData(): CharacterTypes.FrozenCharacterInfo,

    previewData: CharacterTypes.FrozenCharacterInfo | null,
    previewDataWritable: boolean,
    previewDataAllowGenerateFigure: boolean,

    pickList: LibTypes.Arr<CharacterTypes.CharacterId>,
    pickListCursor: string | null,
    pickListHasMore: boolean,

    selectId: CharacterTypes.CharacterId | null,

    mode: 'create' | 'custom' | 'pick',
    currentTagId: CharacterTypes.SearchTag['id'] | null,
    get currentTag(): CharacterTypes.SearchTag | null,

    showSearch: boolean,
    searchKeyword: string,

    // 定制 Tab
    isInteracting: boolean, // 判断交互进度条是否处于长按中
    sortIndex: LibTypes.FrozenGeneralObj<number>, // 记录交互时进度条排序顺序
    sortedAbilities: LibTypes.VarArr<{
        rankPosition: number,
        ability: CharacterTypes.InitialAbility,
    }>,

    innerEvaluation: string | null,
    evaluation: string | null,

    // 背景指定当前属性
    currentAbility: CharacterTypes.InitialAbility | null,

    // 追踪已交互的能力条
    interactedAbilities: LibTypes.FrozenGeneralObj<boolean>,

    get defaultConfig(): CharacterTypes.DefaultConfig | null,
    get allowSubmit(): boolean,
    get isCustom(): boolean,
    get isPick(): boolean,
    get isCreate(): boolean,
    get sumPercent(): number,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'allowSubmit'
    | 'currentAbility'
    | 'currentTagId'
    | 'defaultConfig'
    | 'evaluation'
    | 'interactedAbilities'
    | 'isCreate'
    | 'isCustom'
    | 'isInteracting'
    | 'isPick'
    | 'newData'
    | 'pickList'
    | 'previewData'
    | 'previewDataAllowGenerateFigure'
    | 'previewDataWritable'
    | 'searchKeyword'
    | 'selectId'
    | 'showSearch'
    | 'sortedAbilities'
    | 'sortIndex'
    | 'sumPercent'
>;

type Context = LibTypes.VarDefine<{
    preMode: InternalState['mode'] | null,
}>;

type EventMap = LibTypes.FrozenDefine<{
    submitFail: LibTypes.Func<void, [errMsg: LibTypes.Nullable<string>]>,
    generateFail: LibTypes.Func<void, [errMsg: LibTypes.Nullable<string>]>,
    submit: LibTypes.Func<void, [task: LibTypes.Asyncable]>,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    characterEditorCtrl: CharacterEditorController,
}>;

@renderController()
export class CharacterCreateController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(
        characterController: CharacterController,

        routerController: RouterController,
    ) {
        super();
        this.#characterController = characterController;
        this.#routerController = routerController;

        this.#watch();
    }

    readonly #characterController;
    readonly #routerController;

    readonly #ctx: Context = {
        preMode: null,
    };

    // #relatedControllers?: RelatedControllers;

    readonly #requestSoulsEvaluation = debounce(async () => {
        this.internal.innerEvaluation =
            await this.#characterController.requestSoulsEvaluation(
                this.internal.newData.state.initial?.abilities ?? [],
            );
    }, Settings.requestSoulsEvaluationDebounce);

    readonly #requestPickList = TaskUtils.createSerialTask(async () => {
        if (this.internal.pickListHasMore) {
            const res = await this.#characterController.requestCopyableList({
                keyword: this.internal.searchKeyword.trim(),
                tag: this.internal.currentTag?.value,
                cursor: this.internal.pickListCursor ?? undefined,
            });

            this.internal.pickListCursor = res.nextCursor;
            this.internal.pickListHasMore = !!res.hasMore;
            this.internal.pickList = ArrayUtils.toDeduplicate([
                ...this.internal.pickList,
                ...res.characterIds,
            ]);
        }
    });

    #watch() {
        this.watch(
            () => this.internal.newData.state.initial?.abilities,
            abilities => {
                // if (!last.initial?.abilities?.length) return;
                const sorted = [...(abilities ?? [])].sort(
                    (a, b) => b.percent - a.percent,
                );
                const newSortedIndex: LibTypes.VarGeneralObj<number> = {};
                const result = sorted.map((ability, index) => {
                    newSortedIndex[ability.id] = index;
                    return {
                        ability,
                        rankPosition: index,
                    };
                });
                this.internal.sortIndex = newSortedIndex;
                this.internal.sortedAbilities = result;
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.internal.innerEvaluation,
            innerEvaluation => {
                this.internal.evaluation = innerEvaluation;
                console.log('evaluation====', innerEvaluation);
            },
            {
                debounceMS: Settings.updateEvaluationDebounce,
            },
        );
    }

    #batchUpdateInitialAbilityPercent(
        characterId: CharacterTypes.CharacterId,
        deltaAbilities: LibTypes.Arr<
            LibTypes.FrozenPick<CharacterTypes.InitialAbility, 'id' | 'percent'>
        >,
    ) {
        deltaAbilities.forEach(item => {
            this.#characterController.updateInitialAbilityPercent(
                characterId,
                item.id,
                item.percent,
            );
        });
    }

    #updateInitialAbilityPercent(id: string, value: -1 | 1) {
        const item = this.internal.newData.state.initial?.abilities?.find(
            one => one.id === id,
        );
        if (!item) return;

        const sumPercent = this.internal.sumPercent;
        if (sumPercent < 100 || value !== 1) {
            this.#batchUpdateInitialAbilityPercent(this.internal.newData.id, [
                { id, percent: item.percent + value },
            ]);
        } else {
            const deltaAbilities = this.#calcupdateDelta(id);
            this.#batchUpdateInitialAbilityPercent(
                this.internal.newData.id,
                deltaAbilities ?? [],
            );
        }
    }

    #roundAbilitiesValue(currentUpdateId: string) {
        let sumPercent = this.internal.sumPercent;
        if (sumPercent > 99) {
            sumPercent = 100;
            let remendValue = 100;
            const deltaAbilities =
                this.internal.newData.state.initial?.abilities
                    ?.filter(item => item.percent !== 0)
                    .map(item => {
                        remendValue -= Math.round(item.percent);
                        return {
                            id: item.id,
                            percent: Math.round(item.percent),
                        };
                    });
            if (remendValue !== 0 && deltaAbilities) {
                // 按照 remendValue 的绝对值，对deltaAbilities中逐个随机取能力值去增加减少最后的数值, 需要避免加在当前处理的能力条上
                const indicesToAdjust = Array.from(
                    { length: deltaAbilities.length },
                    (_, i) => i,
                );
                // 随机打乱索引 (Fisher-Yates shuffle)
                for (let i = indicesToAdjust.length - 1; i > 0; i--) {
                    const j = Math.round(Math.random() * (i + 1));
                    const tempI = indicesToAdjust[i];
                    const tempJ = indicesToAdjust[j];
                    if (tempI !== undefined && tempJ !== undefined) {
                        indicesToAdjust[i] = tempJ;
                        indicesToAdjust[j] = tempI;
                    }
                }

                const currentUpdateIndex = deltaAbilities.findIndex(
                    item => item.id === currentUpdateId,
                );

                // 从索引数组中排除当前更新的索引
                const filteredIndices = indicesToAdjust.filter(
                    index => index !== currentUpdateIndex,
                );

                // 分配剩余值（可正可负）
                const absRemendValue = Math.abs(remendValue);
                const adjustment = remendValue > 0 ? 1 : -1;
                for (
                    let i = 0;
                    i < absRemendValue && i < filteredIndices.length;
                    i++
                ) {
                    const index = filteredIndices[i];
                    const item =
                        index !== undefined ? deltaAbilities[index] : undefined;
                    if (item) {
                        item.percent += adjustment;
                    }
                }
            }
            console.log(
                '🚀 ~ CharacterCreateController ~ deltaAbilities:',
                deltaAbilities,
            );
            this.#batchUpdateInitialAbilityPercent(
                this.internal.newData.id,
                deltaAbilities ?? [],
            );
        }
    }

    #calcupdateDelta(id: string) {
        const updatedPercent =
            this.internal.newData.state.initial?.abilities?.find(
                item => item.id === id,
            )?.percent ?? 0 + 1;
        if (Math.ceil(updatedPercent) >= 100) {
            return this.internal.newData.state.initial?.abilities?.map(item => {
                if (item.id === id) {
                    return {
                        id: item.id,
                        percent: 100,
                    };
                }
                return {
                    id: item.id,
                    percent: 0,
                };
            });
        }

        return this.internal.newData.state.initial?.abilities?.map(item => {
            if (item.id === id) {
                return {
                    id,
                    percent: item.percent + 1,
                };
            }
            if (item.percent > 0) {
                const ratio = (100 - updatedPercent + 1) / item.percent; // 30 / 50 17/50
                return {
                    id: item.id,
                    percent: Math.max(0, item.percent - 1 / ratio),
                };
            }
            return {
                id: item.id,
                percent: Math.max(0, item.percent),
            };
        });
    }

    #clearPickList() {
        this.internal.pickListCursor = null;
        this.internal.pickListHasMore = true;
        this.internal.pickList = [];
        this.internal.selectId = null;
    }

    #toCreate(
        previewData: CharacterTypes.FrozenCharacterInfo | null,
        options: LibTypes.FrozenDefine<{
            previewDataWritable?: boolean,
            previewDataAllowGenerateFigure?: boolean,
        }> = {},
    ) {
        const {
            previewDataWritable = true,
            previewDataAllowGenerateFigure = true,
        } = options;

        this.#ctx.preMode = this.internal.mode;

        this.internal.mode = 'create';
        this.internal.previewData = previewData;
        this.internal.previewDataWritable = previewDataWritable;
        this.internal.previewDataAllowGenerateFigure =
            previewDataAllowGenerateFigure;
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            _newData: null,
            get newData() {
                this._newData ??=
                    $this.#characterController.createNewCharacter();
                return this._newData;
            },

            previewData: null,
            previewDataWritable: true,
            previewDataAllowGenerateFigure: true,

            pickList: [],
            pickListCursor: null,
            pickListHasMore: true,

            selectId: null,
            mode: 'pick',
            currentTagId: null,
            showSearch: false,
            isInteracting: false,
            sortIndex: {},
            sortedAbilities: [],
            innerEvaluation: null,
            evaluation: null,

            // 追踪已交互的能力条
            interactedAbilities: {},

            get currentAbility() {
                const filted = this.sortedAbilities.filter(
                    item => item.ability.percent > 0,
                );
                return filted.at(0)?.ability ?? null;
            },
            searchKeyword: '',

            get currentTag() {
                return (
                    this.defaultConfig?.searchTagList.find(
                        item => item.id === this.currentTagId,
                    ) ?? null
                );
            },

            get defaultConfig() {
                return $this.#characterController.state.defaultConfig;
            },

            get allowSubmit() {
                return this.sumPercent >= 99.8; // TODO
            },

            get isCustom() {
                return this.mode === 'custom';
            },

            get isPick() {
                return this.mode === 'pick';
            },

            get isCreate() {
                return this.mode === 'create';
            },
            get sumPercent() {
                return (
                    this.newData.state.initial?.abilities?.reduce(
                        (prev, cur) => prev + cur.percent,
                        0,
                    ) ?? 0
                );
            },
        };
    }

    protected override onMount() {
        this.#characterController.requestDefaultConfig();
        this.#requestPickList();
    }

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        const { characterEditorCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            characterEditorCtrl.addEventListener('back', () => {
                this.internal.mode = this.#ctx.preMode ?? 'pick';
            }),
            characterEditorCtrl.addEventListener('submit', data => {
                this.emitEvent('submit', async () => {
                    try {
                        const res =
                            await this.#characterController.requestCreate(data);

                        if (StringUtils.isEmpty(res.openingId)) {
                            await this.#characterController.requestMyList();
                            this.#routerController.replace(
                                RouterEnums.RouteName.CharacterList,
                                {
                                    ids: [res.id],
                                },
                            );
                        } else {
                            this.#characterController.requestMyList();
                            this.#routerController.replace(
                                RouterEnums.RouteName.PlayCharacterOpening,
                                {
                                    ids: [res.id, res.openingId],
                                    options: {
                                        animation: 'none',
                                    },
                                },
                            );
                        }
                    } catch (e) {
                        this.emitEvent('submitFail', ErrUtils.getErrorMsg(e));
                    }
                });
            }),
        );
    };

    public readonly toggleMode = (mode: InternalState['mode']) =>
        (this.internal.mode = mode);

    public readonly increaseAbilityValue = (id: string) => {
        // 标记该能力条已被交互
        this.internal.interactedAbilities = {
            ...this.internal.interactedAbilities,
            [id]: true,
        };
        this.#updateInitialAbilityPercent(id, 1);
    };

    public readonly decreaseAbilityValue = (id: string) => {
        // 标记该能力条已被交互
        this.internal.interactedAbilities = {
            ...this.internal.interactedAbilities,
            [id]: true,
        };
        this.#updateInitialAbilityPercent(id, -1);
    };

    public readonly setCurrentTagId = (
        tagId: CharacterTypes.SearchTag['id'] | null,
    ) => {
        this.internal.currentTagId = tagId;
        this.internal.searchKeyword = '';
        this.#clearPickList();
        this.#requestPickList();
    };

    public readonly showSearch = () => {
        this.internal.showSearch = true;
    };

    public readonly hideSearch = () => {
        this.internal.showSearch = false;
        this.internal.searchKeyword = '';
        this.#clearPickList();
        this.#requestPickList();
    };

    public readonly setSearchKeyword = (value: string) => {
        this.internal.searchKeyword = value;
    };

    public readonly search = () => {
        if (!StringUtils.isEmpty(this.internal.searchKeyword.trim())) {
            this.internal.currentTagId = '';
            this.#clearPickList();
            this.#requestPickList();
        }
    };

    public readonly selectCharacter = (
        id: CharacterTypes.CharacterId | null,
    ) => {
        this.internal.selectId = id;
    };

    public readonly confirmSelection = async () => {
        if (this.internal.selectId != null) {
            const data = await this.#characterController.requestCharacterInfo(
                this.internal.selectId,
            );
            if (data) {
                this.#toCreate(data, {
                    previewDataWritable: false,
                    previewDataAllowGenerateFigure: false,
                });
            }
        }
    };

    public readonly generateFromSoul = async () => {
        try {
            const res = await this.#characterController.requestGenerateFromSoul(
                this.internal.newData,
            );

            console.log('requestGenerateFromSoul', res);
            this.#toCreate(res);
        } catch (e) {
            this.emitEvent('generateFail', ErrUtils.getErrorMsg(e));
        }
    };

    public readonly toCreate = () => {
        this.#toCreate(null);
    };

    public readonly setPreviewData = (
        data: CharacterTypes.FrozenCharacterInfo | null,
    ) => {
        this.internal.previewData = data;
    };

    public readonly setIsInteracting = (value: boolean) => {
        this.internal.isInteracting = value;
    };

    public readonly setSortedAbilities = (
        value: LibTypes.VarArr<
            LibTypes.FrozenDefine<{
                rankPosition: number,
                ability: CharacterTypes.InitialAbility,
            }>
        >,
    ) => {
        this.internal.sortedAbilities = value;
    };

    public readonly setSortIndex = (
        value: LibTypes.FrozenGeneralObj<number>,
    ) => {
        this.internal.sortIndex = value;
    };

    // 合规化能力数值
    public readonly roundAbilitiesValue = (currentUpdateId: string) => {
        this.#roundAbilitiesValue(currentUpdateId);
    };

    public readonly requestPickListNext = async () => this.#requestPickList();

    public readonly updateSoulsEvaluation = () => {
        if (this.internal.sumPercent >= 100) {
            this.#requestSoulsEvaluation();
        }
    };

    public readonly goBack = () => {
        this.#routerController.goBack();
    };
}
