// @ts-nocheck
import { CharacterController, RouterController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { CharacterTypes } from '$/types';
import { ArrayUtils, DataStoreUtils, DateUtils } from '$/utils';

import { getCharacterInfoFromRoute } from '../@com';

import {
    BASE_HOUR_HEIGHT,
    CARD_VERTICAL_GAP,
    LIST_CONTENT_PADDING_TOP,
    MIN_COLLAPSED_CARD_HEIGHT,
} from './character-schedule-const';

type InternalState = LibTypes.VarDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,

    ids: LibTypes.Arr<string>,
    list: LibTypes.Arr<CharacterTypes.FrozenScheduleInfo>,

    currentDatetime: Date,

    displayDate: Date,

    expandMap: LibTypes.VarGeneralObj<boolean>,

    isDisplayDateToday: boolean,
    expandedCardHeightMap: LibTypes.VarGeneralObj<number>,
    realLineCountMap: LibTypes.VarGeneralObj<number>,
    hourHeights: LibTypes.VarArr<number>,
    layoutMap: LibTypes.VarGeneralObj<{ top: number, height: number }>,
    hourSlots: LibTypes.VarArr<
        LibTypes.VarDefine<{
            hour: number,
            items: LibTypes.VarArr<CharacterTypes.FrozenScheduleInfo>,
        }>
    >,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'currentDatetime'
    | 'data'
    | 'displayDate'
    | 'expandedCardHeightMap'
    | 'expandMap'
    | 'hourHeights'
    | 'hourSlots'
    | 'isDisplayDateToday'
    | 'layoutMap'
    | 'realLineCountMap'
>;

@renderController()
export class CharacterScheduleController extends BaseRenderController<
    State,
    InternalState
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

    #rawSegments: LibTypes.VarArr<
        LibTypes.VarDefine<{
            start: number,
            end: number,
            height: number,
        }>
    > = [];

    #watch() {
        this.watch(
            () => {
                const isDisplayDateToday = this.internal.isDisplayDateToday;
                return {
                    ids: this.internal.ids,
                    displayDate: this.internal.displayDate,
                    isDisplayDateToday,
                    currentDatetime: isDisplayDateToday
                        ? this.internal.currentDatetime
                        : undefined,
                };
            },
            ({ ids, displayDate, isDisplayDateToday, currentDatetime }) => {
                const dayStart = new Date(displayDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const now = currentDatetime ?? new Date();

                const list: LibTypes.VarArr<CharacterTypes.FrozenScheduleInfo> =
                    [];

                for (const id of ids) {
                    const item = this.#characterController.getSchedule(id);

                    if (!item) {
                        continue;
                    }

                    // 创建副本（防篡改）
                    const itemStart = new Date(item.state.start);
                    const itemEnd = new Date(item.state.end);

                    if (itemEnd <= dayStart || itemStart >= dayEnd) {
                        continue;
                    }

                    const clampedStart =
                        itemStart < dayStart
                            ? new Date(dayStart.getTime())
                            : itemStart;
                    const clampedEnd =
                        itemEnd > dayEnd ? new Date(dayEnd.getTime()) : itemEnd;

                    if (clampedEnd <= clampedStart) {
                        continue;
                    }

                    if (isDisplayDateToday && clampedStart > now) {
                        continue;
                    }

                    // Clone item to avoid modifying original record during adjustment

                    // TODD
                    const info = DataStoreUtils.proxyReactiveData({
                        ...item,
                        state: {
                            ...item.state,
                            start: clampedStart,
                            end: clampedEnd,
                        },
                    });

                    list.push(info);
                }

                this.internal.list = list;

                this.#computeLayout();
            },
            { immediate: true, deep: true },
        );
    }

    // 辅助计算方法
    #getMinutesOfDisplayDay(d: Date) {
        const dayStart = new Date(this.internal.displayDate);
        dayStart.setHours(0, 0, 0, 0);
        return (d.getTime() - dayStart.getTime()) / 60_000;
    }

    #computeLayout() {
        // 1. Compute Hour Slots
        const slots: InternalState['hourSlots'] = [];
        for (let hour = 0; hour <= 24; hour += 1) {
            slots.push({
                hour,
                items: [],
            });
        }

        const list = this.internal.list;
        for (const item of list) {
            const hour = item.state.start.getHours();
            if (hour >= 0 && hour <= 23) {
                const slot = slots[hour];
                slot?.items.push(item);
            }
        }

        for (const slot of slots) {
            slot.items.sort(
                (a, b) => a.state.start.getTime() - b.state.start.getTime(),
            );
        }
        this.internal.hourSlots = slots;

        // 2. Compute Segment Heights
        // 收集所有关键时间点（相对于当天0点的分钟数）
        // 包含：0, 60, 120... (整点) 和 所有日程的开始/结束时间
        const timePoints = new Set<number>();
        for (let h = 0; h <= 24; h++) {
            timePoints.add(h * 60);
        }
        for (const item of list) {
            timePoints.add(this.#getMinutesOfDisplayDay(item.state.start));
            timePoints.add(this.#getMinutesOfDisplayDay(item.state.end));
        }
        // 排序去重
        const sortedPoints = Array.from(timePoints).sort((a, b) => a - b);

        // 构建 Segments
        // { start: 0, end: 45, baseHeight: ..., extraHeight: 0 }
        const segments: LibTypes.VarArr<
            LibTypes.VarDefine<{
                start: number,
                end: number,
                height: number,
            }>
        > = [];

        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];
            if (start == null || end == null) continue;

            const duration = end - start;
            if (duration <= 0) continue;

            segments.push({
                start,
                end,
                height: (duration / 60) * BASE_HOUR_HEIGHT,
            });
        }

        // 3. 分配高度
        // 为了优化紧凑度，可以考虑先处理短日程？这里简单起见按原始顺序（或可先按持续时间排序）
        // 复制一份 list 用于排序处理，不影响原始顺序
        const processingList = [...list].sort((a, b) => {
            const durationA = a.state.end.getTime() - a.state.start.getTime();
            const durationB = b.state.end.getTime() - b.state.start.getTime();
            return durationA - durationB; // 短日程优先
        });

        const expandMap = this.internal.expandMap;
        const expandedCardHeightMap = this.internal.expandedCardHeightMap;

        for (const item of processingList) {
            const isExpanded = Boolean(expandMap[item.id]);
            const measuredHeight = expandedCardHeightMap[item.id];
            let contentHeight = MIN_COLLAPSED_CARD_HEIGHT;
            if (isExpanded) {
                if (measuredHeight != null) {
                    contentHeight = measuredHeight;
                }
            }

            const startMin = this.#getMinutesOfDisplayDay(item.state.start);
            const endMinRaw = this.#getMinutesOfDisplayDay(item.state.end);
            const endMin = Math.min(24 * 60, Math.max(endMinRaw, startMin));
            // const durationMinutes = Math.max(1, endMin - startMin);

            // 找到该日程覆盖的所有 Segments
            // 注意：Segments 是连续且有序的
            const coveredSegments = segments.filter(
                seg =>
                    seg.start >= startMin &&
                    seg.end <= endMin &&
                    seg.start < seg.end,
            );

            if (coveredSegments.length === 0) continue;

            const currentTotalHeight = coveredSegments.reduce(
                (sum, seg) => sum + seg.height,
                0,
            );

            const targetHeight = contentHeight + CARD_VERTICAL_GAP;
            const extraHeightNeeded = targetHeight - currentTotalHeight;

            if (extraHeightNeeded > 0) {
                // 将额外高度分配给覆盖的 Segments
                // 策略：按 Segment 时长权重分配
                const totalCoveredDuration = coveredSegments.reduce(
                    (sum, seg) => sum + (seg.end - seg.start),
                    0,
                );

                if (totalCoveredDuration > 0) {
                    for (const seg of coveredSegments) {
                        const weight =
                            (seg.end - seg.start) / totalCoveredDuration;
                        seg.height += extraHeightNeeded * weight;
                    }
                }
            }
        }

        // 4. 汇总到 HourHeights 和 LayoutMap
        const hourHeights: LibTypes.VarArr<number> = Array.from(
            { length: 25 },
            () => 0,
        );
        const layoutMap: LibTypes.VarGeneralObj<{
            top: number,
            height: number,
        }> = {};

        // 建立 Minute -> Y 坐标的查找表（优化性能，或者直接用 Segment 累加）
        // 这里为了简单，直接遍历 Segments 累加
        let currentY = 0;
        // 辅助：记录每个整点小时的起始 Y
        const hourStartY: LibTypes.VarArr<number> = [];

        for (const seg of segments) {
            // 如果是整点开始的 Segment，记录 Hour Start Y
            if (seg.start % 60 === 0) {
                const h = seg.start / 60;
                if (h < 25) hourStartY[h] = currentY;
            }
            // 累加 Hour Height
            const h = Math.floor(seg.start / 60);
            if (h >= 0 && h < 25) {
                const currentHeight = hourHeights[h];
                hourHeights[h] = (currentHeight ?? 0) + seg.height;
            }

            currentY += seg.height;
        }

        // 计算每个日程的 Relative Top
        for (const item of list) {
            const startMin = this.#getMinutesOfDisplayDay(item.state.start);
            const h = Math.floor(startMin / 60);
            const hourStart = hourStartY[h] ?? 0;

            // 计算该日程 StartMin 的绝对 Y
            // 找到 startMin 之前的 Segments
            let itemAbsoluteY = 0;
            for (const seg of segments) {
                if (seg.end <= startMin) {
                    itemAbsoluteY += seg.height;
                } else if (seg.start < startMin && seg.end > startMin) {
                    // StartMin 在 Segment 中间（理论上不会，因为我们把 StartMin 加入了分割点）
                    // 但以防万一
                    const ratio =
                        (startMin - seg.start) / (seg.end - seg.start);
                    itemAbsoluteY += seg.height * ratio;
                    break;
                } else if (seg.start >= startMin) {
                    break;
                }
            }

            const relativeTop = Math.max(0, itemAbsoluteY - hourStart);
            // 这里为了对齐 header (10px padding)，可以在 UI 处理，或者这里加上
            // UI 中 renderItem 里的 cardTop = (min/60)*h + 16.
            // 我们这里只计算“时间轴偏移”，UI 里的 +16 依然保留（timelineHeaderRow height/2 + 6px gap）
            // 或者我们约定 layoutMap.top 包含了所有偏移？
            // 还是保持 layoutMap.top 纯粹是时间对应的 Y 偏移。
            // 考虑到 UI 的结构：timelineRow { relative }. Card { absolute, top }.
            // 这里的 Top 是相对于 timelineRow (即 hour) 的。
            // UI 中之前的逻辑： (min/60)*h + 16.
            // 新逻辑： relativeTop + 16.

            // 还需要计算 item 在当前布局下的实际高度吗？
            // item.height = targetHeight (content + gap).
            // 但如果它跨越了多个 Segments，且这些 Segments 被别的更长日程撑得更大了？
            // item 的视觉高度应该由它覆盖的 Segments 的高度之和决定（减去 Gap）。
            const endMinRaw = this.#getMinutesOfDisplayDay(item.state.end);
            const endMin = Math.min(24 * 60, Math.max(endMinRaw, startMin));

            const coveredSegs = segments.filter(
                s => s.start >= startMin && s.end <= endMin,
            );
            const visualTotalHeight = coveredSegs.reduce(
                (s, x) => s + x.height,
                0,
            );
            const visualHeight = Math.max(
                0,
                visualTotalHeight - CARD_VERTICAL_GAP,
            );

            layoutMap[item.id] = {
                top: relativeTop,
                height: visualHeight,
            };
        }

        this.internal.hourHeights = hourHeights;
        this.internal.layoutMap = layoutMap;

        // 保存 segments 供 getScrollOffset 使用 (可选，或者重新计算)
        this.#rawSegments = segments;
    }

    #isToday(date: Date) {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    }

    async #init() {
        const dataFromRoute = getCharacterInfoFromRoute(
            this.internal.route,
            this.#characterController,
        );

        if (dataFromRoute) {
            this.internal.data = dataFromRoute;
        }

        this.#computeLayout();

        if (this.internal.data) {
            const ids = await this.#characterController.requestSchedules(
                this.internal.data.id,
                this.internal.displayDate,
            );
            if (ids) {
                this.internal.ids = ArrayUtils.toDeduplicate([
                    ...this.internal.ids,
                    ...ids,
                ]);
            }
        }
    }

    protected override getInitialInternalState(): InternalState {
        const now = new Date();
        return {
            ids: [],
            data: null,
            list: [],

            currentDatetime: now,
            displayDate: now,
            isDisplayDateToday: true,

            expandMap: {},
            expandedCardHeightMap: {},
            realLineCountMap: {},
            hourHeights: Array.from({ length: 25 }, () => BASE_HOUR_HEIGHT),
            layoutMap: {},
            hourSlots: [],
        };
    }

    protected override onMount() {
        const timer = setInterval(() => {
            const now = new Date();
            this.internal.currentDatetime = now;
            this.internal.isDisplayDateToday = this.#isToday(
                this.internal.displayDate,
            );
        }, 30_000);
        return () => clearInterval(timer);
    }

    // 导航相关
    public readonly goBack = () => {
        this.#routerController.goBack();
    };

    public readonly expandAndRead = (
        id: CharacterTypes.FrozenScheduleInfo['id'],
    ) => {
        const shouldExpand = !this.internal.expandMap[id];
        if (shouldExpand) {
            this.internal.expandMap[id] = true;
        }
        if (this.internal.data) {
            this.#characterController.setScheduleState(id, 'readed', true);
            this.#characterController.requestScheduleViewStatus(id);
        }
        this.#computeLayout();
    };

    public readonly read = (id: CharacterTypes.FrozenScheduleInfo['id']) => {
        if (this.internal.data) {
            this.#characterController.setScheduleState(id, 'readed', true);
            this.#characterController.requestScheduleViewStatus(id);
            // List changes, recompute layout
            this.#computeLayout();
        }
    };

    public readonly increaseDate = async () => {
        this.internal.displayDate = DateUtils.add(
            this.internal.displayDate,
            1,
            'day',
        );
        this.internal.isDisplayDateToday = this.#isToday(
            this.internal.displayDate,
        );

        if (this.internal.data) {
            const ids = await this.#characterController.requestSchedules(
                this.internal.data.id,
                this.internal.displayDate,
            );
            if (ids) {
                this.internal.ids = ArrayUtils.toDeduplicate([
                    ...this.internal.ids,
                    ...ids,
                ]);
            }
        }
    };

    public readonly decreaseDate = async () => {
        this.internal.displayDate = DateUtils.add(
            this.internal.displayDate,
            -1,
            'day',
        );
        this.internal.isDisplayDateToday = this.#isToday(
            this.internal.displayDate,
        );

        if (this.internal.data) {
            const ids = await this.#characterController.requestSchedules(
                this.internal.data.id,
                this.internal.displayDate,
            );
            if (ids) {
                this.internal.ids = ArrayUtils.toDeduplicate([
                    ...this.internal.ids,
                    ...ids,
                ]);
            }
        }
    };

    // Layout Methods
    public readonly updateExpandedCardHeight = (
        id: CharacterTypes.FrozenScheduleInfo['id'],
        height: number,
    ) => {
        if (this.internal.expandedCardHeightMap[id] === height) {
            return;
        }
        this.internal.expandedCardHeightMap[id] = height;
        this.#computeLayout();
    };

    public readonly updateRealLineCount = (
        id: CharacterTypes.FrozenScheduleInfo['id'],
        lines: number,
    ) => {
        if (this.internal.realLineCountMap[id] === lines) {
            return;
        }
        this.internal.realLineCountMap[id] = lines;
    };

    public readonly getEventHeight = (
        item: CharacterTypes.FrozenScheduleInfo,
    ) => {
        const startMin = this.#getMinutesOfDisplayDay(item.state.start);
        const endMinRaw = this.#getMinutesOfDisplayDay(item.state.end);
        const endMin = Math.min(24 * 60, Math.max(endMinRaw, startMin));

        if (endMin <= startMin) {
            return 0;
        }

        const startSeg = Math.max(0, Math.min(23, Math.floor(startMin / 60)));
        const endSegExclusiveRaw = Math.ceil(endMin / 60);
        const endSegExclusive = Math.max(
            startSeg + 1,
            Math.min(24, endSegExclusiveRaw),
        );

        let height = 0;
        for (let h = startSeg; h < endSegExclusive; h += 1) {
            const segStart = h * 60;
            const segEnd = (h + 1) * 60;
            const overlap =
                Math.min(endMin, segEnd) - Math.max(startMin, segStart);
            if (overlap > 0) {
                const segHeight =
                    this.internal.hourHeights[h] ?? BASE_HOUR_HEIGHT;
                height += (overlap / 60) * segHeight;
            }
        }

        return height;
    };

    public readonly getEventBaseHeight = (
        item: CharacterTypes.FrozenScheduleInfo,
    ) => {
        const startMin = this.#getMinutesOfDisplayDay(item.state.start);
        const endMinRaw = this.#getMinutesOfDisplayDay(item.state.end);
        const endMin = Math.min(24 * 60, Math.max(endMinRaw, startMin));

        if (endMin <= startMin) {
            return 0;
        }

        const startSeg = Math.max(0, Math.min(23, Math.floor(startMin / 60)));
        const endSegExclusiveRaw = Math.ceil(endMin / 60);
        const endSegExclusive = Math.max(
            startSeg + 1,
            Math.min(24, endSegExclusiveRaw),
        );

        let height = 0;
        for (let h = startSeg; h < endSegExclusive; h += 1) {
            const segStart = h * 60;
            const segEnd = (h + 1) * 60;
            const overlap =
                Math.min(endMin, segEnd) - Math.max(startMin, segStart);
            if (overlap > 0) {
                height += (overlap / 60) * BASE_HOUR_HEIGHT;
            }
        }

        return height;
    };

    public readonly getScrollOffset = (date: Date) => {
        const totalMinutes = this.#getMinutesOfDisplayDay(date);

        // 使用 rawSegments 计算
        let offset = 0;
        for (const seg of this.#rawSegments) {
            if (totalMinutes >= seg.end) {
                offset += seg.height;
            } else if (totalMinutes >= seg.start && totalMinutes < seg.end) {
                const ratio =
                    (totalMinutes - seg.start) / (seg.end - seg.start);
                offset += seg.height * ratio;
                break;
            } else {
                // totalMinutes < seg.start (segments are sorted)
                break;
            }
        }

        // 返回时间点对应的中心 Y 坐标
        // UI 中 TimelineHeaderRow 的 line 在 height(20)/2 = 10px 的位置
        // 所以时间点的中心坐标是 offset + 10
        // 考虑到 ScrollView contentContainer 有 paddingTop (LIST_CONTENT_PADDING_TOP = 12)
        // 而 CurrentTimeLine 是 absolute 定位，不受 padding 影响（或者说是相对于 padding box 顶部？）
        // 不，CurrentTimeLine 的 top 是相对于父容器 (contentContainer) 的左上角。
        // 如果 TimelineRow 受 padding 影响下移了 12px，那么 CurrentTimeLine 也需要下移 12px 才能对齐。
        // UI 的 CurrentTimeLineContainer (小球) 需要 top = center - ball_radius(6)
        // 所以最终 top = (offset + 10 + LIST_CONTENT_PADDING_TOP) - 6
        return offset + 10 + LIST_CONTENT_PADDING_TOP - 6;
    };

    public readonly getMinutesOfDayPublic = (d: Date) =>
        this.#getMinutesOfDisplayDay(d);
}
