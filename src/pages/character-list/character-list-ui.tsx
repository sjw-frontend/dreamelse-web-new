import { useRef } from 'react';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { CharacterController, UserController } from '$/controllers';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import { Menu } from '$/uis/menu';
import { cn } from '$/utils/cn';
import type { CharacterTypes } from '$/types';
import { CharacterListController } from './character-list-controller';

export const CharacterListPage = optimize(() => {
    const userCtrl = useZoneController(UserController);

    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterListController);

    const state = useReactive(() => ({
        currentShowDeleteMenuId: ctrl.state.currentShowDeleteMenuId,
        characterIds: (userCtrl.state.loggedInUser?.characterDetails.state.list ?? []) as CharacterTypes.CharacterId[],
    }));

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
                    <ScrollView className="flex-1">
                        <div className="flex flex-col pb-24">
                            {state.characterIds.map(id => (
                                <CharacterListItem
                                    key={id}
                                    id={id}
                                    isShowDeleteMenu={state.currentShowDeleteMenuId === id}
                                    onPress={ctrl.goInteraction}
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

interface CharacterListItemProps {
    id: CharacterTypes.CharacterId;
    isShowDeleteMenu: boolean;
    onPress: (id: string) => void;
    onShowDeleteMenu: (id: string) => void;
    onHideDeleteMenu: (id: string) => void;
}

const CharacterListItem = optimize(({
    id,
    isShowDeleteMenu,
    onPress,
    onShowDeleteMenu,
    onHideDeleteMenu,
}: CharacterListItemProps) => {
    const characterCtrl = useZoneController(CharacterController);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    const state = useReactive(() => {
        const info = characterCtrl.getCharacter(id);
        return {
            name: info?.state.name ?? '',
            species: info?.state.species?.name ?? null,
            gender: info?.state.gender ?? null,
            avatar: info?.state.currentFigure?.visual?.uri ?? null,
        };
    });

    const menuCoordinate = (() => {
        if (!isShowDeleteMenu || !moreButtonRef.current) return undefined;
        const rect = moreButtonRef.current.getBoundingClientRect();
        return { x: rect.right, y: rect.bottom };
    })();

    const badge = [state.species, state.gender].filter(Boolean).join(' · ');

    return (
        <div className="relative">
            <Pressable
                className={cn(
                    'flex flex-row items-center gap-3 px-4 py-3 w-full text-left',
                    'active:bg-white/5 transition-colors duration-100',
                )}
                onPress={() => onPress(id)}
            >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-bg-card overflow-hidden shrink-0">
                    {state.avatar ? (
                        <img src={state.avatar} alt={state.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <span className="text-text-primary font-semibold text-base truncate">{state.name}</span>
                    {badge ? (
                        <span className="text-text-secondary text-sm truncate">{badge}</span>
                    ) : null}
                </div>

                {/* More button */}
                <Pressable
                    ref={moreButtonRef}
                    className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg hover:bg-white/5"
                    onPress={() => onShowDeleteMenu(id)}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
                        <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                        <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                        <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                    </svg>
                </Pressable>
            </Pressable>

            {/* Delete menu */}
            <Menu
                active={isShowDeleteMenu}
                onClose={() => onHideDeleteMenu(id)}
                coordinate={menuCoordinate}
                anchor="top-right"
                optionList={[
                    {
                        label: '删除',
                        value: 'delete',
                        icon: (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-400">
                                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ),
                    },
                ]}
                onChange={() => {
                    onHideDeleteMenu(id);
                }}
            />
        </div>
    );
});
