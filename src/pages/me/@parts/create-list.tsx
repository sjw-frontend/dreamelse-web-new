// @ts-nocheck
import { useCallback } from 'react';
import { useReactive, useZoneController } from '$/hooks';
import { useWaterfallContentWidth } from '$/pages/home/@com';
import { ScriptWaterfall } from '$/components/script-waterfall/script-waterfall-ui';
import { UserController } from '$/controllers';
import { optimize } from '$/view';
import type { MeController } from '../me-controller';

export const CreateList = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const itemContentWidth = useWaterfallContentWidth();
    const userCtrl = useZoneController(UserController);

    const state = useReactive(() => ({
        ids: ctrl.state.createScript.ids as readonly string[],
        draftCount: userCtrl.state.loggedInUser?.scriptDetails.state.draftCount ?? 0,
    }));

    const handleCreateStory = useCallback(() => ctrl.toCreateStory(), [ctrl]);
    const handleDraftBox = useCallback(() => ctrl.toDraftBox(), [ctrl]);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '10px 8px 0 8px', overflow: 'hidden' }}>
            {/* 按钮区域 */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                {/* 创作故事 */}
                <button
                    type="button"
                    onClick={handleCreateStory}
                    style={{
                        flex: 1,
                        height: 72,
                        backgroundColor: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 20,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        cursor: 'pointer',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>创作故事</span>
                </button>

                {/* 草稿箱 */}
                <button
                    type="button"
                    onClick={handleDraftBox}
                    style={{
                        flex: 1,
                        height: 72,
                        backgroundColor: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 20,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>草稿箱</span>
                    {state.draftCount > 0 && (
                        <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                            {state.draftCount}
                        </span>
                    )}
                </button>
            </div>

            {/* 创作列表 */}
            <ScriptWaterfall
                scriptIds={state.ids}
                itemContentWidth={itemContentWidth}
                onEndReached={ctrl.requestCreateList}
                sceneKey="me-create"
                isDraft={false}
                bottomRightButton="more"
            />
        </div>
    );
});
