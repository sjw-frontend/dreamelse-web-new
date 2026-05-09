// @ts-nocheck
import { useCallback, useEffect, useMemo } from 'react';
import { DramatizeEngineController } from '$/component-controllers';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { ScriptController } from '$/controllers';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { DramatizeEngine } from '$/components/dramatize-engine/dramatize-engine-ui';
import { DramatizeLoading } from '$/components/dramatize-loading/dramatize-loading-ui';
import { DramatizePanel } from '$/components/dramatize-panel/dramatize-panel-ui';
import { PlayScriptHistoryController } from './play-script-history-controller';

export const PlayScriptHistoryPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PlayScriptHistoryController);
    const [engineCtrl, EngineProvider] = useRegisterRenderController(DramatizeEngineController);

    useEffect(() => {
        ctrl.setRelatedControllers({ dramatizeEngineCtrl: engineCtrl });
    }, []);

    const state = useReactive(() => ({
        title: ctrl.state.title,
        playId: ctrl.state.playId,
        showLoading: ctrl.state.showLoading,
        showLottie: ctrl.state.showLottie,
        showLoadingRoles: ctrl.state.showLoadingRoles,
        totalChapterCount: ctrl.state.totalChapterCount,
        isChapterDisplay: ctrl.state.isChapterDisplay,
        chapterId: ctrl.state.chapterId,
        progressCurrentValue: ctrl.state.progressCurrentValue,
        progressInteractions: ctrl.state.progressInteractions,
        progressMax: ctrl.state.progressMax,
        showChapterList: ctrl.state.showChapterList,
        speed: ctrl.state.speed,
        storyDesc: ctrl.state.storyDesc,
        roles: ctrl.state.roles,
    }));

    const scriptCtrl = useZoneController(ScriptController);
    const loadingTextList = useReactive(() => ({
        list: scriptCtrl.state.waitNarrativeLoadingTextList,
    })).list;

    const roles = useMemo(
        () => state.roles?.map((item: any) => ({
            name: item.state.characterInfo?.state.name ?? '',
            avatarUri: item.state.characterInfo?.state.currentFigure?.visual?.uri ?? null,
            title: item.state.identities[0]?.label ?? '',
            description: item.state.backgroundDesc ?? '',
            secret: item.state.secret ?? '',
        })),
        [state.roles],
    );

    const progressPercent =
        state.progressMax > 0
            ? Math.round((state.progressCurrentValue / state.progressMax) * 100)
            : 0;

    const updateProgress = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const value = Math.round(ratio * state.progressMax);
        ctrl.onSetProgressValue(value);
    }, [state.progressMax]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        updateProgress(e);
    }, [updateProgress]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return;
        updateProgress(e);
    }, [updateProgress]);

    return (
        <RenderParentProvider>
            <EngineProvider>
                <div className="relative w-full h-full bg-black overflow-hidden">

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

                    {/* DramatizeEngine */}
                    <DramatizeEngine />

                    {/* DramatizeLoading */}
                    <DramatizeLoading
                        show={state.showLoading}
                        kind={state.showLoadingRoles ? 'roles' : 'default'}
                        showLottie={state.showLottie}
                        storyDesc={state.storyDesc}
                        roles={roles}
                        loadingTextList={loadingTextList}
                    />

                    {/* 底部进度条 */}
                    {state.playId != null && (
                        <div className="absolute bottom-24 left-0 right-0 z-20 px-4 flex items-center gap-2">
                            <span className="text-xs text-white/50 w-8 text-right shrink-0">
                                {state.progressCurrentValue}
                            </span>
                            <div
                                className="relative flex-1 h-3 flex items-center cursor-pointer"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                            >
                                <div className="absolute inset-y-0 flex items-center w-full">
                                    <div className="w-full h-1 bg-white/20 rounded-full relative">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-white rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                        {state.progressInteractions?.map((pt: { id: string; value: number }) => (
                                            <div
                                                key={pt.id}
                                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent"
                                                style={{
                                                    left: `${state.progressMax > 0 ? (pt.value / state.progressMax) * 100 : 0}%`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-white/50 w-8 shrink-0">
                                {state.progressMax}
                            </span>
                        </div>
                    )}

                    {/* DramatizePanel */}
                    {state.playId != null && (
                        <DramatizePanel
                            playId={state.playId}
                            speedEnabled
                            speed={state.speed}
                            chapterEnabled={state.isChapterDisplay}
                            reviewEnabled
                            showChapterList={state.showChapterList}
                            totalChapterCount={state.totalChapterCount}
                            selectedChapterId={state.chapterId}
                            onToggleListShow={ctrl.toggleChapterListShow}
                            onChangeSpeed={ctrl.onChangeSpeed}
                            onSelectChapter={ctrl.selectChapter}
                            onChapterListChange={ctrl.setChapterList}
                            onRestart={ctrl.restartChapter}
                        />
                    )}
                </div>
            </EngineProvider>
        </RenderParentProvider>
    );
});
