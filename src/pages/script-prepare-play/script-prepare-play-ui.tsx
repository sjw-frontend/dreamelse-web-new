import { useCallback, useMemo } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { Image, Pressable, ScrollView } from '$/uis/primitives';
import { Button } from '$/uis/button/button-ui';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import type { ScriptTypes } from '$/types';
import { ScriptRoleEditor } from '$/components/script-role-editor/script-role-editor-ui';
import { I18nTexts } from './script-prepare-play-const';
import { ScriptPreparePlayController } from './script-prepare-play-controller';

// Exact port of app's LockAreaImage calculateImageStyle
const calculateImageStyle = (
    viewWidth: number,
    viewHeight: number,
    imageWidth: number,
    imageHeight: number,
    headRect: { leftTop: { x: number; y: number }; rightBottom: { x: number; y: number } },
    paddingLeftPct?: number,
    paddingRightPct?: number,
    paddingTopPct?: number,
    paddingBottomPct?: number,
) => {
    const headW = headRect.rightBottom.x - headRect.leftTop.x;
    const headH = headRect.rightBottom.y - headRect.leftTop.y;

    if (headW <= 0 || headH <= 0) return null;

    const pL = paddingLeftPct;
    const pR = paddingRightPct;
    const pT = paddingTopPct;
    const pB = paddingBottomPct;

    let scale: number;

    if (pL !== undefined && pR !== undefined) {
        scale = (viewWidth * (1 - pL - pR)) / headW;
    } else if (pT !== undefined && pB !== undefined) {
        scale = (viewHeight * (1 - pT - pB)) / headH;
    } else if (pL !== undefined || pR !== undefined) {
        scale = (viewWidth * 0.4) / headW;
    } else if (pT !== undefined || pB !== undefined) {
        scale = (viewHeight * 0.4) / headH;
    } else {
        return null;
    }

    if (scale <= 0) return null;

    const scaledHeadW = headW * scale;
    const scaledHeadH = headH * scale;

    let finalLeft: number;
    let finalTop: number;

    if (pL !== undefined && pR !== undefined) {
        finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    } else if (pL !== undefined) {
        finalLeft = viewWidth * pL - headRect.leftTop.x * scale;
    } else if (pR !== undefined) {
        finalLeft = viewWidth * (1 - pR) - headRect.rightBottom.x * scale;
    } else {
        finalLeft = (viewWidth - scaledHeadW) / 2 - headRect.leftTop.x * scale;
    }

    if (pT !== undefined && pB !== undefined) {
        finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    } else if (pT !== undefined) {
        finalTop = viewHeight * pT - headRect.leftTop.y * scale;
    } else if (pB !== undefined) {
        finalTop = viewHeight * (1 - pB) - headRect.rightBottom.y * scale;
    } else {
        finalTop = (viewHeight - scaledHeadH) / 2 - headRect.leftTop.y * scale;
    }

    return {
        width: imageWidth * scale,
        height: imageHeight * scale,
        left: finalLeft,
        top: finalTop,
    };
};

// Exact port of app's FileUtils.getImageFaceInfo
const getImageFaceInfo = (
    image: { width: number; height: number; face?: { leftTop: { x: number; y: number }; rightBottom: { x: number; y: number } } | null },
    inputRect: { left?: number; right?: number; top?: number; bottom?: number },
    force = false,
) => {
    const face = image.face ?? {
        leftTop: { x: 0, y: 0 },
        rightBottom: { x: image.width, y: image.height * 0.5 },
    };
    const rect = image.face || force
        ? inputRect
        : { left: 0, right: 0, top: 0 };
    return { face, rect };
};

// Card dimensions matching app exactly: 100×140 container
const CARD_VIEW_W = 100;
const CARD_VIEW_H = 140;

export const ScriptPreparePlayPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(ScriptPreparePlayController);

    const state = useReactive(() => ({
        title: ctrl.state.data?.state.title,
        author: ctrl.state.data?.state.author,
        isCollected: ctrl.state.data?.state.isCollected,
        roles: ctrl.state.data?.state.roles,
        preparePlayBackgroundImage: ctrl.state.data?.state.preparePlayBackgroundImage,
        selectedRoleId: ctrl.state.selectedRoleId,
        selectRoleCharacterState: ctrl.state.selectRole && {
            ...ctrl.state.selectRole.state.characterInfo?.state,
        },
        editRole: ctrl.state.editRole,
        newRole: ctrl.state.newRole,
        allowPlay: ctrl.state.allowPlay,
        showRoleEditor: !!(ctrl.state.editRole || ctrl.state.newRole),
        editingRole: ctrl.state.editRole ?? ctrl.state.newRole ?? null,
        editingRoleType: (() => {
            const info = ctrl.state.editRole ?? ctrl.state.newRole;
            if (!info) return null;
            return info.isNpc ? 'npc' : info.isOpen ? 'open' : 'fixed';
        })(),
    }));

    // Exact port: filter out NPC roles
    const roleList = useMemo(
        () => state.roles?.filter((item: ScriptTypes.RoleInfo) => !item.isNpc),
        [state.roles],
    );

    const showAddRoleButton = roleList && roleList.length < 5;

    const renderRoleItem = useCallback((item: ScriptTypes.RoleInfo) => {
        const isSelected = item.id === state.selectedRoleId;
        const characterInfo = item.state.characterInfo;
        const hasImage = !!characterInfo?.state.currentFigure;

        // Exact port of app's getImageFaceInfo call with same padding values
        const imageInfo = characterInfo?.state.currentFigure
            ? getImageFaceInfo(
                characterInfo.state.currentFigure.visual,
                { top: 0.2514, left: 0.29, right: 0.29 },
            )
            : null;

        const displayName =
            characterInfo?.state.name ??
            item.state.identities[0]?.label ??
            '';
        const displayIdentities = !characterInfo
            ? item.state.identities.slice(1)
            : item.state.identities;

        // Exact port: canEdit logic
        const canEdit = isSelected
            ? item.isOpen ? true : item.isLocal
            : false;

        // Compute image style using exact same algorithm as LockAreaImage
        let imgStyle: ReturnType<typeof calculateImageStyle> = null;
        if (hasImage && imageInfo) {
            const visual = characterInfo!.state.currentFigure!.visual;
            const imgW = visual.width ?? 1080;
            const imgH = visual.height ?? 1920;
            imgStyle = calculateImageStyle(
                CARD_VIEW_W,
                CARD_VIEW_H,
                imgW,
                imgH,
                imageInfo.face,
                imageInfo.rect.left,
                imageInfo.rect.right,
                imageInfo.rect.top,
                imageInfo.rect.bottom,
            );
        }

        return (
            <Pressable
                key={item.id}
                onPress={() =>
                    canEdit
                        ? ctrl.editRole(item.id)
                        : ctrl.selectRole(item.id)
                }
                className={cn(
                    'shrink-0 rounded-2xl border-2',
                )}
                style={{
                    width: 108,
                    height: 240,
                    paddingLeft: 4,
                    paddingRight: 4,
                    paddingTop: 4,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderColor: isSelected ? '#1A1A1A' : 'rgba(255,255,255,0)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                        style={{
                            width: CARD_VIEW_W,
                            height: CARD_VIEW_H,
                            borderRadius: 12,
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderRadius: 12,
                            }}
                        />
                        {hasImage && imgStyle ? (
                            <Image
                                source={{ uri: characterInfo!.state.currentFigure!.visual.uri }}
                                contentFit="contain"
                                style={{
                                    position: 'absolute',
                                    width: `${imgStyle.width}px`,
                                    height: `${imgStyle.height}px`,
                                    left: `${imgStyle.left}px`,
                                    top: `${imgStyle.top}px`,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 80,
                                    height: 77,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
                        {/* roleName: fontSize:18, fontWeight:600, color:#1A1A1A */}
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: '#1A1A1A',
                                textAlign: 'center',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {displayName}
                        </span>
                        {/* identities: fontSize:12, fontWeight:500, color:rgba(26,26,26,0.4) */}
                        {displayIdentities.map((identity: ScriptTypes.Identity, idx: number) => (
                            <span
                                key={idx}
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: 'rgba(26,26,26,0.4)',
                                    textAlign: 'center',
                                    width: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {identity.label}
                            </span>
                        ))}
                    </div>
                </div>
            </Pressable>
        );
    }, [state.selectedRoleId, ctrl]);

    return (
        <RenderParentProvider>
            <div className="absolute inset-0 overflow-hidden bg-bg-page">

                {/* backgroundContainer: absolute fill */}
                <div className="absolute inset-0">
                    {state.preparePlayBackgroundImage && (
                        <Image
                            source={{ uri: state.preparePlayBackgroundImage.uri }}
                            contentFit="cover"
                            className="w-full h-full"
                        />
                    )}
                    {/* backgroundOverlay: rgba(255,255,255,0.4) */}
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                </div>

                {/* closeButton */}
                <button
                    type="button"
                    onClick={ctrl.handleBack}
                    className="absolute top-4 right-7 z-10 w-9 h-9 flex items-center justify-center"
                    aria-label="关闭"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="relative flex flex-col h-full pt-12">

                    <div className="px-4 pt-12 flex flex-col gap-2">
                        <div className="flex items-start gap-9">
                            {/* title: color:#1A1A1A */}
                            <h1
                                className="flex-1 leading-tight line-clamp-2"
                                style={{ fontSize: 40, fontWeight: 900, color: '#1A1A1A' }}
                            >
                                {state.title}
                            </h1>
                            <Pressable
                                onPress={ctrl.collect}
                                className="w-9 h-9 flex items-center justify-center shrink-0 mr-3"
                                aria-label={state.isCollected ? '取消收藏' : '收藏'}
                            >
                                {state.isCollected ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ABFF1A" stroke="#ABFF1A" strokeWidth="1.5">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                )}
                            </Pressable>
                        </div>

                        {/* author: color:rgba(26,26,26,0.4) */}
                        <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(26,26,26,0.4)' }}>
                                {I18nTexts.author}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(26,26,26,0.4)' }}>
                                @{state.author?.name}
                            </span>
                        </div>
                    </div>

                    {/* selectRoleHint: dark lines + dark text */}
                    <div className="flex items-center justify-center mt-10 gap-2">
                        <div style={{ width: 64, height: 1, backgroundColor: 'rgba(26,26,26,0.4)' }} />
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
                            {I18nTexts.selectRole}
                        </span>
                        <div style={{ width: 64, height: 1, backgroundColor: 'rgba(26,26,26,0.4)' }} />
                    </div>

                    <div style={{ marginTop: 16, height: 250, flexShrink: 0 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="h-full"
                            contentContainerClassName="flex flex-row px-4 h-full items-start"
                            style={{ gap: 8 } as React.CSSProperties}
                        >
                            {roleList?.map((item: ScriptTypes.RoleInfo) => renderRoleItem(item))}

                            {showAddRoleButton && (
                                <Pressable
                                    onPress={ctrl.createRole}
                                    className="shrink-0 rounded-2xl border-2 border-transparent flex items-center justify-center"
                                    style={{
                                        width: 108,
                                        height: 240,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                    }}
                                    aria-label="添加角色"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </Pressable>
                            )}
                        </ScrollView>
                    </div>

                    {/* buttonsContainer: marginTop:89 fixed */}
                    <div className="px-4 pb-4 flex flex-col mt-[89px]" style={{ gap: 10 }}>
                        <Button
                            onPress={ctrl.playAsRole}
                            disabled={
                                !state.allowPlay ||
                                state.selectRoleCharacterState == null
                            }
                            kind="White"
                            size="medium"
                            className="w-full"
                        >
                            {state.selectRoleCharacterState
                                ? I18nTexts.playAsRole.replace(
                                      '{{roleName}}',
                                      state.selectRoleCharacterState.name ?? '',
                                  )
                                : I18nTexts.selectRoleTip}
                        </Button>

                        <Button
                            onPress={ctrl.playAsGod}
                            disabled={!state.allowPlay}
                            kind="White"
                            size="medium"
                            className="w-full"
                        >
                            {I18nTexts.playAsGod}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ScriptRoleEditor 弹层 */}
            {state.showRoleEditor && (
                <ScriptRoleEditor
                    roleType={state.editingRoleType as 'fixed' | 'npc' | 'open' | null}
                    initialInfo={state.editingRole}
                    role={state.editingRole}
                    roleList={state.roles ?? []}
                    onClose={ctrl.closeRoleEditor}
                    onConfirm={ctrl.onUpdateRole}
                />
            )}
        </RenderParentProvider>
    );
});
