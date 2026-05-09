// @ts-nocheck
import { DRAMATIZE } from '$/consts';
import { BaseRenderController, renderController } from '$/core';
import { DataStoreDomain } from '$/domains';
import { ApiService, FileService } from '$/services';
import type { DataStoreTypes, FileTypes } from '$/types';
import { ArrayUtils, FileUtils, TaskUtils } from '$/utils';

import { Settings } from './dramatize-panel-const';

type ReviewAttrs = LibTypes.Define<{
    chapterName: string | null,
    time: string | null,
    roleName: string | null,
    isMe: boolean,
    text: string | null,
    choice: string | null,
}>;

export type ReviewInfo = DataStoreTypes.DataItem<
    LibTypes.Reference,
    ReviewAttrs
>;

export type ChapterListItem = LibTypes.Define<{
    id: string,
    title: string,
    image: FileTypes.ImageResource,
}>;

type InternalState = LibTypes.VarDefine<{
    chapterList: LibTypes.Arr<ChapterListItem>,
    selectedChapterId: string | null,
    totalChapterCount: number,
    chapterEnabled: boolean,
    speedEnabled: boolean,
    reviewEnabled: boolean,
    showReview: boolean,
    reviewStartNarrativeId: string | null,
    reviewIds: LibTypes.Arr<string>,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'chapterEnabled'
    | 'chapterList'
    | 'reviewEnabled'
    | 'reviewIds'
    | 'selectedChapterId'
    | 'showReview'
    | 'speedEnabled'
    | 'totalChapterCount'
>;

type Props = LibTypes.Define<{
    playId: string | null,
    speedEnabled: boolean,
    chapterEnabled: boolean,
    reviewEnabled: boolean,
}>;

type Context = LibTypes.VarDefine<{
    reviewNextNarrativeId: string | null,
    reviewHasMore: boolean,
}>;

@renderController()
export class DramatizePanelController extends BaseRenderController<
    State,
    InternalState,
    never,
    Props
> {
    public constructor(apiService: ApiService, fileService: FileService) {
        super();
        this.#apiService = apiService;
        this.#fileService = fileService;

        this.#watch();
    }

    readonly #apiService;
    readonly #fileService;

    readonly #reviewDataStore = this.getDomain(
        DataStoreDomain<LibTypes.Reference, ReviewAttrs>,
        {
            dataSizeLimit: Settings.dataSizeLimit,
        },
    );

    readonly #ctx: Context = {
        reviewNextNarrativeId: null,
        reviewHasMore: true,
    };

    readonly #requestReviewList = TaskUtils.createSerialTask(async () => {
        if (
            this.#ctx.reviewNextNarrativeId != null &&
            this.#ctx.reviewHasMore
        ) {
            const requestId = this.#ctx.reviewNextNarrativeId;
            const res =
                await this.#apiService.call.play.query_history_narrative_text({
                    scene: 'play',
                    current_narrative_id: this.#ctx.reviewNextNarrativeId,
                    limit: Settings.reviewLimit,
                });

            if (requestId === this.#ctx.reviewNextNarrativeId) {
                const ids: LibTypes.VarArr<string> = [];
                for (let index = 0; index < res.list.length; index++) {
                    const lastItem = res.list[index - 1];
                    const item = res.list[index];
                    if (item) {
                        if (item.chapter_name !== lastItem?.chapter_name) {
                            const chapterId = `c-${item.chapter_id}`;
                            this.#reviewDataStore.upsert({
                                id: chapterId,
                                isLocal: false,
                                state: {},

                                chapterName: item.chapter_name,
                                time: item.chapter_desc ?? null,
                                roleName: null,
                                isMe: false,
                                text: null,
                                choice: null,
                            });

                            ids.push(chapterId);
                        }

                        const id = `n-${item.narrative_id}`;

                        this.#reviewDataStore.upsert({
                            id,
                            isLocal: false,
                            state: {},

                            chapterName: null,
                            time: null,
                            roleName: DRAMATIZE.NarratorRoles.includes(
                                item.role.trim(),
                            )
                                ? null
                                : item.role.trim(),
                            isMe: item.is_me,
                            text: item.text,
                            choice: item.interaction_choice ?? null,
                        });

                        ids.push(id);
                    }
                }

                this.internal.reviewIds = ArrayUtils.toDeduplicate([
                    ...ids,
                    ...this.internal.reviewIds,
                ]);

                this.#ctx.reviewNextNarrativeId = res.next_narrative_id;
                this.#ctx.reviewHasMore = res.has_more;
            }
        }
    });

    public readonly getReview = this.#reviewDataStore.get;

    #watch() {
        this.watch(
            () =>
                this.internal.chapterEnabled && this.internal.totalChapterCount,
            async totalChapterCount => {
                if (totalChapterCount !== false && totalChapterCount > 0 && this.props.playId != null) {
                    const res = await this.#apiService.call.play.list_acts({
                        play_id: this.props.playId,
                        limit: 1000,
                        cursor: '',
                    });

                    const chapterList = res.list
                        .filter(
                            item =>
                                !this.internal.chapterList.find(
                                    one => one.id === item.play_act_id,
                                ),
                        )
                        .map<ChapterListItem>(item => ({
                            id: item.play_act_id,
                            title: item.act_title,
                            image: this.#fileService.createImageResource(
                                item.bkg_media.id,
                                FileUtils.getImageInfoFromApiInfo(
                                    item.bkg_media,
                                ),
                            ),
                        }));

                    this.internal.chapterList = [
                        ...this.internal.chapterList,
                        ...chapterList,
                    ];

                    this.internal.selectedChapterId ??=
                        this.internal.chapterList.at(-1)?.id ?? null;
                }
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () =>
                this.internal.reviewEnabled &&
                this.internal.showReview &&
                this.internal.reviewStartNarrativeId,
            narrativeId => {
                if (narrativeId !== null && narrativeId !== false) {
                    this.#clearReview(narrativeId);
                    this.#requestReviewList();
                }
            },
        );

        this.watch(
            () => !this.internal.reviewEnabled || !this.internal.showReview,
            value => {
                if (value) {
                    this.#clearReview(null);
                }
            },
        );
    }

    #clearReview(reviewNextNarrativeId: string | null) {
        this.#ctx.reviewNextNarrativeId = reviewNextNarrativeId;
        this.#ctx.reviewHasMore = true;
        this.internal.reviewIds = [];
    }

    protected override getInitialInternalState(): InternalState {
        return {
            chapterList: [],

            totalChapterCount: 0,
            selectedChapterId: null,
            chapterEnabled: this.props.chapterEnabled,
            speedEnabled: this.props.speedEnabled,
            reviewEnabled: this.props.reviewEnabled,
            showReview: false,
            reviewStartNarrativeId: null,
            reviewIds: [],
        };
    }

    public readonly updateChaterCount = (totalChapterCount: number) => {
        this.internal.totalChapterCount = totalChapterCount;
    };

    public readonly chapterEnabled = (chapterEnabled: boolean) => {
        this.internal.chapterEnabled = chapterEnabled;
    };

    public readonly speedEnabled = (speedEnabled: boolean) => {
        this.internal.speedEnabled = speedEnabled;
    };

    public readonly reviewEnabled = (reviewEnabled: boolean) => {
        this.internal.reviewEnabled = reviewEnabled;
    };

    public readonly showReview = () => (this.internal.showReview = true);

    public readonly hideReview = () => (this.internal.showReview = false);

    public readonly setSelectedChapterId = (id: string) => {
        this.internal.selectedChapterId = id;
    };

    public readonly setReviewStartNarrativeId = (id: string | null) =>
        (this.internal.reviewStartNarrativeId = id);

    public readonly requestMoreReview = async () => this.#requestReviewList();
}
