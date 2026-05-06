import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import { CharacterStatsController } from './character-stats-controller';
import type { CharacterTypes } from '$/types';

export const CharacterStatsPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterStatsController);

    const state = useReactive(() => ({
        dataState: ctrl.state.data && { ...ctrl.state.data.state },
    }));

    const stats = state.dataState?.stats;
    const characterName = state.dataState?.name;
    const avatarUri = state.dataState?.currentFigure?.visual?.uri ?? null;

    if (!stats) {
        return (
            <RenderParentProvider>
                <div className="flex flex-col h-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #94FF51 0%, #AEFFB6 100%)' }}>
                    <Pressable
                        onPress={ctrl.goBack}
                        className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center z-10"
                    >
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ transform: 'rotate(90deg)' }}>
                            <path d="M18 8v20M8 18h20" stroke="black" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </Pressable>
                    <div className="flex flex-1 items-center justify-center">
                        <span className="text-white/40 text-base">暂无数据</span>
                    </div>
                </div>
            </RenderParentProvider>
        );
    }

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #94FF51 0%, #AEFFB6 100%)' }}>
                {/* Character avatar background */}
                {avatarUri && (
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center overflow-hidden opacity-50">
                        <img src={avatarUri} alt="character" className="w-full h-full object-contain" />
                    </div>
                )}

                {/* Close button */}
                <Pressable
                    onPress={ctrl.goBack}
                    className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center z-10"
                    style={{ transform: 'rotate(90deg)' }}
                >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <path d="M18 8v20M8 18h20" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </Pressable>

                <ScrollView className="flex-1 relative z-10">
                    <div className="px-4 pt-4 pb-10 flex flex-col gap-4">
                        {/* Header */}
                        <div className="mt-2">
                            <div className="mb-3">
                                <p className="text-black font-bold text-xl mb-1">能力值</p>
                                <p className="text-black/30 text-xs font-bold">综合能力评估</p>
                            </div>
                            <div className="flex flex-row items-center justify-between">
                                <span className="text-black font-bold" style={{ fontSize: 80, lineHeight: '105px' }}>
                                    {stats.abilityValue}
                                </span>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="text-black font-bold text-xl">{characterName}</span>
                                    {stats.evaluation && (
                                        <div className="bg-black rounded-full px-3 py-1.5">
                                            <span className="text-white text-xs font-bold">#{stats.evaluation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Abilities list */}
                        <div className="flex flex-col gap-1.5">
                            {stats.abilities.map((ability: CharacterTypes.Ability) => (
                                <div
                                    key={ability.id}
                                    className="bg-white rounded-2xl px-3 py-1.5 flex flex-row items-center justify-between"
                                >
                                    <div className="flex flex-row items-center gap-1.5">
                                        <span className="text-xl">{ability.emoji}</span>
                                        <span className="text-black/75 font-bold text-xl">{ability.name}</span>
                                        <span className="text-black font-bold text-xl">{ability.value}</span>
                                    </div>
                                    <span className="text-black/50 text-xs font-medium">{ability.desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* Skills section */}
                        {stats.skills.length > 0 && (
                            <div className="-mx-4">
                                <div className="flex flex-row items-center gap-2 ml-6 mb-2.5">
                                    <span className="text-black font-bold text-lg">技能</span>
                                    <span className="text-black font-bold text-lg">{stats.skills.length}</span>
                                </div>
                                <div className="flex flex-row gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
                                    {stats.skills.map((skill: CharacterTypes.Skill) => (
                                        <div
                                            key={skill.id}
                                            className="bg-white rounded-2xl px-4 py-4 flex flex-col items-center justify-center gap-2 shrink-0"
                                            style={{ minWidth: 160 }}
                                        >
                                            <span className="text-black font-bold text-xl text-center">{skill.name}</span>
                                            <div className="border border-black rounded-full px-2 py-0.5">
                                                <span className="text-black text-xs font-bold">{skill.levelText}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollView>
            </div>
        </RenderParentProvider>
    );
});
