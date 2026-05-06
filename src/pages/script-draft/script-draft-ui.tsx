import { useReactive, useRegisterRenderController } from '$/hooks';
import { Pressable, ScrollView, ActivityIndicator } from '$/uis/primitives';
import { optimize } from '$/view';
import { ScriptDraftController } from './script-draft-controller';

export const ScriptDraftPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(ScriptDraftController);

    const state = useReactive(() => ({
        ids: ctrl.state.ids,
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card">

                {/* Header */}
                <div className="relative flex items-center justify-center h-12 px-4 border-b border-border-default shrink-0">
                    <Pressable
                        onPress={ctrl.goBack}
                        className="absolute left-4 w-9 h-9 flex items-center justify-center text-text-primary hover:text-accent transition-colors"
                        aria-label="返回"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Pressable>
                    <h1 className="text-xl font-semibold text-text-primary">我的草稿</h1>
                </div>

                {/* Content */}
                <ScrollView className="flex-1 px-2 pt-2">
                    {state.ids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span className="text-text-secondary text-sm">暂无草稿</span>
                        </div>
                    ) : (
                        <div className="columns-2 gap-2 pb-4">
                            {state.ids.map((id: string) => (
                                <ScriptDraftCard
                                    key={id}
                                    scriptId={id}
                                    onPress={ctrl.onPressScript}
                                />
                            ))}
                        </div>
                    )}

                    {/* Load more trigger */}
                    <div className="flex justify-center py-4">
                        <Pressable
                            onPress={ctrl.requestList}
                            className="text-text-secondary text-sm hover:text-text-primary transition-colors"
                        >
                            加载更多
                        </Pressable>
                    </div>
                </ScrollView>
            </div>
        </RenderParentProvider>
    );
});

// Minimal card — actual script data comes from the store via controller
const ScriptDraftCard = ({
    scriptId,
    onPress,
}: {
    scriptId: string;
    onPress: (info: any) => void;
}) => (
    <div
        className="break-inside-avoid mb-2 rounded-xl bg-bg-page border border-border-default overflow-hidden cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => onPress({ id: scriptId } as any)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onPress({ id: scriptId } as any)}
    >
        {/* Placeholder thumbnail */}
        <div className="w-full aspect-[3/4] bg-white/5 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        </div>
        <div className="p-3">
            <p className="text-text-primary text-sm font-medium truncate">草稿 {scriptId.slice(0, 8)}</p>
            <p className="text-text-secondary text-xs mt-0.5">草稿</p>
        </div>
    </div>
);
