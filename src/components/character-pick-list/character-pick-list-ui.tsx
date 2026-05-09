// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { Button } from '$/uis/button/button-ui';
import { CharacterCard, CharacterCardEnum } from './@parts';
import { I18nTexts, Settings } from './character-pick-list-const';

export { CharacterCardEnum } from './@parts';

type CharacterPickListProps = LibTypes.FrozenDefine<{
    data: LibTypes.Arr<CharacterTypes.CharacterId>,
    selectId: CharacterTypes.CharacterId | null,
    cardType?: CharacterCardEnum,
    showAdd?: boolean,
    onClickAdd?: LibTypes.Func<void, []>,
    onEndReached?: LibTypes.SimpleFunction,
    onChange?: LibTypes.Func<void, [id: CharacterTypes.CharacterId | null]>,
    onConfirm?: LibTypes.Func<void, [id: CharacterTypes.CharacterId]>,
}>;

export const CharacterPickList: ReactTypes.FC<CharacterPickListProps> = optimize(({
    cardType,
    data,
    selectId,
    onEndReached,
    onChange,
    onConfirm,
    showAdd,
    onClickAdd,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const showConfirmButton = selectId != null;

    const handleCharacterPress = useCallback((id: CharacterTypes.CharacterId) => {
        if (selectId === id) {
            onChange?.(null);
        } else {
            onChange?.(id);
        }
    }, [selectId, onChange]);

    const handleConfirm = useCallback(() => {
        if (selectId != null) onConfirm?.(selectId);
    }, [selectId, onConfirm]);

    const renderData = useMemo(() => {
        if (showAdd) return [Settings.addCardId, ...data];
        return data;
    }, [data, showAdd]);

    // 数据变化时滚动到顶部
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [renderData[0]]);

    // 滚动到底部时触发 onEndReached
    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || !onEndReached) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
            onEndReached();
        }
    }, [onEndReached]);

    return (
        <div ref={containerRef} style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
                ref={listRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingTop: 6,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: showConfirmButton ? 88 : 16,
                }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 114px)',
                    columnGap: Math.max(0, (window.innerWidth - 32 - 114 * 3) / 2),
                    rowGap: 0,
                    justifyContent: 'space-between',
                }}>
                    {renderData.map(item => {
                        if (item === Settings.addCardId) {
                            return (
                                <button
                                    key={Settings.addCardId}
                                    type="button"
                                    onClick={onClickAdd}
                                    style={{
                                        width: 114, height: 160,
                                        borderRadius: 20,
                                        backgroundColor: '#1A1A1A',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </button>
                            );
                        }
                        return (
                            <CharacterCard
                                key={item}
                                showOwnerTag
                                showScriptTag
                                cardType={cardType}
                                id={item}
                                isSelected={selectId === item}
                                onPress={() => handleCharacterPress(item)}
                            />
                        );
                    })}
                </div>
            </div>

            {showConfirmButton && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#1A1A1A',
                    padding: 16,
                    height: 40,
                    borderRadius: 20,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <Button onPress={handleConfirm} kind="Primary" size="medium" className="w-full">
                        {I18nTexts.confirm}
                    </Button>
                </div>
            )}
        </div>
    );
});
