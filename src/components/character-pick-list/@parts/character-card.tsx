// @ts-nocheck
import { useMemo } from 'react';
import { CharacterController } from '$/controllers';
import { useReactive, useZoneController } from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { FileUtils } from '$/utils';
import { optimize } from '$/view';
import { I18nTexts } from '../character-pick-list-const';

export enum CharacterCardEnum {
    halfRound = 'halfRound',
    rect = 'rect',
}

type Props = LibTypes.FrozenDefine<{
    showOwnerTag?: boolean,
    showScriptTag?: boolean,
    cardType?: CharacterCardEnum,
    id: CharacterTypes.CharacterId,
    isSelected: boolean,
    onPress: LibTypes.SimpleFunction,
}>;

// Exact port of app's LockAreaImage calculateImageStyle
const calculateImageStyle = (
    viewWidth: number,
    viewHeight: number,
    imageWidth: number,
    imageHeight: number,
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

    return {
        width: imageWidth * scale,
        height: imageHeight * scale,
        left: finalLeft,
        top: finalTop,
    };
};

const CARD_W = 114;
const CARD_H = 160;

// selected 态下图片区缩小尺寸（对齐 app characterImageSelect: 96×142）
const SELECTED_IMG_W = 96;
const SELECTED_IMG_H = 142;

export const CharacterCard: ReactTypes.FC<Props> = optimize(({
    showOwnerTag,
    showScriptTag,
    cardType = CharacterCardEnum.rect,
    id,
    isSelected,
    onPress,
}) => {
    const characterCtrl = useZoneController(CharacterController);

    const reactiveState = useReactive(() => {
        const data = characterCtrl.getCharacter(id);
        return { data, dataState: data && { ...data.state } };
    }, [id]);

    const { name, honorary, currentFigure, isOwner, fromScript, figureBackground, imgStyle, selectedImgStyle } = useMemo(() => {
        const bg = reactiveState.dataState?.currentFigureSkin?.backgroundColor ?? '#e27a7f';
        const fig = reactiveState.dataState?.currentFigure ?? null;
        const owner = Boolean(reactiveState.data?.state.isOwner);
        const script = Boolean(reactiveState.data?.attrs?.fromScript);

        let style = null;
        let selStyle = null;
        if (fig) {
            const faceInfo = FileUtils.getImageFaceInfo(fig.visual, { top: 0.2625, left: 0.2895, right: 0.2895 });
            const imgW = fig.visual.width ?? 1080;
            const imgH = fig.visual.height ?? 1920;
            style = calculateImageStyle(
                CARD_W, CARD_H, imgW, imgH,
                faceInfo.face,
                faceInfo.rect.left, faceInfo.rect.right, faceInfo.rect.top, faceInfo.rect.bottom,
            );
            selStyle = calculateImageStyle(
                SELECTED_IMG_W, SELECTED_IMG_H, imgW, imgH,
                faceInfo.face,
                faceInfo.rect.left, faceInfo.rect.right, faceInfo.rect.top, faceInfo.rect.bottom,
            );
        }

        return {
            name: reactiveState.dataState?.name ?? '',
            honorary: reactiveState.dataState?.honorary ?? '',
            currentFigure: fig,
            isOwner: owner,
            fromScript: script,
            figureBackground: bg,
            imgStyle: style,
            selectedImgStyle: selStyle,
        };
    }, [reactiveState.data, reactiveState.dataState]);

    // halfRound 选中态：整体 opacity 0.3（对齐 app roundCharacterImageContainerSelected）
    const isHalfRound = cardType === CharacterCardEnum.halfRound;
    const containerOpacity = isHalfRound && isSelected ? 0.3 : 1;

    // rect 选中态：图片区加 padding + border，图片缩小
    const imageContainerStyle: React.CSSProperties = isSelected && !isHalfRound
        ? {
            width: CARD_W,
            height: CARD_H,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
            background: 'none',
            border: '3px solid #fff',
            padding: 7,
            boxSizing: 'border-box',
            cursor: 'pointer',
            flexShrink: 0,
        }
        : {
            width: CARD_W,
            height: CARD_H,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
            background: 'none',
            border: '3px solid transparent',
            cursor: 'pointer',
            flexShrink: 0,
        };

    const activeImgStyle = isSelected && !isHalfRound ? selectedImgStyle : imgStyle;
    const innerImgContainerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    };

    return (
        // 外层容器：宽度固定 114，marginBottom 16（对齐 app characterCard）
        <div style={{ width: CARD_W, marginBottom: 16, opacity: containerOpacity }}>
            {/* 图片区：button 只负责图片，不含文字 */}
            <button
                type="button"
                onClick={onPress}
                style={imageContainerStyle}
            >
                <div style={innerImgContainerStyle}>
                    {/* 背景色层：对齐 app rectImageBackgroundContainer / roundImageBackgroundContainer */}
                    {isHalfRound ? (
                        // halfRound：只有底部半圆背景
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: 130,
                            backgroundColor: figureBackground,
                            borderTopLeftRadius: 57,
                            borderTopRightRadius: 57,
                        }} />
                    ) : (
                        // rect：全覆盖背景
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: figureBackground,
                        }} />
                    )}

                    {/* 角色图片：有 face 数据用精确定位，否则降级为 contain 居中（对齐 app LockAreaImage 兜底行为） */}
                    {currentFigure ? (
                        activeImgStyle ? (
                            <img
                                src={currentFigure.visual.uri}
                                alt={name}
                                style={{
                                    position: 'absolute',
                                    width: activeImgStyle.width,
                                    height: activeImgStyle.height,
                                    left: activeImgStyle.left,
                                    top: activeImgStyle.top,
                                    objectFit: 'contain',
                                    maxWidth: 'none',
                                }}
                            />
                        ) : (
                            <img
                                src={currentFigure.visual.uri}
                                alt={name}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'center top',
                                }}
                            />
                        )
                    ) : null}

                    {/* 标签：左上角，对齐 app tag 样式 */}
                    <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}>
                        {isOwner && showOwnerTag && (
                            <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.4)',
                                backgroundColor: '#1A1A1A',
                                borderBottomRightRadius: 12,
                                width: 36,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingLeft: 2,
                            }}>
                                {I18nTexts.ownerTag}
                            </span>
                        )}
                        {fromScript && showScriptTag && (
                            <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#fff',
                                backgroundColor: '#0d0d0d',
                                borderBottomRightRadius: 12,
                                width: 36,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {I18nTexts.scriptTag}
                            </span>
                        )}
                    </div>

                    {/* checkmark：右上角，对齐 app checkMarkContainer（36×36，bgPage 背景） */}
                    {isSelected && (
                        <div style={{
                            position: 'absolute',
                            top: 10,
                            right: 0,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#0d0d0d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                        }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10l4.5 4.5 7.5-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </div>
            </button>

            {/* 文字区：在卡片外部下方，对齐 app characterInfo */}
            <div style={{ marginTop: 4, textAlign: 'center' }}>
                <div style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: isHalfRound && isSelected ? 0.3 : 1,
                }}>
                    {name}
                </div>
                {honorary ? (
                    <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.4)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: 2,
                        opacity: isHalfRound && isSelected ? 0.3 : 1,
                    }}>
                        {honorary}
                    </div>
                ) : null}
            </div>
        </div>
    );
});
