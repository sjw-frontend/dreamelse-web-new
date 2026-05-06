import { useReactive, useRegisterRenderController } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { optimize } from '$/view';
import { ScriptEditController } from './script-edit-controller';

export const ScriptEditPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(ScriptEditController);

    const state = useReactive(() => ({
        data: ctrl.state.data,
        needSave: ctrl.state.needSave,
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card">

                {/* Header */}
                <div className="flex items-center h-12 px-4 border-b border-border-default shrink-0">
                    <Pressable
                        onPress={ctrl.goBack}
                        className="w-9 h-9 flex items-center justify-center text-text-primary hover:text-accent transition-colors"
                        aria-label="返回"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Pressable>

                    <h1 className="flex-1 text-center text-base font-semibold text-text-primary">
                        编辑剧本
                    </h1>

                    {/* Save indicator */}
                    <div className="w-9 h-9 flex items-center justify-center">
                        {state.needSave && (
                            <span className="w-2 h-2 rounded-full bg-accent" title="有未保存的更改" />
                        )}
                    </div>
                </div>

                {/* Editor area */}
                <div className="flex-1 overflow-y-auto">
                    {state.data ? (
                        <div className="max-w-3xl mx-auto px-6 py-8">
                            {/* Draft title */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-text-primary mb-1">
                                    {state.data.state.title ?? '无标题'}
                                </h2>
                                {state.data.state.status != null && (
                                    <span className="text-xs text-text-secondary bg-bg-page px-2 py-0.5 rounded-full">
                                        {state.data.state.status}
                                    </span>
                                )}
                            </div>

                            {/* Content placeholder — actual editor component would be mounted here */}
                            <div className="min-h-[60vh] rounded-xl bg-bg-page border border-border-default p-6">
                                <p className="text-text-secondary text-sm">
                                    剧本编辑器内容区域
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <span className="text-text-secondary text-sm">加载中…</span>
                        </div>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
