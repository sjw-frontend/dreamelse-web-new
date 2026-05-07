// @ts-nocheck
import { useCallback, useMemo, useRef } from 'react';
import {
    usePopup,
    useReactive,
    useRegisterRenderController,
    useWatch,
} from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { FileUtils, FormatUtils, StringUtils } from '$/utils';
import { optimize } from '$/view';
import { CharacterMomentCardController } from './character-moment-card-controller';

// Exact port of app's LockAreaImage calculateImageStyle
const calculateImageStyle = (
    viewWidth: number, viewHeight: number,
    imageWidth: number, imageHeight: number,
    headRect: { leftTop: { x: number; y: number }; rightBottom: { x: number; y: number } },
    pL?: number, pR?: number, pT?: number, pB?: number,
) => {
    const headW = headRect.rightBottom.x - headRect.leftTop.x;
    const headH = headRect.rightBottom.y - headRect.leftTop.y;
    if (headW <= 0 || headH <= 0) return null;

    let scale: number;
    if (pL !== undefined && pR !== undefined) scale = (viewWidth * (1 - pL - pR)) / headW;
    else if (pT !== undefined && pB !== undefined) scale = (viewHeight * (1 - pT - pB)) / headH;
    else if (pL !== undefined || pR !== undefined) scale = (viewWidth * 0.4) / headW;
    else if (pT !== undefined || pB !== undefined) scale = (viewHeight * 0.4) / headH;
    else return null;
    if (scale <= 0) return null;

    const scaledHeadW = headW * scale;
    const scaledHeadH = headH * scale;
    let finalLeft: number;
    let finalTop: number;

    if (pL !== undefined && pR !== undefined) finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    else if (pL !== undefined) finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    else if (pR !== undefined) finalLeft = viewWidth * (1 - pR) - headRect.rightBottom.x * scale;
    else finalLeft = (viewWidth - scaledHeadW) / 2 - headRect.leftTop.x * scale;

    if (pT !== undefined && pB !== undefined) finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    else if (pT !== undefined) finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    else if (pB !== undefined) finalTop = viewHeight * (1 - pB) - headRect.rightBottom.y * scale;
    else finalTop = (viewHeight - scaledHeadH) / 2 - headRect.leftTop.y * scale;

    return { width: imageWidth * scale, height: imageHeight * scale, left: finalLeft, top: finalTop };
};

type Props = LibTypes.FrozenDefine<{
    id: CharacterTypes.CharacterId,
    isShowDeleteMenu: boolean,
    onShowDeleteMenu: LibTypes.Func<void, [id: string]>,
    onHideDeleteMenu: LibTypes.Func<void, [id: string]>,
}>;

export const CharacterMomentCard: ReactTypes.FC<Props> = optimize(({
    id, isShowDeleteMenu, onShowDeleteMenu, onHideDeleteMenu,
}) => {
    const popup = usePopup();

    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        CharacterMomentCardController,
        { id },
    );

    const reactiveState = useReactive(() => ({
        dataState: ctrl.state.data && { ...ctrl.state.data.state },
        showLongPressMenu: ctrl.state.showLongPressMenu,
    }));

    const avatar = reactiveState.dataState?.behavior.currentFigureVisual;

    const avatarImgStyle = useMemo(() => {
        if (!avatar) return null;
        const faceInfo = FileUtils.getImageFaceInfo(avatar, { left: 0.25, right: 0.25, top: 0.25 });
        return calculateImageStyle(
            48, 48,
            avatar.width ?? 1080, avatar.height ?? 1920,
            faceInfo.face,
            faceInfo.rect.left, faceInfo.rect.right, faceInfo.rect.top, faceInfo.rect.bottom,
        );
    }, [avatar]);

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseDown = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            onShowDeleteMenu(id);
        }, 500);
    }, [id, onShowDeleteMenu]);

    const handleMouseUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleDelete = useCallback(async () => {
        const confirmed = await popup.openDialogConfirm({
            title: '要和Ta解除关系吗？',
            content: '解除后，将删除与Ta相关所有记录且不可找回',
            okButton: '保留关系',
            cancelButton: '狠心断绝',
        });
        if (confirmed) {
            ctrl.closeLongPressMenu();
        } else {
            await ctrl.handleDislike();
            popup.showToast('已解除');
        }
    }, []);

    useMemo(() => {
        if (isShowDeleteMenu) ctrl.openLongPressMenu();
        else ctrl.closeLongPressMenu();
    }, [isShowDeleteMenu]);

    useWatch(
        () => ctrl.state.showLongPressMenu,
        showLongPressMenu => {
            if (!showLongPressMenu) onHideDeleteMenu(id);
        },
        [id, onHideDeleteMenu],
    );

    if (!reactiveState.dataState || reactiveState.dataState.isDeleted) return null;

    const { dataState } = reactiveState;
    const behavior = dataState.behavior;
    const currentFigureVisual = behavior.currentFigureVisual;
    const latestMessage = behavior.lastMessage;
    const currentBackgroundImage = behavior.backgroundImage;
    const currentBackgroundColor = behavior.backgroundColor;
    const messageContent = latestMessage?.state.content;
    const messageTimestamp = latestMessage?.state.timestamp;

    const gradientBg = StringUtils.isEmpty(currentBackgroundColor)
        ? 'linear-gradient(to bottom, #1A1A1A, #1A1A1A)'
        : `linear-gradient(to bottom, ${currentBackgroundColor}, #1A1A1A)`;

    return (
        <RenderParentProvider>
            <div style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}>
                <div
                    style={{
                        position: 'relative',
                        height: 260,
                        borderRadius: 30,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    onClick={ctrl.toInteraction}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                >
                    {/* Background */}
                    {currentBackgroundImage ? (
                        <img
                            src={currentBackgroundImage.uri}
                            alt=""
                            style={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: gradientBg,
                        }} />
                    )}

                    {/* Figure */}
                    {currentFigureVisual && (
                        <div style={{
                            position: 'absolute', top: -8, bottom: 0, left: 0, right: 0,
                            overflow: 'hidden',
                        }}>
                            <img
                                src={currentFigureVisual.uri}
                                alt=""
                                style={{
                                    width: '100%',
                                    aspectRatio: '9/16',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                    )}

                    {/* Status bubble — top right */}
                    {!StringUtils.isEmpty(behavior.status) && (
                        <div style={{
                            position: 'absolute', top: 16, right: 16, zIndex: 1,
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 20,
                            padding: '6px 12px',
                        }}>
                            <span style={{ fontSize: 12, color: '#EDEDED' }}>{behavior.status}</span>
                        </div>
                    )}

                    {/* Location — top left */}
                    {!StringUtils.isEmpty(behavior.location) && (
                        <div style={{
                            position: 'absolute', top: 18, left: 18, zIndex: 1,
                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5c0 2.625 3.5 6.5 3.5 6.5s3.5-3.875 3.5-6.5C9.5 2.567 7.933 1 6 1z" fill="#EDEDED" />
                            </svg>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#EDEDED' }}>{behavior.location}</span>
                        </div>
                    )}

                    {/* Bottom info bar */}
                    <div style={{
                        position: 'absolute', bottom: 8, left: 16, right: 16,
                        height: 77,
                        backgroundColor: '#1A1A1A',
                        borderRadius: 20,
                        display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                        paddingTop: 14, paddingLeft: 16, paddingRight: 16, paddingBottom: 16,
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 48, height: 48, borderRadius: 24,
                            overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)',
                            flexShrink: 0, position: 'relative',
                        }}>
                            {avatar ? (
                                avatarImgStyle ? (
                                    <img
                                        src={avatar.uri}
                                        alt=""
                                        style={{
                                            position: 'absolute',
                                            width: avatarImgStyle.width,
                                            height: avatarImgStyle.height,
                                            left: avatarImgStyle.left,
                                            top: avatarImgStyle.top,
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <img src={avatar.uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, marginLeft: 8, position: 'relative', height: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: 18, fontWeight: 600,
                                    color: 'rgba(0,0,0,0.9)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    maxWidth: 160,
                                }}>
                                    {dataState.name}
                                </span>
                                {!StringUtils.isEmpty(dataState.relation?.title) && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 600, color: '#EDEDED',
                                        border: '1px solid #EDEDED', borderRadius: 100,
                                        padding: '2px 6px', flexShrink: 0,
                                    }}>
                                        {dataState.relation?.title}
                                    </span>
                                )}
                            </div>

                            {!StringUtils.isEmpty(messageContent) && (
                                <div style={{
                                    fontSize: 16, color: 'rgba(0,0,0,0.9)',
                                    marginTop: 4,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    maxWidth: 227,
                                }}>
                                    {messageContent}
                                </div>
                            )}

                            {messageTimestamp && (
                                <span style={{
                                    fontSize: 12, color: 'rgba(0,0,0,0.6)',
                                    position: 'absolute', right: 0, top: 0,
                                }}>
                                    {FormatUtils.formatTime(messageTimestamp)}
                                </span>
                            )}

                            {behavior.newMessageCount > 0 && (
                                <div style={{
                                    backgroundColor: 'red', borderRadius: 20,
                                    minWidth: 16, height: 16, padding: '0 6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'absolute', right: 0, bottom: 3,
                                }}>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>
                                        {behavior.newMessageCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Long press overlay */}
                    {reactiveState.showLongPressMenu && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            borderRadius: 30,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10,
                        }}>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 16,
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 200 }}>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handleDelete(); }}
                                        style={{
                                            width: '100%', height: 48,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            borderRadius: 30, border: 'none', cursor: 'pointer',
                                            fontSize: 16, color: '#EDEDED', fontWeight: 500,
                                        }}
                                    >
                                        解除关系
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); ctrl.closeLongPressMenu(); }}
                                        style={{
                                            width: '100%', height: 45,
                                            backgroundColor: 'transparent',
                                            borderRadius: 30, border: 'none', cursor: 'pointer',
                                            fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 500,
                                        }}
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
