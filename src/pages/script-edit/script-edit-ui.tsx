// @ts-nocheck
import { useCallback, useEffect } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { usePopup } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { optimize } from '$/view';
import { ScriptEditor } from '$/components/script-editor/script-editor-ui';
import { ScriptEditController } from './script-edit-controller';

export const ScriptEditPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(ScriptEditController);
    const popup = usePopup();

    const state = useReactive(() => ({
        data: ctrl.state.data,
        needSave: ctrl.state.needSave,
    }));

    // 离开前确认
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (state.needSave) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [state.needSave]);

    const handleBack = useCallback(async () => {
        if (state.needSave) {
            const confirmed = await popup.openDialogConfirm({
                title: '有未保存的内容',
                content: '离开后修改将丢失，是否保存？',
                buttons: [
                    { text: '保存并退出', onPress: async (i) => { await ctrl.save?.(); ctrl.goBack(); } },
                    { text: '不保存', kind: 'Danger', onPress: () => ctrl.goBack() },
                    { text: '取消' },
                ],
                buttonGroupKind: 'column',
            });
        } else {
            ctrl.goBack();
        }
    }, [state.needSave, popup, ctrl]);

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">

                {/* Header */}
                <div className="flex items-center h-12 px-4 border-b border-white/10 shrink-0">
                    <Pressable
                        onPress={handleBack}
                        className="w-9 h-9 flex items-center justify-center text-text-primary"
                        aria-label="返回"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </Pressable>

                    <h1 className="flex-1 text-center text-base font-semibold text-text-primary">
                        编辑剧本
                    </h1>

                    <div className="w-9 h-9 flex items-center justify-center">
                        {state.needSave && (
                            <span className="w-2 h-2 rounded-full bg-accent" title="有未保存的更改" />
                        )}
                    </div>
                </div>

                {/* ScriptEditor */}
                <div className="flex-1 overflow-hidden">
                    {state.data ? (
                        <ScriptEditor data={state.data} writable={true} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-text-secondary text-sm">加载中…</span>
                        </div>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
