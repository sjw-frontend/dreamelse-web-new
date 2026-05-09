import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { Pressable, ScrollView } from '$/uis/primitives';
import type { CharacterTypes } from '$/types';
import { CharacterTimbreListController } from './character-timbre-list-controller';

export const CharacterTimbreListPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterTimbreListController);

    const state = useReactive(
        () => ({
            selectId: ctrl.state.data?.state.currentTimbreId,
            timbres: ctrl.state.data?.state.timbres ?? [],
        }),
        { deep: true },
    );

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 shrink-0" style={{ borderBottom: '0.5px solid rgba(11,20,38,0.13)' }}>
                    <Pressable
                        onPress={ctrl.handleBack}
                        className="w-9 h-9 flex items-center justify-center"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>
                    <span className="flex-1 text-center text-text-primary font-semibold text-xl">音色</span>
                    <div className="w-9" />
                </div>

                {/* Timbre list */}
                <ScrollView className="flex-1">
                    <div className="flex flex-col">
                        {state.timbres.map((timbre: CharacterTypes.Timbre) => {
                            const isSelected = state.selectId != null && timbre.id === state.selectId;
                            return (
                                <Pressable
                                    key={timbre.id}
                                    onPress={() => ctrl.selectTimbre(timbre)}
                                    className="flex flex-row items-center gap-3 mx-4 py-4"
                                    style={{ borderBottom: '0.5px solid rgba(11,20,38,0.13)' }}
                                >
                                    {/* Icon with play overlay */}
                                    <div className="w-15 h-15 rounded-xl overflow-hidden relative shrink-0" style={{ width: 60, height: 60 }}>
                                        {timbre.icon?.uri ? (
                                            <img
                                                src={timbre.icon.uri}
                                                alt={timbre.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/10" />
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-white/10" />
                                        {/* Play icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M6 4l10 6-10 6V4z" fill="white" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Name and labels */}
                                    <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                                        <span className="text-text-primary font-semibold text-lg">{timbre.name}</span>
                                        {timbre.labels.length > 0 && (
                                            <div className="flex flex-row flex-wrap gap-1">
                                                {timbre.labels.map((label: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="h-6 px-1.5 rounded-lg bg-white/6 flex items-center justify-center"
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                                                    >
                                                        <span className="text-black/75 text-sm font-medium leading-none">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8l4 4 6-7" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </Pressable>
                            );
                        })}
                    </div>
                </ScrollView>
            </div>
        </RenderParentProvider>
    );
});
