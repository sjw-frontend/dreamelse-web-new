import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { Pressable, ScrollView, TextInput } from '$/uis/primitives';
import { CharacterCreateController } from './character-create-controller';
import type { CharacterTypes } from '$/types';

export const CharacterCreatePage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterCreateController);

    const state = useReactive(() => ({
        isCustom: ctrl.state.isCustom,
        isPick: ctrl.state.isPick,
        isCreate: ctrl.state.isCreate,
        pickList: ctrl.state.pickList,
        selectId: ctrl.state.selectId,
        searchKeyword: ctrl.state.searchKeyword,
        showSearch: ctrl.state.showSearch,
        defaultConfig: ctrl.state.defaultConfig,
        currentTagId: ctrl.state.currentTagId,
        sortedAbilities: ctrl.state.sortedAbilities,
        sumPercent: ctrl.state.sumPercent,
        evaluation: ctrl.state.evaluation,
        allowSubmit: ctrl.state.allowSubmit,
        previewData: ctrl.state.previewData,
        previewDataWritable: ctrl.state.previewDataWritable,
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                {!state.isCreate && (
                    <div className="flex flex-row items-center justify-between px-6 pt-4 pb-2 shrink-0">
                        {/* Tabs */}
                        <div className="flex flex-row gap-4 items-end">
                            <Pressable onPress={() => ctrl.toggleMode('pick')}>
                                <span className={`font-semibold transition-all ${!state.isCustom ? 'text-3xl text-text-primary' : 'text-3xl text-text-secondary/40'}`}>
                                    选择
                                </span>
                            </Pressable>
                            <Pressable onPress={() => ctrl.toggleMode('custom')}>
                                <span className={`font-semibold transition-all ${state.isCustom ? 'text-3xl text-text-primary' : 'text-3xl text-text-secondary/40'}`}>
                                    定制
                                </span>
                            </Pressable>
                        </div>

                        {/* Right buttons */}
                        <div className="flex flex-row items-center gap-3">
                            <Pressable
                                onPress={ctrl.toCreate}
                                className="w-9 h-9 flex items-center justify-center"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Pressable>
                            <Pressable
                                onPress={ctrl.goBack}
                                className="w-9 h-9 flex items-center justify-center"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </Pressable>
                        </div>
                    </div>
                )}

                {/* Pick mode */}
                {state.isPick && (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Search bar */}
                        <div className="px-4 py-2 shrink-0">
                            <div className="flex flex-row items-center gap-2 bg-bg-card rounded-xl px-3 h-10 border border-white/5">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary shrink-0">
                                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <TextInput
                                    className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary/50"
                                    placeholder="搜索角色..."
                                    value={state.searchKeyword}
                                    onChangeText={ctrl.setSearchKeyword}
                                    onSubmitEditing={ctrl.search}
                                />
                            </div>
                        </div>

                        {/* Tag filters */}
                        {state.defaultConfig?.searchTagList && state.defaultConfig.searchTagList.length > 0 && (
                            <div className="flex flex-row gap-2 px-4 pb-2 overflow-x-auto shrink-0 scrollbar-none">
                                <Pressable
                                    onPress={() => ctrl.setCurrentTagId(null)}
                                    className={`px-3 h-7 rounded-full text-xs font-medium shrink-0 ${state.currentTagId == null ? 'bg-accent text-black' : 'bg-bg-card text-text-secondary border border-white/10'}`}
                                >
                                    全部
                                </Pressable>
                                {state.defaultConfig.searchTagList.map((tag: CharacterTypes.SearchTag) => (
                                    <Pressable
                                        key={tag.id}
                                        onPress={() => ctrl.setCurrentTagId(tag.id)}
                                        className={`px-3 h-7 rounded-full text-xs font-medium shrink-0 ${state.currentTagId === tag.id ? 'bg-accent text-black' : 'bg-bg-card text-text-secondary border border-white/10'}`}
                                    >
                                        {tag.label}
                                    </Pressable>
                                ))}
                            </div>
                        )}

                        {/* Pick list */}
                        <ScrollView className="flex-1">
                            <div className="grid grid-cols-2 gap-3 px-4 pb-6">
                                {state.pickList.map((id: CharacterTypes.CharacterId) => (
                                    <PickCharacterCard
                                        key={id}
                                        id={id}
                                        isSelected={state.selectId === id}
                                        onSelect={ctrl.selectCharacter}
                                    />
                                ))}
                            </div>
                        </ScrollView>

                        {/* Confirm button */}
                        {state.selectId != null && (
                            <div className="px-4 pb-6 pt-2 shrink-0">
                                <Pressable
                                    onPress={ctrl.confirmSelection}
                                    className="w-full h-12 rounded-2xl bg-accent flex items-center justify-center"
                                >
                                    <span className="text-black font-semibold text-base">确认选择</span>
                                </Pressable>
                            </div>
                        )}
                    </div>
                )}

                {/* Custom mode */}
                {state.isCustom && (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Ability background indicator */}
                        {state.sortedAbilities.length > 0 && (
                            <div className="px-4 py-3 shrink-0">
                                <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
                                    <div className="flex flex-row items-center justify-between mb-3">
                                        <span className="text-text-primary font-semibold text-base">灵魂属性</span>
                                        <span className="text-text-secondary text-sm">{Math.round(state.sumPercent)}%</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {state.sortedAbilities.map(({ ability }: { ability: CharacterTypes.InitialAbility }) => (
                                            <div key={ability.id} className="flex flex-row items-center gap-3">
                                                <span className="text-text-secondary text-sm w-16 shrink-0">{ability.name}</span>
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent rounded-full transition-all duration-200"
                                                        style={{ width: `${ability.percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex flex-row gap-1 shrink-0">
                                                    <Pressable
                                                        onPress={() => ctrl.decreaseAbilityValue(ability.id)}
                                                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"
                                                    >
                                                        <span className="text-text-primary text-lg leading-none">−</span>
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => ctrl.increaseAbilityValue(ability.id)}
                                                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"
                                                    >
                                                        <span className="text-text-primary text-lg leading-none">+</span>
                                                    </Pressable>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {state.evaluation && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <span className="text-text-secondary text-sm">{state.evaluation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Generate button */}
                        <div className="px-4 pb-6 mt-auto shrink-0">
                            <Pressable
                                onPress={ctrl.generateFromSoul}
                                disabled={!state.allowSubmit}
                                className="w-full h-12 rounded-2xl bg-accent flex items-center justify-center disabled:opacity-40"
                            >
                                <span className="text-black font-semibold text-base">生成角色</span>
                            </Pressable>
                        </div>
                    </div>
                )}

                {/* Create / Editor mode */}
                {state.isCreate && (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="flex flex-row items-center px-4 py-3 shrink-0">
                            <Pressable onPress={ctrl.goBack} className="w-9 h-9 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Pressable>
                            <span className="flex-1 text-center text-text-primary font-semibold text-lg">
                                {state.previewDataWritable ? '创建角色' : '预览角色'}
                            </span>
                            <div className="w-9" />
                        </div>

                        <ScrollView className="flex-1">
                            <div className="px-4 pb-8 flex flex-col gap-4">
                                {state.previewData && (
                                    <div className="bg-bg-card rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                                        {/* Avatar preview */}
                                        <div className="flex flex-row items-center gap-4">
                                            <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden shrink-0">
                                                {state.previewData.state.currentFigure?.visual?.uri ? (
                                                    <img
                                                        src={state.previewData.state.currentFigure.visual.uri}
                                                        alt="avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                            <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                                            <path d="M5 27c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-text-primary font-semibold text-lg">
                                                    {state.previewData.state.name || '未命名角色'}
                                                </span>
                                                {state.previewData.state.honorary && (
                                                    <span className="text-text-secondary text-sm">
                                                        {state.previewData.state.honorary}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {state.previewData.state.bio && (
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                                {state.previewData.state.bio}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {!state.previewData && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M5 27c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <span className="text-text-secondary text-sm">正在准备角色信息...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollView>
                    </div>
                )}
            </div>
        </RenderParentProvider>
    );
});

interface PickCharacterCardProps {
    id: string;
    isSelected: boolean;
    onSelect: (id: string | null) => void;
}

const PickCharacterCard = optimize(({ id, isSelected, onSelect }: PickCharacterCardProps) => {
    return (
        <Pressable
            onPress={() => onSelect(isSelected ? null : id)}
            className={`relative rounded-2xl overflow-hidden aspect-[3/4] bg-bg-card border transition-all ${isSelected ? 'border-accent' : 'border-white/5'}`}
        >
            <div className="absolute inset-0 flex flex-col items-center justify-end p-3">
                <span className="text-text-secondary text-xs text-center">{id}</span>
            </div>
            {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </Pressable>
    );
});
