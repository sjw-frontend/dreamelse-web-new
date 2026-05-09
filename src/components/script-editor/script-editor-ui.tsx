// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { ScriptEditorController } from './script-editor-controller';

type Props = {
    data: any;
    writable: boolean;
};

export const ScriptEditor = optimize(({ data, writable }: Props) => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        ScriptEditorController,
        { data },
    );

    const reactiveState = useReactive(() => ({
        title: ctrl.state.data?.state.title ?? '',
        desc: ctrl.state.data?.state.storyDesc ?? '',
        roles: ctrl.state.data?.state.roles ?? [],
        kinds: ctrl.state.data?.state.kinds ?? [],
        kindList: ctrl.state.defaultConfig?.kindList ?? [],
        allowSubmit: ctrl.state.allowSubmit,
        needSave: ctrl.state.needSave,
    }), { deep: true });

    const [titleLen, setTitleLen] = useState(0);
    const [descLen, setDescLen] = useState(0);

    useEffect(() => {
        setTitleLen(reactiveState.title?.length ?? 0);
    }, [reactiveState.title]);

    useEffect(() => {
        setDescLen(reactiveState.desc?.length ?? 0);
    }, [reactiveState.desc]);

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
            <div style={{ overflowY: 'auto', padding: '16px 16px 120px' }}>

                {/* 标题 */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>剧本标题</span>
                        <span style={{ fontSize: 12, color: titleLen > 50 ? '#ff4444' : 'rgba(255,255,255,0.3)' }}>
                            {titleLen}/50
                        </span>
                    </div>
                    <input
                        style={inputStyle}
                        maxLength={50}
                        defaultValue={reactiveState.title}
                        placeholder="请输入剧本标题"
                        disabled={!writable}
                        onChange={e => {
                            setTitleLen(e.target.value.length);
                            ctrl.updateTitle?.(e.target.value);
                        }}
                    />
                </div>

                {/* 描述 */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>剧本描述</span>
                        <span style={{ fontSize: 12, color: descLen > 200 ? '#ff4444' : 'rgba(255,255,255,0.3)' }}>
                            {descLen}/200
                        </span>
                    </div>
                    <textarea
                        style={{ ...inputStyle, resize: 'none' }}
                        rows={4}
                        maxLength={200}
                        defaultValue={reactiveState.desc}
                        placeholder="请输入剧本描述"
                        disabled={!writable}
                        onChange={e => {
                            setDescLen(e.target.value.length);
                            ctrl.updateDesc?.(e.target.value);
                        }}
                    />
                </div>

                {/* 类型标签 */}
                {reactiveState.kindList.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                            剧本类型
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {reactiveState.kindList.map((kind: any) => {
                                const isSelected = reactiveState.kinds.includes(kind.value ?? kind);
                                return (
                                    <button
                                        key={kind.value ?? kind}
                                        type="button"
                                        disabled={!writable}
                                        onClick={() => ctrl.toggleKind?.(kind.value ?? kind)}
                                        style={{
                                            borderRadius: 20, padding: '6px 14px',
                                            border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                            backgroundColor: isSelected ? 'var(--color-accent, #ABFF1A)' : 'transparent',
                                            color: isSelected ? '#0B1426' : '#EDEDED',
                                            fontSize: 13, cursor: writable ? 'pointer' : 'default',
                                        }}
                                    >
                                        {kind.label ?? kind}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 角色列表 */}
                <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                        角色列表
                    </span>
                    {reactiveState.roles.map((role: any) => (
                        <div key={role.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                overflow: 'hidden', flexShrink: 0,
                            }}>
                                {role.state?.characterInfo?.state?.currentFigure?.visual?.uri && (
                                    <img src={role.state.characterInfo.state.currentFigure.visual.uri}
                                        alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 15, color: '#EDEDED', fontWeight: 600, margin: 0 }}>
                                    {role.state?.characterInfo?.state?.name ?? role.name ?? '未命名角色'}
                                </p>
                                {role.state?.identities?.[0]?.label && (
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
                                        {role.state.identities[0].label}
                                    </p>
                                )}
                            </div>
                            {writable && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={() => ctrl.editRole?.(role.id)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button type="button" onClick={() => ctrl.removeRole?.(role.id)}
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 4 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14H6L5 6" />
                                            <path d="M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {writable && (
                        <button
                            type="button"
                            onClick={() => ctrl.addRole?.()}
                            style={{
                                width: '100%', height: 44, marginTop: 12,
                                borderRadius: 12, border: '1px dashed rgba(255,255,255,0.2)',
                                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                                fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            + 添加角色
                        </button>
                    )}
                </div>

                {/* 提交按钮 */}
                {writable && (
                    <button
                        type="button"
                        disabled={!reactiveState.allowSubmit}
                        onClick={() => ctrl.submit?.()}
                        style={{
                            width: '100%', height: 52, borderRadius: 26,
                            backgroundColor: reactiveState.allowSubmit
                                ? 'var(--color-accent, #ABFF1A)'
                                : 'rgba(255,255,255,0.1)',
                            color: reactiveState.allowSubmit ? '#0B1426' : 'rgba(255,255,255,0.3)',
                            fontSize: 16, fontWeight: 600, border: 'none',
                            cursor: reactiveState.allowSubmit ? 'pointer' : 'default',
                        }}
                    >
                        提交剧本
                    </button>
                )}
            </div>
        </RenderParentProvider>
    );
});
