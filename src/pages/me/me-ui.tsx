// @ts-nocheck
import { useCallback } from 'react';
import { useRegisterRenderController, useReactive, useZoneController } from '$/hooks';
import { usePopup } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { optimize } from '$/view';
import { withAuth } from '$/hocs';
import type { ReactTypes } from '$/types';
import { UserController } from '$/controllers';
import { MeController } from './me-controller';
import { PlayList, CreateList, CollectList } from './@parts';

type Tab = 'play' | 'create' | 'collect';

export const MePage: ReactTypes.FC = withAuth(optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(MeController);
    const userCtrl = useZoneController(UserController);
    const popup = usePopup();

    const state = useReactive(() => ({
        nickname: ctrl.state.nickname ?? '',
        uniqueId: ctrl.state.uniqueId ?? '',
        isPlay: ctrl.state.isPlay,
        isCreate: ctrl.state.isCreate,
        isCollect: ctrl.state.isCollect,
        playCount: userCtrl.state.loggedInUser?.scriptDetails.state.playCount ?? 0,
        createCount: userCtrl.state.loggedInUser?.scriptDetails.state.createCount ?? 0,
        collectCount: userCtrl.state.loggedInUser?.scriptDetails.state.collectCount ?? 0,
    }));

    const fmt = (n: number) => (n > 999 ? '999+' : String(n));

    const handleCopyUID = useCallback(async () => {
        if (state.uniqueId) {
            await ctrl.copyToClipboard(state.uniqueId);
        }
    }, [state.uniqueId, ctrl]);

    const handleEditName = useCallback(async () => {
        const newName = await new Promise<string | null>(resolve => {
            popup.openSingleInputDialog({
                title: '修改昵称',
                defaultValue: state.nickname,
                maxLength: 20,
                onConfirm: (value: string) => resolve(value),
                onCancel: () => resolve(null),
            });
        });
        if (newName) ctrl.updateUsername?.(newName);
    }, [popup, state.nickname, ctrl]);

    const tabs: { key: Tab; label: string; count: number; active: boolean }[] = [
        { key: 'play', label: '玩过', count: state.playCount, active: state.isPlay },
        { key: 'create', label: '创作', count: state.createCount, active: state.isCreate },
        { key: 'collect', label: '收藏', count: state.collectCount, active: state.isCollect },
    ];

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card overflow-hidden">

                {/* Navbar — height 48px */}
                <div className="flex flex-row items-center px-4 shrink-0" style={{ height: 48 }}>
                    {/* Back button 36×36 */}
                    <Pressable
                        onPress={ctrl.goBack}
                        className="flex items-center justify-center"
                        style={{ width: 36, height: 36 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>

                    {/* Spacer — no title */}
                    <div className="flex-1" />

                    {/* Settings button 36×36 */}
                    <Pressable
                        onPress={ctrl.toSettings}
                        className="flex items-center justify-center"
                        style={{ width: 36, height: 36 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </Pressable>
                </div>

                {/* User info — mx-4 mb-2.5 mt-0 gap-1 */}
                <div className="mx-4 mb-2.5 flex flex-col gap-1">
                    {/* Nickname row */}
                    <div className="flex flex-row items-center gap-1.5">
                        <span
                            className="font-semibold text-text-primary truncate"
                            style={{ fontSize: 30, lineHeight: '1.2' }}
                        >
                            {state.nickname || '未设置昵称'}
                        </span>
                        <Pressable
                            onPress={handleEditName}
                            className="flex items-center justify-center shrink-0"
                            style={{ width: 16, height: 16, opacity: 0.3 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Pressable>
                    </div>

                    {/* UID badge */}
                    {state.uniqueId ? (
                        <Pressable onPress={handleCopyUID} className="self-start">
                            <div
                                className="flex flex-row items-center px-1.5 py-0.5 rounded-[20px]"
                                style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                                <span
                                    className="font-medium"
                                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}
                                >
                                    UID: {state.uniqueId}
                                </span>
                            </div>
                        </Pressable>
                    ) : null}
                </div>

                {/* Tab area — py-2.5 ml-4 flex row horizontal scroll gap-1.5 */}
                <div className="py-2.5 ml-4 flex flex-row gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                    {tabs.map(tab => (
                        <Pressable
                            key={tab.key}
                            onPress={() => ctrl.setTab(tab.key)}
                            className="flex flex-row items-center justify-center gap-1 rounded-xl shrink-0"
                            style={
                                tab.active
                                    ? {
                                          border: '2px solid var(--color-text-primary, #fff)',
                                          paddingLeft: 14,
                                          paddingRight: 14,
                                          paddingTop: 6,
                                          paddingBottom: 6,
                                          height: 21,
                                          boxSizing: 'content-box',
                                      }
                                    : {
                                          border: '1px solid rgba(255,255,255,0.06)',
                                          paddingLeft: 15,
                                          paddingRight: 15,
                                          paddingTop: 7,
                                          paddingBottom: 7,
                                          height: 21,
                                          boxSizing: 'content-box',
                                      }
                            }
                        >
                            <span
                                className="font-semibold"
                                style={{
                                    fontSize: 16,
                                    lineHeight: '1',
                                    color: tab.active ? 'var(--color-text-primary, #fff)' : 'rgba(255,255,255,0.4)',
                                }}
                            >
                                {tab.label}
                            </span>
                            <span
                                className="font-medium"
                                style={{
                                    fontSize: 16,
                                    lineHeight: '1',
                                    color: 'rgba(0,0,0,0.5)',
                                }}
                            >
                                {fmt(tab.count)}
                            </span>
                        </Pressable>
                    ))}
                </div>

                {/* Content area — all three lists rendered, visibility toggled */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <div style={{ display: state.isPlay ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
                        <PlayList ctrl={ctrl} />
                    </div>
                    <div style={{ display: state.isCreate ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
                        <CreateList ctrl={ctrl} />
                    </div>
                    <div style={{ display: state.isCollect ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}>
                        <CollectList ctrl={ctrl} />
                    </div>
                </div>

            </div>
        </RenderParentProvider>
    );
}));
