// @ts-nocheck
import { useMemo } from 'react';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { Settings } from './art-style-list-const';

export type ArtStyleListProps = LibTypes.FrozenDefine<{
    list: LibTypes.Arr<CharacterTypes.ArtStyle>,
    selectedArtStyleId?: string | null,
    style?: React.CSSProperties,
    onSelect?: (artStyle: CharacterTypes.ArtStyle) => void,
}>;

export const ArtStyleList: ReactTypes.FC<ArtStyleListProps> = optimize(
    ({ list, selectedArtStyleId, onSelect, style }) => {
        return (
            <div style={{
                width: '100%',
                padding: 12,
                borderRadius: 20,
                backgroundColor: '#1A1A1A',
                ...style,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 8,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    {list.map(artStyle => {
                        const isSelected = selectedArtStyleId === artStyle.id;
                        return (
                            <button
                                key={artStyle.id}
                                type="button"
                                onClick={() => onSelect?.(artStyle)}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0,
                                    padding: 0,
                                    border: isSelected ? '3px solid #fff' : '3px solid transparent',
                                    cursor: 'pointer',
                                    background: 'none',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: isSelected ? 10 : 0,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}>
                                    <img
                                        src={artStyle.icon.uri}
                                        alt={artStyle.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {/* 渐变遮罩 */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 43,
                                        background: `linear-gradient(to bottom, ${Settings.artStyleGradientColors[0]}, ${Settings.artStyleGradientColors[1]})`,
                                    }} />
                                    <span style={{
                                        position: 'absolute',
                                        bottom: 6,
                                        left: 0,
                                        right: 0,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#fff',
                                        textAlign: 'center',
                                    }}>
                                        {artStyle.name}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    },
);
