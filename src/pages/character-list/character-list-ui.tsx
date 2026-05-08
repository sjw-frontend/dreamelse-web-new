// @ts-nocheck
import { useRef } from 'react';
import { useListenEvent, useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { UserController } from '$/controllers';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import type { CharacterTypes } from '$/types';
import { CharacterMomentCard } from '$/components/character-moment-card';
import { CharacterListController } from './character-list-controller';

export const CharacterListPage = optimize(() => {
    const userCtrl = useZoneController(UserController);
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterListController);
    const listRef = useRef<HTMLDivElement>(null);

    const state = useReactive(() => ({
        currentShowDeleteMenuId: ctrl.state.currentShowDeleteMenuId,
        characterIds: (userCtrl.state.loggedInUser?.characterDetails.state.list ?? []) as CharacterTypes.CharacterId[],
    }));

    useListenEvent(ctrl, 'refresh', () => {
        setTimeout(() => {
            listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    });

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                <div className="flex flex-row items-center justify-between px-4 h-14 shrink-0 border-b border-white/5">
                    <span className="text-2xl font-semibold text-text-primary">角色</span>
                    <Pressable
                        onPress={ctrl.goCreate}
                        className="w-9 h-9 rounded-xl border border-white/[0.06] bg-bg-card flex items-center justify-center"
                    >
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </Pressable>
                </div>

                {/* Empty state */}
                {state.characterIds.length === 0 && (
                    <div className="flex flex-col flex-1 items-center justify-center gap-6">
                        <div className="w-[120px] h-[120px] flex items-center justify-center opacity-30">
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                <circle cx="60" cy="45" r="20" stroke="currentColor" strokeWidth="3" />
                                <path d="M20 100c0-22.091 17.909-40 40-40s40 17.909 40 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="text-text-secondary text-[15px]">还没有角色</span>
                        <Pressable
                            onPress={ctrl.goCreate}
                            className="px-6 h-12 rounded-full bg-bg-card border border-white/10 flex items-center justify-center"
                        >
                            <span className="text-text-primary font-semibold text-base">创建角色</span>
                        </Pressable>
                    </div>
                )}

                {/* Character list */}
                {state.characterIds.length > 0 && (
                    <ScrollView className="flex-1" ref={listRef}>
                        <div className="flex flex-col pb-24">
                            {state.characterIds.map(id => (
                                <CharacterMomentCard
                                    key={id}
                                    id={id}
                                    isShowDeleteMenu={state.currentShowDeleteMenuId === id}
                                    onShowDeleteMenu={ctrl.setCurrentShowDeleteMenuId}
                                    onHideDeleteMenu={ctrl.clearCurrentShowDeleteMenuId}
                                />
                            ))}
                        </div>
                    </ScrollView>
                )}
            </div>
        </RenderParentProvider>
    );
});
