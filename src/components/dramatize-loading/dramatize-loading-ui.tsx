// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { LockAreaImage } from '$/uis';
import { ASSETS } from '$/consts';
import { FileUtils } from '$/utils';
import { optimize } from '$/view';
import { SpotlightText } from '$/components/dramatize-engine/@uis';

export type RoleInfo = {
    name: string;
    avatar: { uri: string; width: number; height: number; face?: { leftTop: { x: number; y: number }; rightBottom: { x: number; y: number } } | null } | null;
    title: string;
    description?: string;
    secret?: string;
};

type Props = {
    show: boolean;
    kind: 'roles' | 'default';
    showLottie?: boolean;
    hideLoadingText?: boolean;
    storyDesc?: string | null;
    roles?: RoleInfo[] | null;
    loadingTextList?: string[];
};

const TEXT_CHANGE_INTERVAL_MS = 1000;

export const DramatizeLoading = optimize((props: Props) => {
    const { show, kind, showLottie, hideLoadingText, storyDesc, roles, loadingTextList } = props;

    const lottieRef = useRef<HTMLDivElement>(null);

    const [selectedIndex, setSelectedIndex] = useState(() =>
        storyDesc ? -1 : 0,
    );

    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        if (!show || !loadingTextList || loadingTextList.length === 0) return;
        setTextIndex(0);
        const list = loadingTextList;
        const timer = setInterval(() => {
            setTextIndex(prev => (prev === list.length - 1 ? 0 : prev + 1));
        }, TEXT_CHANGE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [show, loadingTextList]);

    useEffect(() => {
        if (!showLottie || !lottieRef.current) return;
        const anim = lottie.loadAnimation({
            container: lottieRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/assets/lottie/light.json',
        });
        return () => anim.destroy();
    }, [showLottie]);

    const loadingText = useMemo(
        () =>
            loadingTextList && loadingTextList.length > 0
                ? loadingTextList[textIndex]
                : '剧情载入中...',
        [loadingTextList, textIndex],
    );

    const hasStoryDesc = !!storyDesc;
    const isScriptSelected = selectedIndex === -1;
    const selectedRole = useMemo(
        () => (selectedIndex >= 0 ? roles?.[selectedIndex] ?? null : null),
        [roles, selectedIndex],
    );

    const shouldShowIconList = useMemo(
        () => hasStoryDesc || (roles?.length ?? 0) > 1,
        [hasStoryDesc, roles?.length],
    );

    const iconList = useMemo(() => {
        if (!shouldShowIconList) return [];
        const items: { type: 'role' | 'script'; index: number }[] = [];
        if (hasStoryDesc) items.push({ type: 'script', index: -1 });
        roles?.forEach((_, i) => items.push({ type: 'role', index: i }));
        return items;
    }, [shouldShowIconList, hasStoryDesc, roles]);

    if (!show) return null;

    if (kind === 'default') {
        return (
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                }}
            >
                {showLottie && (
                    <div ref={lottieRef} style={{ width: 120, height: 120, marginBottom: 8 }} />
                )}
                {!hideLoadingText && (
                    <div style={{ marginBottom: 20 }}>
                        <SpotlightText
                            text={loadingText}
                            textStyle={{ fontSize: 16, fontWeight: 500 }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // kind === 'roles'
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* ── 内容滚动区 ── */}
            <div
                style={{
                    flex: 1,
                    width: '100%',
                    paddingLeft: 40,
                    paddingRight: 40,
                    paddingBottom: 20,
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                }}
            >
                {isScriptSelected && hasStoryDesc ? (
                    /* 剧本介绍视图 */
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginTop: 148,
                        }}
                    >
                        <img
                            src={ASSETS.Dramatize.descLine}
                            alt=""
                            style={{ width: 182, height: 1, marginBottom: 12 }}
                        />
                        <p
                            style={{
                                fontSize: 40,
                                lineHeight: '48px',
                                fontWeight: 900,
                                color: '#EDEDED',
                                textAlign: 'center',
                                marginBottom: 12,
                                margin: '0 0 12px 0',
                            }}
                        >
                            序
                        </p>
                        <img
                            src={ASSETS.Dramatize.descLine}
                            alt=""
                            style={{ width: 182, height: 1, marginBottom: 24 }}
                        />
                        <p
                            style={{
                                width: 246,
                                fontSize: 16,
                                lineHeight: '24px',
                                color: '#EDEDED',
                                textAlign: 'left',
                                margin: 0,
                            }}
                        >
                            {storyDesc}
                        </p>
                    </div>
                ) : selectedRole ? (
                    /* 角色信息视图 */
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* 头像容器（含 roleDesc 装饰图） */}
                        <div
                            style={{
                                width: 246,
                                height: 246,
                                position: 'relative',
                                marginTop: 133,
                                marginBottom: 20,
                                flexShrink: 0,
                            }}
                        >
                            {/* roleDesc 装饰图，position absolute top: -150 */}
                            <img
                                src={ASSETS.Dramatize.roleDesc}
                                alt=""
                                style={{
                                    position: 'absolute',
                                    width: 246,
                                    height: 246,
                                    top: -150,
                                    left: 0,
                                    objectFit: 'contain',
                                    pointerEvents: 'none',
                                }}
                            />
                            {/* 头像圆形 */}
                            <div
                                style={{
                                    width: 246,
                                    height: 246,
                                    borderRadius: 123,
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {selectedRole.avatar ? (() => {
                                    const faceInfo = FileUtils.getImageFaceInfo(selectedRole.avatar, { left: 0.25, right: 0.25, top: 0.25 });
                                    return (
                                        <LockAreaImage
                                            image={selectedRole.avatar}
                                            area={faceInfo?.face}
                                            rect={faceInfo?.rect}
                                            style={{ width: 246, height: 246, borderRadius: 123 }}
                                        />
                                    );
                                })() : (
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* 角色名 */}
                        <p
                            style={{
                                fontSize: 24,
                                lineHeight: '32px',
                                fontWeight: 900,
                                color: '#EDEDED',
                                textAlign: 'center',
                                margin: 0,
                            }}
                        >
                            {selectedRole.name}
                        </p>

                        {/* 职称 */}
                        {selectedRole.title && (
                            <div
                                style={{
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    borderRadius: 20,
                                    marginBottom: 16,
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: 'rgba(255,255,255,0.5)',
                                        textAlign: 'center',
                                        margin: 0,
                                    }}
                                >
                                    {selectedRole.title}
                                </p>
                            </div>
                        )}

                        {/* 分割线（dashedLine 图片） */}
                        <img
                            src={ASSETS.NewCommon.dashedLine}
                            alt=""
                            style={{ width: '100%', height: 1, marginTop: 10, marginBottom: 10 }}
                        />

                        {/* 角色介绍 */}
                        {selectedRole.description && (
                            <div style={{ width: '100%', marginBottom: 16 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 6,
                                    }}
                                >
                                    <span style={{ fontSize: 16, lineHeight: '22px' }}>📌</span>
                                    <span style={{ fontSize: 16, lineHeight: '22px', color: 'rgba(255,255,255,0.5)' }}>
                                        角色介绍
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: 16,
                                        lineHeight: '22px',
                                        fontWeight: 500,
                                        color: '#EDEDED',
                                        margin: 0,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {selectedRole.description}
                                </p>
                            </div>
                        )}

                        {/* 分割线 */}
                        <img
                            src={ASSETS.NewCommon.dashedLine}
                            alt=""
                            style={{ width: '100%', height: 1, marginTop: 10, marginBottom: 10 }}
                        />

                        {/* 隐藏信息 */}
                        {selectedRole.secret && (
                            <div style={{ width: '100%' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 6,
                                    }}
                                >
                                    <span style={{ fontSize: 16, lineHeight: '22px' }}>⚠️</span>
                                    <span style={{ fontSize: 16, lineHeight: '22px', color: 'rgba(255,255,255,0.5)' }}>
                                        隐藏信息
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: 16,
                                        lineHeight: '22px',
                                        fontWeight: 500,
                                        color: '#EDEDED',
                                        margin: 0,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {selectedRole.secret}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* ── 底部 icon 列表 ── */}
            {shouldShowIconList && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        paddingLeft: 40,
                        paddingRight: 40,
                        paddingBottom: 20,
                        flexShrink: 0,
                    }}
                >
                    {iconList.map((item, idx) => {
                        const isSelected = item.index === selectedIndex;
                        const role = item.type === 'role' ? roles?.[item.index] : null;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedIndex(item.index)}
                                style={{
                                    width: Settings.iconSize,
                                    height: Settings.iconSize,
                                    flexShrink: 0,
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                }}
                                aria-label={role?.name ?? '剧本简介'}
                            >
                                <div
                                    style={{
                                        width: Settings.iconSize,
                                        height: Settings.iconSize,
                                        borderRadius: Settings.iconSize / 2,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: isSelected
                                            ? `${Settings.iconBorderWidth}px solid #EDEDED`
                                            : `${Settings.iconBorderWidth}px solid transparent`,
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    {item.type === 'script' ? (
                                        <img
                                            src={ASSETS.Dramatize.godIcon}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    ) : role?.avatar ? (() => {
                                        const avatarInfo = FileUtils.getImageFaceInfo(role.avatar, { left: 0.25, right: 0.25, top: 0.25 });
                                        return (
                                            <LockAreaImage
                                                image={role.avatar}
                                                area={avatarInfo?.face}
                                                rect={avatarInfo?.rect}
                                                style={{ width: Settings.iconSize, height: Settings.iconSize, borderRadius: Settings.iconSize / 2 }}
                                            />
                                        );
                                    })() : (
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#1A1A1A',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundColor: 'rgba(0,0,0,0.75)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── 底部加载文字 ── */}
            {!hideLoadingText && (
                <div style={{ alignSelf: 'center', marginBottom: 20, flexShrink: 0 }}>
                    <SpotlightText
                        text={loadingText}
                        textStyle={{ fontSize: 16, fontWeight: 500 }}
                    />
                </div>
            )}
        </div>
    );
});
