// @ts-nocheck
import { useCallback } from 'react';
import { useListenEvent, usePopup, useReactive, useRegisterRenderController, useRenderControllerEffectWithCondition } from '$/hooks';
import { optimize } from '$/view';
import { Pressable } from '$/uis/primitives';
import { CharacterEditorController } from '$/component-controllers';
import { CharacterEditor } from '$/components';
import { AbilityBackground, AbilityFace, CreateForm, PickList } from './@parts';
import { CharacterCreateController } from './character-create-controller';
import { I18nTexts } from './character-create-const';

export const CharacterCreatePage = optimize(() => {
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

                {/* Header — 挑选/定制 tab */}
                {!state.isCreate && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingLeft: 24,
                        paddingRight: 16,
                        paddingTop: 16,
                        paddingBottom: 4,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 10,
                    }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={toPick}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: 30, fontWeight: !state.isCustom ? 600 : 500,
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
                                    fontSize: 30, fontWeight: state.isCustom ? 600 : 500,
                                    color: state.isCustom ? '#EDEDED' : 'rgba(0,0,0,0.3)',
                                }}
                            >
                                {I18nTexts.custom}
                            </button>
                        </div>

                        {/* Right buttons */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <button
                                type="button"
                                onClick={ctrl.toCreate}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: 12, color: '#EDEDED',
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={ctrl.goBack}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: 0, color: '#EDEDED',
                                }}
                            >
                                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                    <rect width="36" height="36" rx="18" fill="rgba(255,255,255,0.1)" />
                                    <path d="M13 13l10 10M23 13L13 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* CharacterEditor (create mode) */}
                {characterEditorElement}

                {/* PickList (pick mode) */}
                <PickList />

                {/* CreateForm (custom mode) */}
                <CreateForm />
            </div>
        </RenderParentProvider>
    );
});
