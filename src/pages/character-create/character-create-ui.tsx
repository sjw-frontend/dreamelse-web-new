// @ts-nocheck
import { useCallback } from 'react';
import { useListenEvent, usePopup, useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { withAuth } from '$/hocs';
import type { ReactTypes } from '$/types';
import { AbilityBackground, AbilityFace, CreateForm, PickList } from './@parts';
import { CharacterCreateController } from './character-create-controller';
import { I18nTexts } from './character-create-const';

export const CharacterCreatePage: ReactTypes.FC = withAuth(optimize(() => {
    const popup = usePopup();
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterCreateController);

    const state = useReactive(() => ({
        isCustom: ctrl.state.isCustom,
        isPick: ctrl.state.isPick,
        isCreate: ctrl.state.isCreate,
        currentAbility: ctrl.state.currentAbility,
        sumPercent: ctrl.state.sumPercent,
        evaluation: ctrl.state.evaluation,
        previewData: ctrl.state.previewData,
        previewDataWritable: ctrl.state.previewDataWritable,
    }));

    // 对齐 app closeMode 参数：'close'（X 图标）| 'text'（跳过文字）
    const closeMode = ctrl.state.route?.params?.closeMode ?? 'close';

    useListenEvent(ctrl, 'submitFail', msg => {
        popup.openOkDialog({ title: I18nTexts.createFail, content: msg });
    });

    useListenEvent(ctrl, 'generateFail', msg => {
        popup.openOkDialog({ title: I18nTexts.generateFail, content: msg });
    });

    useListenEvent(ctrl, 'submit', task => {
        popup.longTask(task, { content: [] });
    });

    const toCustom = useCallback(() => ctrl.toggleMode('custom'), []);
    const toPick = useCallback(() => ctrl.toggleMode('pick'), []);

    return (
        <RenderParentProvider>
            <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1A1A1A',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {/* 定制模式背景 */}
                {state.isCustom && (
                    <>
                        <AbilityBackground currentAbility={state.currentAbility} />
                        <AbilityFace
                            sumPercent={state.sumPercent}
                            currentAbility={state.currentAbility}
                            evaluation={state.evaluation}
                        />
                    </>
                )}

                {/* Header — 挑选/定制 tab，对齐 app header 布局 */}
                {!state.isCreate && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 4,
                        paddingBottom: 4,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 10,
                    }}>
                        {/* 左侧 tab：挑选 / 创造 */}
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={toPick}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: 30,
                                    fontWeight: !state.isCustom ? 600 : 500,
                                    color: !state.isCustom ? '#EDEDED' : 'rgba(0,0,0,0.3)',
                                }}
                            >
                                {I18nTexts.pick}
                            </button>
                            <button
                                type="button"
                                onClick={toCustom}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: 30,
                                    fontWeight: state.isCustom ? 600 : 500,
                                    color: state.isCustom ? '#EDEDED' : 'rgba(0,0,0,0.3)',
                                }}
                            >
                                {I18nTexts.custom}
                            </button>
                        </div>

                        {/* 右侧按钮区：对齐 app buttonsContainer，绝对定位 right 16 */}
                        <div style={{
                            position: 'absolute',
                            right: 16,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            zIndex: 10,
                        }}>
                            {/* 编辑按钮：对齐 app editButtonContainer + iconEditWhite */}
                            <button
                                type="button"
                                onClick={ctrl.toCreate}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0 12px',
                                    color: '#EDEDED',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>

                            {/* closeMode === 'text'：跳过按钮 */}
                            {closeMode === 'text' && (
                                <button
                                    type="button"
                                    onClick={ctrl.goBack}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#EDEDED', fontSize: 16, padding: 0,
                                    }}
                                >
                                    {I18nTexts.skip}
                                </button>
                            )}

                            {/* closeMode === 'close'：X 图标，对齐 app closeBlack 36×36 */}
                            {closeMode === 'close' && (
                                <button
                                    type="button"
                                    onClick={ctrl.goBack}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, color: '#EDEDED',
                                        width: 36, height: 36,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                        <rect width="36" height="36" rx="18" fill="rgba(255,255,255,0.1)" />
                                        <path d="M13 13l10 10M23 13L13 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* isCreate 模式：对齐 app 渲染 CharacterEditor，web 暂用预览卡片 */}
                {state.isCreate && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '12px 16px', flexShrink: 0 }}>
                            <button
                                type="button"
                                onClick={ctrl.goBack}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EDEDED', padding: 0 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <span style={{ flex: 1, textAlign: 'center', color: '#EDEDED', fontWeight: 600, fontSize: 18 }}>
                                {state.previewDataWritable ? '创建角色' : '预览角色'}
                            </span>
                            <div style={{ width: 24 }} />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
                            {state.previewData && (
                                <div style={{
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 16,
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 80, height: 80, borderRadius: 16,
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            overflow: 'hidden', flexShrink: 0,
                                        }}>
                                            {state.previewData.state.currentFigure?.visual?.uri ? (
                                                <img
                                                    src={state.previewData.state.currentFigure.visual.uri}
                                                    alt="avatar"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                                        <circle cx="16" cy="12" r="5" />
                                                        <path d="M5 27c0-6.075 4.925-11 11-11s11 4.925 11 11" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{ color: '#EDEDED', fontWeight: 600, fontSize: 18 }}>
                                                {state.previewData.state.name || '未命名角色'}
                                            </span>
                                            {state.previewData.state.honorary ? (
                                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                                                    {state.previewData.state.honorary}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    {state.previewData.state.desc ? (
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                                            {state.previewData.state.desc}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            {!state.previewData && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 16 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                            <circle cx="16" cy="12" r="5" />
                                            <path d="M5 27c0-6.075 4.925-11 11-11s11 4.925 11 11" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>正在准备角色信息...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PickList (pick mode) */}
                <PickList />

                {/* CreateForm (custom mode) */}
                <CreateForm />
            </div>
        </RenderParentProvider>
    );
}));
