// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from 'react';
import { CharacterController } from '$/controllers';
import {
    useInjectRenderController,
    usePopup,
    useReactive,
    useZoneController,
} from '$/hooks';
import { Button } from '$/uis/button/button-ui';
import { optimize } from '$/view';
import { CharacterCreateController } from '../../character-create-controller';
import { AbilityBar } from './@parts';
import { I18nTexts, Settings } from './create-form-const';

export const CreateForm = optimize(() => {
    const popup = usePopup();
    const characterCtrl = useZoneController(CharacterController);
    const ctrl = useInjectRenderController(CharacterCreateController);

    const reactiveState = useReactive(() => ({
        newOne: ctrl.state.newData,
        abilities: ctrl.state.newData.state.initial?.abilities ?? [],
        allowSubmit: ctrl.state.allowSubmit,
        isInteracting: ctrl.state.isInteracting,
        sortedAbilities: ctrl.state.sortedAbilities,
        sortIndex: ctrl.state.sortIndex,
        isCustom: ctrl.state.isCustom,
        waitCharacterSoulLoadingTextList: characterCtrl.state.waitCharacterSoulLoadingTextList,
        desc: ctrl.state.newData.state.desc ?? '',
    }), { deep: true });

    const [scrollEnabled, setScrollEnabled] = useState(true);
    const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLongPressStart = useCallback(() => setScrollEnabled(false), []);
    const handleLongPressEnd = useCallback(() => setScrollEnabled(true), []);

    const reorderAbilities = useCallback(() => {
        const sorted = [...reactiveState.abilities].sort((a, b) => b.percent - a.percent);
        const newSortedIndex: Record<string, number> = {};
        const result = sorted.map((ability, index) => {
            newSortedIndex[ability.id] = index;
            return { ability, rankPosition: index };
        });
        ctrl.setSortedAbilities(result);
        ctrl.setSortIndex(newSortedIndex);
        ctrl.updateSoulsEvaluation();
    }, [reactiveState.abilities]);

    const updateAbilitiesWithCurrentOrder = useCallback(() => {
        const sorted = [...reactiveState.abilities].sort((a, b) => {
            const indexA = reactiveState.sortIndex[a.id] ?? 0;
            const indexB = reactiveState.sortIndex[b.id] ?? 0;
            return indexA - indexB;
        });
        ctrl.setSortedAbilities(sorted.map((ability, index) => ({ ability, rankPosition: index })));
    }, [reactiveState.abilities, reactiveState.sortIndex]);

    const handleValueChange = useCallback((id: string) => {
        if (!reactiveState.isInteracting) {
            ctrl.setIsInteracting(true);
            const currentSortIndex: Record<string, number> = {};
            reactiveState.sortedAbilities.forEach((item, index) => {
                currentSortIndex[item.ability.id] = index;
            });
            ctrl.setSortIndex(currentSortIndex);
        }
        ctrl.increaseAbilityValue(id);
        updateAbilitiesWithCurrentOrder();

        if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
        interactionTimeoutRef.current = setTimeout(() => {
            ctrl.setIsInteracting(false);
            ctrl.roundAbilitiesValue(id);
            reorderAbilities();
        }, 500);
    }, [reactiveState.isInteracting, reactiveState.sortedAbilities, updateAbilitiesWithCurrentOrder, reorderAbilities]);

    const containerHeight = useMemo(() => {
        const count = reactiveState.abilities.length;
        // 对齐 app：count * 44 + (count-1) * 8 + 20，44 = tag height(36) + gap(8)
        return count * 44 + (count - 1) * 8 + 20;
    }, [reactiveState.abilities.length]);

    const generateFromSoul = useCallback(async () =>
        popup.longTask(ctrl.generateFromSoul, {
            content: reactiveState.waitCharacterSoulLoadingTextList,
        }), []);

    if (!reactiveState.isCustom) return null;

    return (
        <div style={{
            flex: 1,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: scrollEnabled ? 'auto' : 'hidden',
                paddingBottom: 16,
            }}>
                <div style={{
                    position: 'relative',
                    marginTop: 20,
                    height: containerHeight,
                }}>
                    {reactiveState.sortedAbilities.map(({ ability, rankPosition }) => (
                        <AbilityBar
                            key={`ability-item-${ability.id}`}
                            ability={ability}
                            rankPosition={rankPosition}
                            onValueChange={handleValueChange}
                            onLongPressStart={handleLongPressStart}
                            onLongPressEnd={handleLongPressEnd}
                        />
                    ))}
                </div>

                {/* CharacterDesc — 对齐 app desc: borderWidth 0 */}
                <div style={{ marginTop: 16, width: '100%', marginBottom: 16 }}>
                    <textarea
                        value={reactiveState.desc}
                        maxLength={Settings.descMaxLength}
                        placeholder={I18nTexts.descPlaceholder}
                        onChange={e => {
                            characterCtrl.setCharacterState(
                                reactiveState.newOne.id,
                                'desc',
                                e.target.value,
                                false,
                            );
                        }}
                        style={{
                            width: '100%',
                            minHeight: 80,
                            background: 'rgba(255,255,255,0.06)',
                            border: 'none',
                            borderRadius: 12,
                            padding: '10px 14px',
                            color: '#EDEDED',
                            fontSize: 14,
                            lineHeight: 1.6,
                            outline: 'none',
                            resize: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* 对齐 app bottomContainer: alignItems center, Button 撑满 */}
            <div style={{ width: '100%', paddingBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Button
                    kind="Black"
                    disabled={!reactiveState.allowSubmit}
                    onPress={generateFromSoul}
                    size="medium"
                    className="w-full"
                >
                    {I18nTexts.ok}
                </Button>
            </div>
        </div>
    );
});
