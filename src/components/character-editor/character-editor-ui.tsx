// @ts-nocheck
import { useCallback, useMemo, useState } from 'react';
import {
    usePopup,
    useReactive,
    useRegisterRenderController,
    useRenderControllerEffect,
} from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { CharacterDesc } from '../character-desc/character-desc-ui';
import { CharacterDigest } from '../character-digest/character-digest-ui';
import { CharacterFiguresPanel } from '../character-figures-panel/character-figures-panel-ui';
import { GenerateImage } from '../generate-image/generate-image-ui';
import { GradientBackground } from '../gradient-background/gradient-background-ui';
import { GenerateImageController } from '../generate-image/generate-image-controller';
import { I18nTexts, Settings } from './character-editor-const';
import { CharacterEditorController } from './character-editor-controller';

type Props = LibTypes.FrozenDefine<{
    data: CharacterTypes.FrozenCharacterInfo | null,
    writable: boolean,
    allowGenerateFigure: boolean,
    fromScript?: boolean,
}>;

export const CharacterEditor: ReactTypes.FC<Props> = optimize(
    ({ data, writable, allowGenerateFigure, fromScript }) => {
        const popup = usePopup();

        const [nameOverlength, setNameOverlength] = useState(false);
        const [honoraryOverlength, setHonoraryOverlength] = useState(false);

        const [ctrl, RenderParentProvider] = useRegisterRenderController(
            CharacterEditorController,
            { data, fromScript },
        );

        const reactiveState = useReactive(() => ({
            data: ctrl.state.data,
            dataState: { ...ctrl.state.data.state },
            writable: ctrl.state.writable,
            allowSubmit: ctrl.state.allowSubmit,
            openGenerateImage: ctrl.state.openGenerateImage,
            showFigures: ctrl.state.showFigures,
        }));

        const [editName, setEditName] = useState<string>(reactiveState.dataState.name ?? '');
        const [editHonoraryText, setEditHonoraryText] = useState<string>(reactiveState.dataState.honorary ?? '');

        const saveNameToControl = useCallback(() => {
            ctrl.setName(editName);
            setNameOverlength(editName.length > Settings.nameMaxLength);
        }, [editName]);

        const saveHonoraryTextToControl = useCallback(() => {
            ctrl.setHonorary(editHonoraryText);
            setHonoraryOverlength(editHonoraryText.length > Settings.honoraryMaxLength);
        }, [editHonoraryText]);

        const generatedImage = useMemo(() =>
            reactiveState.data.isLocal
                ? reactiveState.dataState.defaultFigure?.visual && {
                    image: reactiveState.dataState.defaultFigure.visual,
                    backgroundColor: reactiveState.dataState.defaultFigureSkin?.backgroundColor ?? '',
                }
                : undefined,
        []);

        useRenderControllerEffect(ctrl, GenerateImageController, generateImageCtrl => {
            ctrl.setRelatedControllers({ generateImageCtrl });
        });

        useMemo(() => ctrl.writable(writable), [writable]);

        const handleBack = useCallback(async () => {
            if (!reactiveState.writable) {
                ctrl.back();
            } else if (
                await popup.openDialogConfirm({
                    title: I18nTexts.confirmExitTitle,
                    content: I18nTexts.confirmExitContent,
                    // 对齐 app：okButton 用 Text kind，两个按钮并排文字样式
                    okButton: { text: I18nTexts.confirmExitOkButton, kind: 2 },
                })
            ) {
                ctrl.back();
            }
        }, [reactiveState.writable]);

        const avatarBgColor = reactiveState.dataState.currentFigureSkin?.backgroundColor ?? 'rgba(0,0,0,0)';

        return (
            <RenderParentProvider>
                <div style={{
                    flex: 1,
                    backgroundColor: '#1A1A1A',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflowX: 'clip',
                }}>
                    {/* 头像背景层：绝对定位，全屏，对齐 app avatarContainer */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 0,
                            cursor: allowGenerateFigure ? 'pointer' : 'default',
                        }}
                        onClick={allowGenerateFigure ? ctrl.openGenerateImage : undefined}
                    >
                        <GradientBackground colors={[avatarBgColor, 'rgba(0,0,0,0)']} />
                        {reactiveState.dataState.currentViewFigure?.visual ? (
                            <img
                                key={reactiveState.dataState.currentViewFigure.visual.id}
                                src={reactiveState.dataState.currentViewFigure.visual.uri}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            reactiveState.writable && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                }}>
                                    {/* 对齐 app ASSETS.Logo.add + emptyText */}
                                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                        <circle cx="30" cy="30" r="28" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
                                        <path d="M30 18v24M18 30h24" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                    <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(0,0,0,0.5)' }}>
                                        {I18nTexts.generateImage}
                                    </span>
                                </div>
                            )
                        )}
                    </div>

                    {/* CharacterFiguresPanel：右侧绝对定位，对齐 app figures: right 5, top insets.top+48 */}
                    {reactiveState.showFigures && (
                        <div style={{
                            position: 'absolute',
                            right: 5,
                            top: 48,
                        }}>
                            <CharacterFiguresPanel data={reactiveState.data} />
                        </div>
                    )}

                    {/* 主内容区：对齐 app mainView: marginTop insets.top, flex 1, marginHorizontal 16 */}
                    <div style={{
                        flex: 1,
                        marginLeft: 16,
                        marginRight: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}>
                        {/* 锁定/作者按钮：对齐 app lockButton: absolute right 16 */}
                        <div style={{ position: 'absolute', right: 16, top: 0 }}>
                            {reactiveState.writable ? (
                                <button
                                    type="button"
                                    onClick={ctrl.toggleIsPublic}
                                    style={{
                                        width: 80,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        color: '#EDEDED',
                                        fontSize: 14,
                                        padding: '4px 0',
                                    }}
                                >
                                    {reactiveState.dataState.isPublic ? (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M5 7V4a3 3 0 0 1 5.83-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    <span>{reactiveState.dataState.isPublic ? I18nTexts.public : I18nTexts.private}</span>
                                </button>
                            ) : (
                                <span style={{
                                    fontSize: 16,
                                    color: 'rgba(255,255,255,0.4)',
                                }}>
                                    @{reactiveState.dataState.author?.name}
                                </span>
                            )}
                        </div>

                        {/* 名字输入：对齐 app nameInput fontSize 40, lineHeight 50, fontWeight 600 */}
                        <div style={{ marginTop: 6, marginLeft: 8, alignSelf: 'flex-start' }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onBlur={saveNameToControl}
                                placeholder={I18nTexts.namePlaceholder}
                                readOnly={!reactiveState.writable}
                                maxLength={Settings.nameMaxLength}
                                style={{
                                    fontSize: 40,
                                    lineHeight: '50px',
                                    fontWeight: 600,
                                    color: nameOverlength ? '#ff4444' : '#EDEDED',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: reactiveState.writable ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                    outline: 'none',
                                    minWidth: 167,
                                    maxWidth: 200,
                                    padding: 0,
                                }}
                            />
                        </div>

                        {/* 称号输入：对齐 app honoraryInput fontSize 24, lineHeight 30, fontWeight 500 */}
                        <div style={{ marginLeft: 8, alignSelf: 'flex-start' }}>
                            <input
                                type="text"
                                value={editHonoraryText}
                                onChange={e => setEditHonoraryText(e.target.value)}
                                onBlur={saveHonoraryTextToControl}
                                placeholder={I18nTexts.honoraryPlaceholder}
                                readOnly={!reactiveState.writable}
                                maxLength={Settings.honoraryMaxLength}
                                style={{
                                    fontSize: 24,
                                    lineHeight: '30px',
                                    fontWeight: 500,
                                    color: honoraryOverlength ? '#ff4444' : '#EDEDED',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: reactiveState.writable ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                    outline: 'none',
                                    minWidth: 98,
                                    padding: 0,
                                    textShadow: '0 0 6px #1A1A1A',
                                }}
                            />
                        </div>

                        {/* 点击头像区触发 GenerateImage：对齐 app openGenerateImageView flex 1 */}
                        {/* pointerEvents none 防止拦截弹框点击，点击事件由背景层的头像区承接 */}
                        <div style={{ flex: 1, pointerEvents: 'none' }} />

                        {/* 底部区域：对齐 app bottom */}
                        <div style={{ paddingBottom: 16 }}>
                            {/* CharacterDigest 标签行：对齐 app tagsContainer marginBottom 8 */}
                            <div style={{ marginBottom: 8 }}>
                                <CharacterDigest
                                    data={reactiveState.data}
                                    showArtStyle={false}
                                    showSocialCount={false}
                                    clickable={reactiveState.writable}
                                />
                            </div>

                            {/* CharacterDesc 描述框 */}
                            <CharacterDesc
                                data={reactiveState.data}
                                placeholder={I18nTexts.descPlaceholder}
                                readOnly={!reactiveState.writable}
                            />

                            {/* 按钮组：对齐 app buttonGroup flexDirection row, gap 8, marginTop 16 */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 8,
                                marginTop: 16,
                            }}>
                                {/* 返回按钮：对齐 app backButton width 60, height 60 */}
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 12,
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                        <path d="M22 10l-8 8 8 8" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {/* 确认按钮：对齐 app confirmButton flex 1, height 60 */}
                                <button
                                    type="button"
                                    onClick={ctrl.submit}
                                    disabled={!reactiveState.allowSubmit && !honoraryOverlength && !nameOverlength}
                                    style={{
                                        flex: 1,
                                        height: 60,
                                        borderRadius: 12,
                                        backgroundColor: (reactiveState.allowSubmit || honoraryOverlength || nameOverlength)
                                            ? '#EDEDED' : 'rgba(255,255,255,0.2)',
                                        color: '#000',
                                        fontSize: 18,
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: (reactiveState.allowSubmit || honoraryOverlength || nameOverlength)
                                            ? 'pointer' : 'default',
                                    }}
                                >
                                    {I18nTexts.confirm}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* GenerateImage 覆盖层：对齐 app generateImageView position absolute, full screen */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 20,
                        display: reactiveState.openGenerateImage ? 'flex' : 'none',
                    }}>
                        <GenerateImage
                            characterId={reactiveState.data.isLocal ? null : reactiveState.data.id}
                            generatedImage={generatedImage}
                        />
                    </div>
                </div>
            </RenderParentProvider>
        );
    },
);
