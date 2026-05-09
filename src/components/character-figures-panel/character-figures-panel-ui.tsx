// @ts-nocheck
import { useMemo, useState } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { Settings } from './character-figures-panel-const';
import { CharacterFiguresPanelController } from './character-figures-panel-controller';

type Props = LibTypes.FrozenDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    writable?: boolean,
    style?: React.CSSProperties,
}>;

export const CharacterFiguresPanel: ReactTypes.FC<Props> = optimize(props => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        CharacterFiguresPanelController,
        { data: props.data, writable: !!props.writable },
    );

    const reactiveState = useReactive(() => ({
        dataState: { ...ctrl.state.data.state },
        expanded: ctrl.state.expanded,
        writable: ctrl.state.writable,
        loadingMap: ctrl.state.loadingMap,
    }));

    useMemo(() => { ctrl.setData(props.data); }, [props.data]);

    const figuresList = useMemo(
        () => reactiveState.dataState.currentFigures ?? [],
        [reactiveState.dataState.currentFigures],
    );

    const displayList = useMemo(
        () => reactiveState.expanded ? figuresList : figuresList.slice(0, Settings.maxDisplayCount),
        [reactiveState.expanded, figuresList],
    );

    const showExpandButton = figuresList.length > Settings.maxDisplayCount;

    return (
        <RenderParentProvider>
            <div style={{
                position: 'relative',
                maxHeight: 372,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                ...props.style,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 6,
                    overflowY: 'auto',
                    maxHeight: 372,
                    scrollbarWidth: 'none',
                }}>
                    {displayList.map(figure => {
                        const isSelected = reactiveState.dataState.currentViewFigureId === figure.id;
                        const isLoading = reactiveState.writable && reactiveState.loadingMap[figure.id] === true;
                        const showEditButton = reactiveState.writable && isSelected;

                        return (
                            <button
                                key={figure.id}
                                type="button"
                                onClick={() => ctrl.selectFigure(figure.id)}
                                style={{
                                    height: 36,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    position: 'relative',
                                }}
                            >
                                {showEditButton && (
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); ctrl.editFigure(figure); }}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            backgroundColor: '#1A1A1A',
                                            border: '0.389px solid rgba(255,255,255,0.15)',
                                            borderRadius: 31.111,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: 7.778,
                                            marginRight: 13,
                                            cursor: 'pointer',
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        <svg width="12.444" height="12.444" viewBox="0 0 14 14" fill="none">
                                            <path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                )}
                                <div style={{ width: 52, position: 'relative' }}>
                                    <span style={{
                                        fontSize: 14,
                                        lineHeight: '30px',
                                        fontWeight: 500,
                                        color: isSelected ? '#EDEDED' : 'rgba(255,255,255,0.4)',
                                        textAlign: 'center',
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {figure.name}
                                    </span>
                                    {isSelected && (
                                        // 选中下划线：渐变 transparent → black → transparent
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: 1,
                                            background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1), rgba(0,0,0,0))',
                                        }} />
                                    )}
                                </div>
                                {isLoading && (
                                    <div style={{
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: -4,
                                    }}>
                                        {/* CSS spinner 替代 LottieView loading */}
                                        <div style={{
                                            width: 12,
                                            height: 12,
                                            border: '1.5px solid rgba(255,255,255,0.2)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {showExpandButton && (
                    <button
                        type="button"
                        onClick={ctrl.toggleExpanded}
                        style={{
                            height: 36,
                            paddingLeft: 8,
                            paddingRight: 8,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 12,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'absolute',
                            bottom: -30,
                            right: 0,
                        }}
                    >
                        <svg
                            width="28"
                            height="20"
                            viewBox="0 0 28 20"
                            fill="none"
                            style={{
                                transform: reactiveState.expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                            }}
                        >
                            <path d="M4 6l10 8 10-8" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>
        </RenderParentProvider>
    );
});
