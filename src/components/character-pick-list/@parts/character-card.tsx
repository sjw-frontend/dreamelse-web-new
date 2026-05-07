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

export const CharacterCard: ReactTypes.FC<Props> = optimize(({
    showOwnerTag,
    showScriptTag,
    id,
    isSelected,
    onPress,
}) => {
    const characterCtrl = useZoneController(CharacterController);

    const reactiveState = useReactive(() => {
        const data = characterCtrl.getCharacter(id);
        return { data, dataState: data && { ...data.state } };
    }, [id]);

    const { name, honorary, currentFigure, isOwner, fromScript, figureBackground, imgStyle } = useMemo(() => {
        const bg = reactiveState.dataState?.currentFigureSkin?.backgroundColor ?? '#e27a7f';
        const fig = reactiveState.dataState?.currentFigure ?? null;
        const owner = Boolean(reactiveState.data?.state.isOwner);
        const script = Boolean(reactiveState.data?.attrs?.fromScript);

        let style = null;
        if (fig) {
            const faceInfo = FileUtils.getImageFaceInfo(fig.visual, { top: 0.25, left: 0.29, right: 0.29 });
            const imgW = fig.visual.width ?? 1080;
            const imgH = fig.visual.height ?? 1920;
            style = calculateImageStyle(
                CARD_W, CARD_H, imgW, imgH,
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
        };
    }, [reactiveState.data, reactiveState.dataState]);

    return (
        <button
            type="button"
            onClick={onPress}
            style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: figureBackground,
                border: isSelected ? '2px solid #fff' : '2px solid transparent',
                padding: isSelected ? 4 : 0,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* image */}
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 16 }}>
                {currentFigure && imgStyle ? (
                    <img
                        src={currentFigure.visual.uri}
                        alt={name}
                        style={{
                            position: 'absolute',
                            width: imgStyle.width,
                            height: imgStyle.height,
                            left: imgStyle.left,
                            top: imgStyle.top,
                            objectFit: 'contain',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                    </div>
                )}

                {/* tags */}
                <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4 }}>
                    {isOwner && showOwnerTag && (
                        <span style={{
                            fontSize: 10, fontWeight: 600, color: '#fff',
                            backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
                            padding: '2px 6px',
                        }}>
                            {I18nTexts.ownerTag}
                        </span>
                    )}
                    {fromScript && showScriptTag && (
                        <span style={{
                            fontSize: 10, fontWeight: 600, color: '#fff',
                            backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
                            padding: '2px 6px',
                        }}>
                            {I18nTexts.scriptTag}
                        </span>
                    )}
                </div>

                {/* checkmark */}
                {isSelected && (
                    <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>

            {/* name */}
            <div style={{
                padding: '4px 6px 6px',
                backgroundColor: 'rgba(0,0,0,0.4)',
            }}>
                <div style={{
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textAlign: 'center',
                }}>
                    {name}
                </div>
                {honorary ? (
                    <div style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.5)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textAlign: 'center', marginTop: 1,
                    }}>
                        {honorary}
                    </div>
                ) : null}
            </div>
        </button>
    );
});
