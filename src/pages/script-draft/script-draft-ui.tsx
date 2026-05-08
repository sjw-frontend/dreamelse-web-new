// @ts-nocheck
import { useReactive, useRegisterRenderController } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { optimize } from '$/view';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { ScriptDraftController } from './script-draft-controller';

export const ScriptDraftPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(ScriptDraftController);

    const state = useReactive(() => ({
        ids: ctrl.state.ids,
        itemContentWidth: ctrl.state.itemContentWidth ?? 160,
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">

                {/* Header */}
                <div className="relative flex items-center justify-center h-12 px-4 border-b border-white/10 shrink-0">
                    <Pressable
                        onPress={ctrl.goBack}
                        className="absolute left-4 w-9 h-9 flex items-center justify-center text-text-primary"
                        aria-label="返回"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Pressable>
                    <h1 className="text-xl font-semibold text-text-primary">我的草稿</h1>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-3 pt-3">
                    {state.ids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="text-text-secondary text-sm">暂无草稿</span>
                        </div>
                    ) : (
                        <ScriptWaterfall
                            scriptIds={state.ids}
                            itemContentWidth={state.itemContentWidth}
                            isDraft={true}
                            onEndReached={ctrl.loadMore}
                            sceneKey={null}
                        />
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
