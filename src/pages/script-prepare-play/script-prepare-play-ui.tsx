import { useMemo } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { Image, Pressable, ScrollView, ActivityIndicator } from '$/uis/primitives';
import { Button } from '$/uis/button/button-ui';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import type { ScriptTypes } from '$/types';
import { I18nTexts } from './script-prepare-play-const';
import { ScriptPreparePlayController } from './script-prepare-play-controller';

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
        allowPlay: ctrl.state.allowPlay,
    }));

    const roleList = useMemo(
        () => state.roles?.filter((item: ScriptTypes.RoleInfo) => !item.attrs.isNpc),
        [state.roles],
    );

    const showAddRoleButton = roleList && roleList.length < 5;

    return (
        <RenderParentProvider>
            {/* Full-screen container */}
            <div className="relative w-full h-full overflow-hidden bg-bg-page">

                {/* Background image + overlay */}
                <div className="absolute inset-0">
                    {state.preparePlayBackgroundImage && (
                        <Image
                            source={{ uri: state.preparePlayBackgroundImage.uri }}
                            contentFit="cover"
                            className="w-full h-full"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                {/* Close button */}
                <button
                    type="button"
                    onClick={ctrl.handleBack}
                    className="absolute top-4 right-7 z-10 w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    aria-label="关闭"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Content */}
                <div className="relative flex flex-col h-full pt-12 pb-6">

                    {/* Script info */}
                    <div className="px-4 pt-10 flex flex-col gap-2">
                        <div className="flex items-start gap-9">
                            <h1 className="flex-1 text-4xl font-black text-white leading-tight line-clamp-2">
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
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                )}
                            </Pressable>
                        </div>

                        {/* Author */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white/40">{I18nTexts.author}</span>
                            <span className="text-xs font-semibold text-white/40">@{state.author?.name}</span>
                        </div>
                    </div>

                    {/* Select role hint */}
                    <div className="flex items-center justify-center mt-10 gap-2">
                        <div className="w-16 h-px bg-white/40" />
                        <span className="text-base font-semibold text-white">{I18nTexts.selectRole}</span>
                        <div className="w-16 h-px bg-white/40" />
                    </div>

                    {/* Role list */}
                    <div className="mt-4 flex-shrink-0">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="h-[250px]"
                            contentContainerClassName="flex flex-row gap-2 px-4 h-[250px] items-start"
                        >
                            {roleList?.map((item: ScriptTypes.RoleInfo) => {
                                const isSelected = item.id === state.selectedRoleId;
                                const characterInfo = item.state.characterInfo;
                                const hasImage = !!characterInfo?.state.currentFigure;
                                const displayName =
                                    characterInfo?.state.name ??
                                    item.state.identities[0]?.label ??
                                    '';
                                const displayIdentities = !characterInfo
                                    ? item.state.identities.slice(1)
                                    : item.state.identities;

                                const canEdit = isSelected
                                    ? item.isOpen ? true : item.isLocal
                                    : false;

                                return (
                                    <Pressable
                                        key={item.id}
                                        onPress={() =>
                                            canEdit
                                                ? ctrl.editRole(item.id)
                                                : ctrl.selectRole(item.id)
                                        }
                                        className={cn(
                                            'w-[108px] shrink-0 pt-1 px-1 rounded-2xl h-[240px]',
                                            'bg-white/15 border-2',
                                            isSelected
                                                ? 'border-white'
                                                : 'border-transparent',
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            {/* Avatar */}
                                            <div className="w-[100px] h-[140px] rounded-xl overflow-hidden relative flex items-center justify-center bg-white/[0.06]">
                                                {hasImage ? (
                                                    <Image
                                                        source={{ uri: characterInfo!.state.currentFigure!.visual.uri }}
                                                        contentFit="cover"
                                                        className="w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                                                            <circle cx="12" cy="8" r="4" />
                                                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name + identities */}
                                            <div className="flex flex-col items-center gap-0.5 w-full px-1">
                                                <span className="text-lg font-semibold text-white text-center truncate w-full">
                                                    {displayName}
                                                </span>
                                                {displayIdentities.map((identity: ScriptTypes.Identity, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs font-medium text-white/40 text-center truncate w-full"
                                                    >
                                                        {identity.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Pressable>
                                );
                            })}

                            {/* Add role button */}
                            {showAddRoleButton && (
                                <Pressable
                                    onPress={ctrl.createRole}
                                    className="w-[108px] shrink-0 h-[240px] rounded-2xl bg-white/15 border-2 border-transparent flex items-center justify-center"
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

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bottom buttons */}
                    <div className="px-4 flex flex-col gap-2.5">
                        <Button
                            onPress={ctrl.playAsRole}
                            disabled={
                                !state.allowPlay ||
                                state.selectRoleCharacterState == null
                            }
                            kind="Primary"
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
                            kind="Minor"
                            size="medium"
                            className="w-full"
                        >
                            {I18nTexts.playAsGod}
                        </Button>
                    </div>
                </div>
            </div>
        </RenderParentProvider>
    );
});
