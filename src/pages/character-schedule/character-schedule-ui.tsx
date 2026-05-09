// @ts-nocheck
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import { CharacterScheduleController } from './character-schedule-controller';
import { useEffect, useRef } from 'react';
import { BASE_HOUR_HEIGHT, CARD_VERTICAL_GAP } from './character-schedule-const';
import type { CharacterTypes } from '$/types';

export const CharacterSchedulePage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterScheduleController);

    const state = useReactive(
        () => ({
            background: ctrl.state.data?.state.behavior.backgroundImage,
            currentFigureVisual: ctrl.state.data?.state.behavior.currentFigureVisual,
            displayDate: ctrl.state.displayDate,
            isDisplayDateToday: ctrl.state.isDisplayDateToday,
            expandMap: ctrl.state.expandMap,
            currentDatetime: ctrl.state.currentDatetime,
            hourSlots: ctrl.state.hourSlots,
            hourHeights: ctrl.state.hourHeights,
            expandedCardHeightMap: ctrl.state.expandedCardHeightMap,
            layoutMap: ctrl.state.layoutMap,
        }),
        { deep: true },
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const hasScrolledRef = useRef(false);

    useEffect(() => {
        if (
            hasScrolledRef.current ||
            !state.isDisplayDateToday ||
            state.hourHeights.length === 0
        ) return;

        const offset = Math.max(0, ctrl.getScrollOffset(state.currentDatetime) - 100);
        scrollRef.current?.scrollTo({ top: offset, behavior: 'instant' as ScrollBehavior });
        hasScrolledRef.current = true;
    }, [state.isDisplayDateToday, state.currentDatetime, state.hourHeights]);

    const month = state.displayDate.getMonth() + 1;
    const day = state.displayDate.getDate();
    const forwardDisabled = state.isDisplayDateToday;

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page relative overflow-hidden">
                {/* Background layer */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    {state.background?.uri && (
                        <img src={state.background.uri} alt="bg" className="w-full h-full object-cover" />
                    )}
                    {state.currentFigureVisual?.uri && (
                        <img src={state.currentFigureVisual.uri} alt="character" className="absolute inset-0 w-full h-full object-contain" />
                    )}
                    {/* Blur overlay */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                </div>

                {/* Content layer */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex flex-row items-center px-4 pt-4 pb-2 shrink-0">
                        <Pressable
                            onPress={ctrl.goBack}
                            className="w-9 h-9 flex items-center justify-center"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Pressable>
                    </div>

                    {/* Date row */}
                    <div className="flex flex-row items-center gap-2 px-4 pb-3 shrink-0">
                        <span className="text-text-primary font-medium text-4xl">
                            {month}月{day}日
                        </span>
                        <div className="flex flex-row items-center gap-1 ml-1">
                            <Pressable
                                onPress={ctrl.decreaseDate}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M10 4L6 8l4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Pressable>
                            <Pressable
                                onPress={ctrl.increaseDate}
                                disabled={forwardDisabled}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 disabled:opacity-20"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Pressable>
                        </div>
                        <div style={{
                            writingMode: 'vertical-rl', textOrientation: 'mixed',
                            fontSize: 11, color: 'rgba(255,255,255,0.5)',
                            letterSpacing: 2,
                        }}>
                            AI 生成
                        </div>
                    </div>

                    {/* Timeline scroll */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-4 pb-7"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <div className="relative">
                            {state.hourSlots.map((slot: CharacterTypes.HourSlot) => {
                                const displayHour = slot.hour === 24 ? 0 : slot.hour;
                                const timeLabel = `${String(displayHour).padStart(2, '0')}:00`;
                                const hourHeight = state.hourHeights[slot.hour] ?? BASE_HOUR_HEIGHT;

                                return (
                                    <div
                                        key={slot.hour}
                                        className="relative overflow-visible"
                                        style={{ height: hourHeight, zIndex: 1000 - slot.hour }}
                                    >
                                        {/* Timeline header row */}
                                        <div className="absolute left-0 right-0 top-0 flex flex-row items-center h-5 z-0">
                                            <span className="text-white/60 text-sm shrink-0 w-12">{timeLabel}</span>
                                            <div className="flex-1 h-px bg-white/60 ml-3" />
                                        </div>

                                        {/* Cards column */}
                                        <div className="absolute left-12 right-0 top-0 bottom-0 overflow-visible ml-3">
                                            {slot.items.map((scheduleItem: CharacterTypes.FrozenScheduleInfo) => {
                                                const layoutInfo = state.layoutMap[scheduleItem.id];
                                                const startMin = ctrl.getMinutesOfDayPublic(scheduleItem.state.start);
                                                const minutesInHour = startMin - slot.hour * 60;
                                                const currentHourHeight = state.hourHeights[slot.hour] ?? BASE_HOUR_HEIGHT;
                                                const cardTop = layoutInfo
                                                    ? layoutInfo.top + 16
                                                    : (minutesInHour / 60) * currentHourHeight + 16;

                                                const cardHeight = layoutInfo
                                                    ? layoutInfo.height
                                                    : Math.max(0, ctrl.getEventBaseHeight(scheduleItem) - CARD_VERTICAL_GAP);

                                                const isExpanded = Boolean(state.expandMap[scheduleItem.id]);

                                                return (
                                                    <Pressable
                                                        key={scheduleItem.id}
                                                        className="absolute left-0 right-0 bg-bg-card rounded-2xl p-3 overflow-hidden"
                                                        style={{
                                                            top: cardTop,
                                                            height: isExpanded ? undefined : Math.max(60, cardHeight),
                                                            zIndex: 1,
                                                        }}
                                                        onPress={() => ctrl.expandAndRead(scheduleItem.id)}
                                                    >
                                                        <div className="flex flex-row items-center justify-between mb-1">
                                                            <span className="text-text-primary font-medium text-sm flex-1 truncate">
                                                                {scheduleItem.state.name}
                                                            </span>
                                                            <div className="flex flex-row items-center gap-1 ml-2 shrink-0">
                                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                                    <path d="M6 1.5C3.515 1.5 1.5 3.515 1.5 6S3.515 10.5 6 10.5 10.5 8.485 10.5 6 8.485 1.5 6 1.5z" stroke="currentColor" strokeWidth="1" />
                                                                    <path d="M6 3.5v2.75l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                                                                </svg>
                                                                <span className="text-text-secondary text-xs truncate max-w-20">
                                                                    {scheduleItem.state.location}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            maxHeight: isExpanded ? (state.expandedCardHeightMap[scheduleItem.id] ?? 500) : cardHeight,
                                                            overflow: 'hidden',
                                                            transition: 'max-height 0.3s ease-in-out',
                                                        }}>
                                                            <span className="text-text-secondary/80 text-xs block mb-1">
                                                                {scheduleItem.state.status}
                                                            </span>
                                                            <p className={`text-text-secondary/40 text-xs leading-5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                                {scheduleItem.state.detail}
                                                            </p>
                                                        </div>
                                                    </Pressable>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Current time line */}
                            {state.isDisplayDateToday && (
                                <div
                                    className="absolute left-12 right-0 flex flex-row items-center pointer-events-none"
                                    style={{ top: ctrl.getScrollOffset(state.currentDatetime), zIndex: 2000 }}
                                >
                                    <div className="w-3 h-3 rounded-full bg-accent shrink-0 -ml-1.5" />
                                    <div className="flex-1 h-0.5 bg-accent" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </RenderParentProvider>
    );
});
