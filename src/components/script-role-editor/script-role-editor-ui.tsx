// @ts-nocheck
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { ScriptRoleEditorController } from './script-role-editor-controller';

type Props = {
    roleType: 'fixed' | 'npc' | 'open' | null;
    initialInfo: any;
    role: any;
    roleList: any[];
    showSupplementBackground?: boolean;
    lockRemoteIdentity?: boolean;
    openRoleNeedCharacter?: boolean;
    onClose?: () => void;
    onConfirm?: (role: any) => void;
    showAdd?: boolean;
};

export const ScriptRoleEditor = optimize(({
    roleType,
    initialInfo,
    role,
    roleList,
    onClose,
    onConfirm,
    showAdd = false,
}: Props) => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        ScriptRoleEditorController,
        { initialInfo, role, roleType, onConfirm, onClose, roleList },
    );

    const reactiveState = useReactive(() => ({
        background: ctrl.state.data?.state.backgroundDesc ?? '',
        identities: ctrl.state.data?.state.identities ?? [],
        secret: ctrl.state.data?.state.secret ?? '',
        characterInfo: ctrl.state.data?.state.characterInfo,
        name: ctrl.state.data?.state.characterInfo?.state.name ?? '',
    }), { deep: true });

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '12px 16px',
        color: '#EDEDED',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
    };

    return (
        <RenderParentProvider>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'var(--color-bg-page, #0B1426)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* 顶部导航 */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 56, padding: '0 16px', flexShrink: 0,
                    borderBottom: '0.5px solid rgba(255,255,255,0.1)',
                }}>
                    <button type="button" onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#EDEDED', cursor: 'pointer', padding: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="3" x2="17" y2="17" /><line x1="17" y1="3" x2="3" y2="17" />
                        </svg>
                    </button>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#EDEDED' }}>
                        {roleType === 'open' ? '开放角色' : roleType === 'npc' ? 'NPC' : '固定角色'}
                    </span>
                    <button type="button" onClick={() => ctrl.confirm?.()}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent, #ABFF1A)', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
                        确认
                    </button>
                </div>

                {/* 内容区 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
                    {/* 角色头像 */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            overflow: 'hidden', cursor: 'pointer',
                        }} onClick={() => ctrl.pickCharacter?.()}>
                            {reactiveState.characterInfo?.state?.currentFigure?.visual?.uri ? (
                                <img src={reactiveState.characterInfo.state.currentFigure.visual.uri}
                                    alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {roleType === 'open' ? (
                        /* 开放角色：名称 + 描述 */
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>角色名称</span>
                                <input style={inputStyle} defaultValue={reactiveState.name}
                                    placeholder="请输入角色名称" maxLength={20}
                                    onChange={e => ctrl.updateName?.(e.target.value)} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>角色描述</span>
                                <textarea style={{ ...inputStyle, resize: 'none' }} rows={4}
                                    defaultValue={reactiveState.background}
                                    placeholder="请输入角色描述" maxLength={200}
                                    onChange={e => ctrl.updateBackground?.(e.target.value)} />
                            </div>
                        </>
                    ) : (
                        /* 固定/NPC 角色：背景 + 秘密 */
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>角色背景</span>
                                <textarea style={{ ...inputStyle, resize: 'none' }} rows={4}
                                    defaultValue={reactiveState.background}
                                    placeholder="请输入角色背景描述" maxLength={500}
                                    onChange={e => ctrl.updateBackground?.(e.target.value)} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>隐藏信息</span>
                                <textarea style={{ ...inputStyle, resize: 'none' }} rows={3}
                                    defaultValue={reactiveState.secret}
                                    placeholder="请输入角色隐藏信息" maxLength={200}
                                    onChange={e => ctrl.updateSecret?.(e.target.value)} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
