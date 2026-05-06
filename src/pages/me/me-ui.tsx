import { useCallback } from 'react';
import { useRegisterRenderController, useReactive, useZoneController } from '$/hooks';
import { ScrollView, Pressable } from '$/uis/primitives';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { UserController } from '$/controllers';
import { MeController } from './me-controller';
import { PlayList, CreateList, CollectList } from './@parts';

// Tab type
type Tab = 'play' | 'create' | 'collect';

// User info header
const UserInfoHeader = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const state = useReactive(() => ({
        nickname: ctrl.state.nickname ?? '',
        uniqueId: ctrl.state.uniqueId ?? '',
    }));

    const handleCopyUID = useCallback(async () => {
        if (state.uniqueId) {
            await ctrl.copyToClipboard(state.uniqueId);
        }
    }, [state.uniqueId, ctrl]);

    return (
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-full bg-bg-card border-2 border-border-default flex items-center justify-center shrink-0">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>

            {/* Nickname row */}
            <div className="flex flex-row items-center gap-2">
                <span className="text-3xl font-semibold text-text-primary truncate max-w-[200px]">
                    {state.nickname || '未设置昵称'}
                </span>
                <Pressable onPress={() => {}} className="opacity-40">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                        <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Pressable>
            </div>

            {/* UID badge */}
            {state.uniqueId ? (
                <Pressable onPress={handleCopyUID}>
                    <div className="flex flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card border border-border-default">
                        <span className="text-xs text-text-tertiary font-medium">
                            UID: {state.uniqueId}
                        </span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-text-quaternary">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                </Pressable>
            ) : null}
        </div>
    );
});

// Stats row
const StatsRow = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const userCtrl = useZoneController(UserController);

    const state = useReactive(() => ({
        playCount: userCtrl.state.loggedInUser?.scriptDetails.state.playCount ?? 0,
        createCount: userCtrl.state.loggedInUser?.scriptDetails.state.createCount ?? 0,
        collectCount: userCtrl.state.loggedInUser?.scriptDetails.state.collectCount ?? 0,
    }));

    const fmt = (n: number) => (n > 999 ? '999+' : String(n));

    return (
        <div className="flex flex-row items-center justify-center gap-0 mx-6 mb-4 rounded-2xl bg-bg-card border border-border-default overflow-hidden">
            {(
                [
                    { label: '玩过', value: fmt(state.playCount) },
                    { label: '创作', value: fmt(state.createCount) },
                    { label: '收藏', value: fmt(state.collectCount) },
                ] as const
            ).map((item, i, arr) => (
                <div
                    key={item.label}
                    className={cn(
                        'flex flex-col items-center justify-center flex-1 py-4 gap-0.5',
                        i < arr.length - 1 && 'border-r border-border-default',
                    )}
                >
                    <span className="text-xl font-bold text-text-primary">{item.value}</span>
                    <span className="text-xs text-text-tertiary">{item.label}</span>
                </div>
            ))}
        </div>
    );
});

// Tab bar
const TabBar = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const state = useReactive(() => ({
        isPlay: ctrl.state.isPlay,
        isCreate: ctrl.state.isCreate,
        isCollect: ctrl.state.isCollect,
    }));

    const tabs: { key: Tab; label: string; active: boolean }[] = [
        { key: 'play', label: '玩过', active: state.isPlay },
        { key: 'create', label: '创作', active: state.isCreate },
        { key: 'collect', label: '收藏', active: state.isCollect },
    ];

    return (
        <div className="flex flex-row items-center px-4 gap-1 shrink-0 border-b border-border-default">
            {tabs.map(tab => (
                <Pressable
                    key={tab.key}
                    onPress={() => ctrl.setTab(tab.key)}
                    className={cn(
                        'px-4 py-3 text-base font-semibold transition-all duration-150 relative',
                        tab.active ? 'text-text-primary' : 'text-text-tertiary',
                    )}
                >
                    {tab.label}
                    {tab.active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" />
                    )}
                </Pressable>
            ))}
        </div>
    );
});

const ScriptList = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => {
    const state = useReactive(() => ({
        isPlay: ctrl.state.isPlay,
        isCreate: ctrl.state.isCreate,
        isCollect: ctrl.state.isCollect,
    }));

    return (
        <div className="flex-1 overflow-hidden">
            {state.isPlay && <PlayList ctrl={ctrl} />}
            {state.isCreate && <CreateList ctrl={ctrl} />}
            {state.isCollect && <CollectList ctrl={ctrl} />}
        </div>
    );
});

// Settings footer
const SettingsFooter = optimize(({ ctrl }: { ctrl: InstanceType<typeof MeController> }) => (
    <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border-default">
        <Pressable
            onPress={ctrl.toSettings}
            className="flex flex-row items-center justify-between w-full px-4 py-3 rounded-xl bg-bg-card border border-border-default"
        >
            <div className="flex flex-row items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path
                        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                </svg>
                <span className="text-base text-text-primary font-medium">设置</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </Pressable>
    </div>
));

export const MePage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(MeController);

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page overflow-hidden">
                {/* Top nav */}
                <div className="flex flex-row items-center justify-between px-4 h-navbar shrink-0">
                    <Pressable onPress={ctrl.goBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>
                    <span className="text-base font-semibold text-text-primary">我的</span>
                    <div className="w-6" />
                </div>

                {/* Scrollable profile area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* User info + stats (non-scrollable header) */}
                    <UserInfoHeader ctrl={ctrl} />
                    <StatsRow ctrl={ctrl} />

                    {/* Tab bar */}
                    <TabBar ctrl={ctrl} />

                    {/* Script list */}
                    <ScriptList ctrl={ctrl} />
                </div>

                {/* Settings footer */}
                <SettingsFooter ctrl={ctrl} />
            </div>
        </RenderParentProvider>
    );
});
