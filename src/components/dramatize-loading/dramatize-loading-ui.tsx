// @ts-nocheck
import { useState, useMemo } from 'react';
import { Image } from '$/uis/primitives';
import { optimize } from '$/view';

export type RoleInfo = {
    name: string;
    avatarUri: string | null;
    title: string;
    description?: string;
    secret?: string;
};

type Props = {
    show: boolean;
    kind: 'roles' | 'default';
    showLottie?: boolean;
    storyDesc?: string | null;
    roles?: RoleInfo[] | null;
};

export const DramatizeLoading = optimize((props: Props) => {
    const { show, kind, storyDesc, roles } = props;

    const [selectedIndex, setSelectedIndex] = useState(() =>
        storyDesc ? -1 : 0,
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
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ zIndex: 20, backgroundColor: 'rgba(0,0,0,0)' }}
            >
                {/* Spinner */}
                <div
                    className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: '#ABFF1A' }}
                />
                {/* Loading text */}
                <span
                    className="absolute text-text-primary"
                    style={{
                        bottom: 16,
                        fontSize: 16,
                        fontWeight: 500,
                        opacity: 0.7,
                    }}
                >
                    剧情载入中...
                </span>
            </div>
        );
    }

    // kind === 'roles'
    return (
        <div
            className="absolute inset-0 flex flex-col"
            style={{ zIndex: 20, backgroundColor: '#0D0D0D' }}
        >
            {/* Content area */}
            <div
                className="flex-1 w-full flex flex-col items-center overflow-y-auto"
                style={{ paddingLeft: 40, paddingRight: 40, paddingTop: 20, paddingBottom: 20 }}
            >
                {isScriptSelected && hasStoryDesc ? (
                    /* Script description view */
                    <div
                        className="w-full flex flex-col items-center"
                        style={{ marginTop: 148 }}
                    >
                        <div style={{ width: 182, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 12 }} />
                        <p
                            className="text-text-primary text-center"
                            style={{ fontSize: 40, lineHeight: '48px', fontWeight: 900, marginBottom: 12 }}
                        >
                            序
                        </p>
                        <div style={{ width: 182, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 24 }} />
                        <p
                            className="text-text-primary"
                            style={{ width: 246, fontSize: 16, lineHeight: '24px', textAlign: 'left' }}
                        >
                            {storyDesc}
                        </p>
                    </div>
                ) : selectedRole ? (
                    /* Role info view */
                    <div className="w-full flex flex-col items-center">
                        {/* Avatar */}
                        <div
                            className="relative flex-shrink-0"
                            style={{ width: 246, height: 246, marginTop: 133, marginBottom: 20 }}
                        >
                            <div
                                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                                style={{ backgroundColor: '#1A1A1A' }}
                            >
                                {selectedRole.avatarUri ? (
                                    <Image
                                        source={{ uri: selectedRole.avatarUri }}
                                        contentFit="cover"
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Role name */}
                        <p
                            className="text-text-primary text-center"
                            style={{ fontSize: 24, lineHeight: '32px', fontWeight: 900 }}
                        >
                            {selectedRole.name}
                        </p>

                        {/* Title */}
                        {selectedRole.title && (
                            <div style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 20, marginBottom: 16 }}>
                                <p
                                    className="text-center"
                                    style={{ fontSize: 14, lineHeight: '20px', color: 'rgba(255,255,255,0.5)' }}
                                >
                                    {selectedRole.title}
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 10, marginBottom: 10 }} />

                        {/* Description */}
                        {selectedRole.description && (
                            <div className="w-full" style={{ marginBottom: 16 }}>
                                <div className="flex flex-row items-center gap-1.5" style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: 16 }}>📌</span>
                                    <span style={{ fontSize: 16, lineHeight: '22px', color: 'rgba(255,255,255,0.5)' }}>角色描述</span>
                                </div>
                                <p
                                    className="text-text-primary"
                                    style={{ fontSize: 16, lineHeight: '22px', fontWeight: 500 }}
                                >
                                    {selectedRole.description}
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 10, marginBottom: 10 }} />

                        {/* Secret */}
                        {selectedRole.secret && (
                            <div className="w-full">
                                <div className="flex flex-row items-center gap-1.5" style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: 16 }}>⚠️</span>
                                    <span style={{ fontSize: 16, lineHeight: '22px', color: 'rgba(255,255,255,0.5)' }}>隐藏信息</span>
                                </div>
                                <p
                                    className="text-text-primary"
                                    style={{ fontSize: 16, lineHeight: '22px', fontWeight: 500 }}
                                >
                                    {selectedRole.secret}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Icon list */}
            {shouldShowIconList && (
                <div
                    className="flex flex-row items-center justify-center flex-shrink-0"
                    style={{ gap: 16, paddingLeft: 40, paddingRight: 40, paddingBottom: 20 }}
                >
                    {iconList.map((item, idx) => {
                        const isSelected = item.index === selectedIndex;
                        const role = item.type === 'role' ? roles?.[item.index] : null;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedIndex(item.index)}
                                className="flex-shrink-0"
                                style={{ width: 36, height: 36 }}
                            >
                                <div
                                    className="relative overflow-hidden"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        border: isSelected ? '2px solid #EDEDED' : '2px solid transparent',
                                        backgroundColor: '#1A1A1A',
                                    }}
                                >
                                    {item.type === 'script' ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 8v4l3 3" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    ) : role?.avatarUri ? (
                                        <Image
                                            source={{ uri: role.avatarUri }}
                                            contentFit="cover"
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
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

            {/* Loading text */}
            <p
                className="text-text-primary text-center flex-shrink-0"
                style={{ height: 22, fontSize: 16, fontWeight: 500, opacity: 0.7, marginBottom: 20 }}
            >
                剧情载入中...
            </p>
        </div>
    );
});
