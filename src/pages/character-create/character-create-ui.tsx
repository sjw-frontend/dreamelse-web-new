// @ts-nocheck
import { useCallback } from 'react';
import { useListenEvent, usePopup, useReactive, useRegisterRenderController, useRenderControllerEffectWithCondition } from '$/hooks';
import { optimize } from '$/view';
import { withAuth } from '$/hocs';
import type { ReactTypes } from '$/types';
import { CharacterEditor } from '$/components/character-editor/character-editor-ui';
import { CharacterEditorController } from '$/components/character-editor/character-editor-controller';
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
        previewDataAllowGenerateFigure: ctrl.state.previewDataAllowGenerateFigure,
    }));

    // 对齐 app closeMode 参数：'close'（X 图标）| 'text'（跳过文字）
    const closeMode = ctrl.state.route?.params?.closeMode ?? 'close';

    // 对齐 app useRenderControllerEffectWithCondition
    const characterEditorElement = useRenderControllerEffectWithCondition(
        ctrl,
        state.isCreate,
        <CharacterEditor
            data={state.previewData}
            writable={state.previewDataWritable}
            allowGenerateFigure={state.previewDataAllowGenerateFigure}
        />,
        CharacterEditorController,
        characterEditorCtrl => {
            characterEditorCtrl && ctrl.setRelatedControllers({ characterEditorCtrl });
        },
    );

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

                {/* isCreate 模式：对齐 app 渲染 CharacterEditor */}
                {characterEditorElement}

                {/* PickList (pick mode) */}
                <PickList />

                {/* CreateForm (custom mode) */}
                <CreateForm />
            </div>
        </RenderParentProvider>
    );
}));
