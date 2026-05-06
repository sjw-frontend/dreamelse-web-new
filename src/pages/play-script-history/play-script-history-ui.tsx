import { useReactive, useRegisterRenderController } from '$/hooks';
import { ActivityIndicator } from '$/uis/primitives';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { PlayScriptHistoryController } from './play-script-history-controller';

export const PlayScriptHistoryPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptHistoryController);

    const state = useReactive(() => ({
        title: ctrl.state.title,
        playId: ctrl.state.playId,
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
        totalChapterCount: ctrl.state.totalChapterCount,
        isChapterDisplay: ctrl.state.isChapterDisplay,
        chapterId: ctrl.state.chapterId,
        progressCurrentValue: ctrl.state.progressCurrentValue,
        progressInteractions: ctrl.state.progressInteractions,
        progressMax: ctrl.state.progressMax,
        showChapterList: ctrl.state.showChapterList,
        speed: ctrl.state.speed,
        isInteractionShow: ctrl.state.isInteractionShow,
    }));

    const speedLabel =
        state.speed === 1.5 ? '1.5x'
        : state.speed === 2 ? '2x'
        : state.speed === 0.75 ? '0.75x'
        : '1x';

    const progressPercent =
        state.progressMax > 0
            ? Math.round((state.progressCurrentValue / state.progressMax) * 100)
            : 0;

    return (
        <RenderParentProvider>
            <div className="relative w-full h-full bg-bg-page overflow-hidden">

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center gap-3">
                    <h1 className="flex-1 text-xl font-bold text-white truncate">
                        {state.title}
                    </h1>
                    <button
                        type="button"
                        onClick={ctrl.handleBack}
                        className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
                        aria-label="关闭"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Engine placeholder */}
                <div className="absolute inset-0 bg-bg-page flex items-center justify-center">
                    {state.showLottie && (
                        <div className="flex flex-col items-center gap-4">
                            <ActivityIndicator size="large" color="#ABFF1A" />
                        </div>
                    )}
                </div>

                {/* Loading overlay */}
                {state.showLoading && !state.showLottie && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                        <ActivityIndicator size="large" color="#ABFF1A" />
                    </div>
                )}

                {/* Bottom controls */}
                {state.playId != null && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-2 pb-6">
                        {/* Progress bar */}
                        <div className="px-3 flex items-center gap-2">
                            <span className="text-xs text-white/50 w-8 text-right shrink-0">
                                {state.progressCurrentValue}
                            </span>
                            <div className="relative flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-200"
                                    style={{ width: `${progressPercent}%` }}
                                />
                                {/* Interaction markers */}
                                {state.progressInteractions.map((pt: { id: string; value: number }) => (
                                    <div
                                        key={pt.id}
                                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent"
                                        style={{
                                            left: `${state.progressMax > 0 ? (pt.value / state.progressMax) * 100 : 0}%`,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-white/50 w-8 shrink-0">
                                {state.progressMax}
                            </span>
                        </div>

                        {/* Chapter nav + speed */}
                        <div
                            className={cn(
                                'flex items-center justify-between px-4',
                                !state.isChapterDisplay && 'opacity-0 pointer-events-none',
                            )}
                        >
                            <button
                                type="button"
                                onClick={ctrl.toggleChapterListShow}
                                className="h-10 px-4 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/25 transition-colors flex items-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                                第 {state.totalChapterCount} 章
                            </button>

                            <button
                                type="button"
                                onClick={ctrl.onChangeSpeed}
                                className="h-10 px-4 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                            >
                                {speedLabel}
                            </button>
                        </div>
                    </div>
                )}

                {/* Chapter list overlay */}
                {state.showChapterList && (
                    <div
                        className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-end"
                        onClick={ctrl.toggleChapterListShow}
                    >
                        <div
                            className="w-full bg-bg-card rounded-t-2xl p-6 max-h-[60vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-bold text-text-primary">章节列表</span>
                                <button
                                    type="button"
                                    onClick={ctrl.toggleChapterListShow}
                                    className="text-text-secondary hover:text-text-primary"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-text-secondary text-sm">共 {state.totalChapterCount} 章</p>
                        </div>
                    </div>
                )}
            </div>
        </RenderParentProvider>
    );
});
