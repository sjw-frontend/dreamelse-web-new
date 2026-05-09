// @ts-nocheck
import { useCallback } from 'react';
import { useInjectRenderController, useReactive } from '$/hooks';
import { Search } from '$/uis/search/search-ui';
import { optimize } from '$/view';
import { CharacterCardEnum, CharacterPickList } from '$/components/character-pick-list';
import { CharacterCreateController } from '../../character-create-controller';
import { I18nTexts } from './pick-list-const';

export const PickList = optimize(() => {
    const ctrl = useInjectRenderController(CharacterCreateController);

    const reactiveState = useReactive(() => ({
        isPick: ctrl.state.isPick,
        pickList: ctrl.state.pickList,
        selectId: ctrl.state.selectId,
        showSearch: ctrl.state.showSearch,
        searchKeyword: ctrl.state.searchKeyword,
        defaultConfig: ctrl.state.defaultConfig,
        currentTagId: ctrl.state.currentTagId,
    }));

    const handleTagPress = useCallback((tagId: string | null) => {
        ctrl.setCurrentTagId(tagId);
    }, []);

    const handleSearch = useCallback(() => {
        ctrl.search();
    }, []);

    if (!reactiveState.isPick) return null;

    const tags = reactiveState.defaultConfig?.searchTagList ?? [];

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* 标签过滤 + 搜索，对齐 app filterContainer: paddingHorizontal 16, paddingVertical 10 */}
            <div style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flexShrink: 0,
            }}>
                {reactiveState.showSearch ? (
                    /* 搜索模式：高度 36，对齐 app searchContainer */
                    <div style={{
                        flex: 1,
                        height: 36,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        {/* 搜索框容器：对齐 app searchInputContainer backgroundColor bgCard + borderWidth 2 */}
                        <div style={{
                            flex: 1,
                            height: '100%',
                            backgroundColor: '#1A1A1A',
                            border: '2px solid rgba(255,255,255,0.15)',
                            borderRadius: 18,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 8,
                            paddingRight: 8,
                            gap: 6,
                        }}>
                            {/* searchBoxIcon 20×20 opacity 0.3 */}
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                                <circle cx="9" cy="9" r="6" stroke="#fff" strokeWidth="1.5" />
                                <path d="M13.5 13.5L17 17" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                value={reactiveState.searchKeyword}
                                onChange={e => ctrl.setSearchKeyword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder={I18nTexts.searchPlaceholder}
                                autoFocus
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#EDEDED',
                                    fontSize: 16,
                                    fontWeight: 500,
                                    lineHeight: '20px',
                                    padding: 0,
                                }}
                            />
                        </div>
                        {/* 关闭按钮：对齐 app closeCircle 图标 18×18 */}
                        <button
                            type="button"
                            onClick={ctrl.hideSearch}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 标签横向滚动，对齐 app filterTags: flex 1 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 8,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                        }}>
                            {/* 全部 tag */}
                            <button
                                type="button"
                                onClick={() => handleTagPress(null)}
                                style={{
                                    flexShrink: 0,
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    // 对齐 app tagItemStyle / tagItemSelectedStyle
                                    backgroundColor: 'rgba(0,0,0,0)',
                                    border: reactiveState.currentTagId == null
                                        ? '1px solid #fff'
                                        : '1px solid rgba(0,0,0,0.20)',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    // 对齐 app tagTextStyle: textPrimary（白色）
                                    color: '#fff',
                                }}
                            >
                                全部
                            </button>
                            {tags.map((tag: any) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleTagPress(tag.id)}
                                    style={{
                                        flexShrink: 0,
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(0,0,0,0)',
                                        border: reactiveState.currentTagId === tag.id
                                            ? '1px solid #fff'
                                            : '1px solid rgba(0,0,0,0.20)',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#fff',
                                    }}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>

                        {/* 搜索图标：对齐 app searchIconContainer 36×36 */}
                        <button
                            type="button"
                            onClick={ctrl.showSearch}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                width: 36,
                                height: 36,
                                borderRadius: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
                            {/* 对齐 app searchIcon 24×24 */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* 角色网格，对齐 app: cardType={CharacterCardEnum.halfRound} */}
            <CharacterPickList
                data={reactiveState.pickList}
                selectId={reactiveState.selectId}
                cardType={CharacterCardEnum.halfRound}
                onChange={ctrl.selectCharacter}
                onConfirm={ctrl.confirmSelection}
                onEndReached={ctrl.requestPickListNext}
            />
        </div>
    );
});
