// @ts-nocheck
import type {
    DramatizeCardController,
    DramatizeEngineController,
} from '$/component-controllers';
import { DramatizeController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { FeedEnums } from '$/enums';
import type { DramatizeTypes } from '$/types';

type ItemId<K extends FeedEnums.CardKind = FeedEnums.CardKind> =
    `${K}-${number | string}`;

// TODO 预留
type ADItemValue = LibTypes.FrozenDefine<{
    adInfo: LibTypes.FrozenGeneralObj,
}>;
export type CardsFeedADDataItem = BaseItem<FeedEnums.CardKind.AD>;

type DramatizeItemValue = LibTypes.VarDefine<{
    dramatizeId: DramatizeTypes.DramatizeId,
    readed?: true,
    cardCtrl?: LibTypes.Nullable<DramatizeCardController>,
    engineCtrl?: LibTypes.Nullable<DramatizeEngineController>,
    get info(): LibTypes.Nullable<DramatizeTypes.StateDramatizeInfo>,
}>;
export type CardsFeedDramatizeDataItem = BaseItem<FeedEnums.CardKind.Dramatize>;

type BaseItem<TKind extends FeedEnums.CardKind> = LibTypes.FrozenDefine<
    {
        itemId: ItemId<TKind>,
        kind: TKind,
        dramatizeValue: LibTypes.IsEqual<
            TKind,
            FeedEnums.CardKind.Dramatize
        > extends true
            ? DramatizeItemValue
            : null,
        adValue: LibTypes.IsEqual<TKind, FeedEnums.CardKind.AD> extends true
            ? ADItemValue
            : null,
    },
    'adValue' | 'dramatizeValue'
>;
export type CardsFeedDataItem =
    | CardsFeedADDataItem
    | CardsFeedDramatizeDataItem;

type InternalState = LibTypes.VarDefine<{
    active: boolean,

    data: LibTypes.Arr<CardsFeedDataItem>,
    record: LibTypes.Simplify<
        // eslint-disable-next-line @typescript-eslint/sort-type-constituents
        LibTypes.VarGeneralObj<
            CardsFeedDramatizeDataItem | null,
            CardsFeedDramatizeDataItem['itemId']
        > &
            LibTypes.VarGeneralObj<
                CardsFeedADDataItem | null,
                CardsFeedADDataItem['itemId']
            >
    >,
    dragging: boolean,
    moving: boolean,

    bouncingAtBottom: boolean,

    scrollActive: boolean,

    get first(): boolean,
    get last(): boolean,
    get empty(): boolean,

    get scrolling(): boolean,
    get scrollEnabled(): boolean,

    get prevIndex(): number,
    get prevItem(): LibTypes.Nullable<CardsFeedDataItem>,

    currentIndex: number,
    get currentItem(): LibTypes.Nullable<CardsFeedDataItem>,

    get nextIndex(): number,
    get nextItem(): LibTypes.Nullable<CardsFeedDataItem>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'active'
    | 'currentIndex'
    | 'currentItem'
    | 'data'
    | 'empty'
    | 'first'
    | 'last'
    | 'nextItem'
    | 'prevItem'
    | 'scrollEnabled'
    | 'scrolling'
>;

type EventMap = LibTypes.FrozenDefine<{
    scrollTo: LibTypes.Func<void, [index: number]>,
    noMore: LibTypes.SimpleFunction,
}>;

@renderController()
export class CardsFeedController extends BaseRenderController<
    State,
    InternalState,
    EventMap
> {
    public constructor(dramatizeController: DramatizeController) {
        super();
        this.#dramatizeController = dramatizeController;

        this.#watch();
    }

    readonly #dramatizeController;

    #watch() {
        this.watch(
            () => this.internal.last,
            last => {
                if (!last) {
                    this.internal.bouncingAtBottom = false;
                }
            },
        );

        this.watch(
            () =>
                !this.internal.empty &&
                this.internal.bouncingAtBottom &&
                !this.internal.pending &&
                this.internal.active,
            value => {
                if (value && this.internal.last) {
                    this.emitEvent('noMore');
                }
            },
        );
    }

    #getItemId<K extends FeedEnums.CardKind>(kind: K, id: number | string) {
        return `${kind}-${id}` as const;
    }

    //#region Dramatize
    #createDramatizeItem(dramatizeId: DramatizeTypes.DramatizeId) {
        const $this = this;
        if ($this.#dramatizeController.state.dramatizeRecord[dramatizeId]) {
            const dramatizeItem: CardsFeedDramatizeDataItem = {
                itemId: this.getDramatizeItemId(dramatizeId),
                kind: FeedEnums.CardKind.Dramatize,
                dramatizeValue: {
                    dramatizeId,
                    get info() {
                        return $this.#dramatizeController.state.dramatizeRecord[
                            this.dramatizeId
                        ];
                    },
                },
                adValue: null,
            };

            return dramatizeItem;
        }

        return null;
    }
    //#endregion

    protected override getInitialInternalState(): InternalState {
        return {
            active: true,
            data: [],
            record: {},

            dragging: false,
            moving: false,
            bouncingAtBottom: false,

            scrollActive: true,

            get first() {
                return this.currentIndex === 0;
            },
            get last() {
                return this.currentIndex === this.data.length - 1;
            },
            get empty() {
                return this.data.length === 0;
            },

            get scrollEnabled() {
                return this.active && this.scrollActive;
            },
            get scrolling() {
                return this.dragging || this.moving;
            },

            get prevIndex() {
                return this.currentIndex - 1;
            },
            get prevItem() {
                return this.data[this.prevIndex];
            },

            currentIndex: 0,
            get currentItem() {
                return this.data[this.currentIndex];
            },

            get nextIndex() {
                return this.currentIndex + 1;
            },
            get nextItem() {
                return this.data[this.nextIndex];
            },
        };
    }

    public readonly setData = (newData: LibTypes.Arr<CardsFeedDataItem>) => {
        this.internal.record = {};
        this.internal.data = newData;
        this.internal.data.forEach(item => {
            if (item.kind === FeedEnums.CardKind.AD) {
                this.internal.record[item.itemId] = item;
            } else {
                this.internal.record[item.itemId] = item;
            }
        });
    };

    public readonly clearData = () => {
        this.internal.record = {};
        this.internal.data = [];
    };

    public readonly toggleCurrentIndex = (currentIndex: number) => {
        this.internal.currentIndex = currentIndex;
    };

    public readonly scrollTo = (itemId: ItemId) => {
        const index = this.internal.data.findIndex(
            item => item.itemId === itemId,
        );
        if (index >= 0) {
            this.emitEvent('scrollTo', index);
        }
    };

    public readonly scrollToTop = () => {
        const itemId = this.internal.data[0]?.itemId;
        itemId != null && this.scrollTo(itemId);
    };

    public readonly delete = (itemIds: LibTypes.Arrayable<ItemId>) => {
        const list = itemIds instanceof Array ? itemIds : [itemIds];
        let newData = this.internal.data;

        list.forEach(itemId => {
            const index = newData.findIndex(item => item.itemId === itemId);
            this.internal.record[itemId] = null;
            if (index >= 0) {
                newData = newData.toSpliced(index, 1);
            }
        });

        this.internal.data = newData;
    };

    public readonly moving = (moving = true) => {
        this.internal.moving = moving;
    };

    public readonly dragging = (dragging = true) => {
        this.internal.dragging = dragging;
    };

    public readonly scrollActive = (active = true) =>
        (this.internal.scrollActive = active);

    public readonly bouncingAtBottom = (bouncingAtBottom = true) =>
        (this.internal.bouncingAtBottom = bouncingAtBottom);

    //#region Dramatize
    public readonly setPrevDramatize = (
        cardCtrl: DramatizeCardController,
        engineCtrl: DramatizeEngineController,
    ) => {
        if (this.internal.prevItem?.dramatizeValue) {
            this.internal.prevItem.dramatizeValue.cardCtrl = cardCtrl;
            this.internal.prevItem.dramatizeValue.engineCtrl = engineCtrl;
        }
    };

    public readonly setCurrentDramatize = (
        cardCtrl: DramatizeCardController,
        engineCtrl: DramatizeEngineController,
    ) => {
        if (this.internal.currentItem?.dramatizeValue) {
            this.internal.currentItem.dramatizeValue.cardCtrl = cardCtrl;
            this.internal.currentItem.dramatizeValue.engineCtrl = engineCtrl;
        }
    };

    public readonly setNextDramatize = (
        cardCtrl: DramatizeCardController,
        engineCtrl: DramatizeEngineController,
    ) => {
        if (this.internal.nextItem?.dramatizeValue) {
            this.internal.nextItem.dramatizeValue.cardCtrl = cardCtrl;
            this.internal.nextItem.dramatizeValue.engineCtrl = engineCtrl;
        }
    };

    public readonly getDramatizeItem = (
        dramatizeId: DramatizeTypes.DramatizeId,
    ) => this.internal.record[this.getDramatizeItemId(dramatizeId)];

    public readonly getDramatizeItemId = (
        dramatizeId: DramatizeTypes.DramatizeId,
    ) => this.#getItemId(FeedEnums.CardKind.Dramatize, dramatizeId);

    public readonly deleteDramatize = (
        dramatizeIds: LibTypes.Arrayable<DramatizeTypes.DramatizeId>,
    ) => {
        const list =
            dramatizeIds instanceof Array ? dramatizeIds : [dramatizeIds];
        this.delete(
            list.map(dramatizeId => this.getDramatizeItemId(dramatizeId)),
        );
    };

    public readonly scrollToDramatize = (
        dramatizeId: DramatizeTypes.DramatizeId,
    ) => {
        this.scrollTo(this.getDramatizeItemId(dramatizeId));
    };

    public readonly concatDramatizeList = (
        list: LibTypes.Arr<DramatizeTypes.DramatizeId>,
    ) => {
        const dramatizeItemList = list
            .map(id => {
                if (this.internal.record[this.getDramatizeItemId(id)] == null) {
                    const dramatizeItem = this.#createDramatizeItem(id);
                    if (dramatizeItem) {
                        this.internal.record[dramatizeItem.itemId] =
                            dramatizeItem;
                    }

                    return dramatizeItem;
                }

                return null;
            })
            .filter(item => !!item);

        this.internal.data = [...this.internal.data, ...dramatizeItemList];
    };
    //#endregion
}
