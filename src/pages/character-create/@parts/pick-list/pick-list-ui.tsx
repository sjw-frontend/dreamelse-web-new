// @ts-nocheck
import { useCallback } from 'react';
import { useInjectRenderController, useReactive } from '$/hooks';
import { Search } from '$/uis/search/search-ui';
import { optimize } from '$/view';
import { CharacterPickList } from '$/components/character-pick-list';
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
            {/* 标签过滤 + 搜索 */}
            <div style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
            }}>
                {reactiveState.showSearch ? (
                    <>
                        <div style={{ flex: 1 }}>
                            <Search
                                value={reactiveState.searchKeyword}
                                onChange={ctrl.setSearchKeyword}
                                onSearch={handleSearch}
                                placeholder={I18nTexts.searchPlaceholder}
                                autoFocus
                            />
                        </div>
                        <button
                            type="button"
                            onClick={ctrl.hideSearch}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: 14,
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: '4px 8px',
                            }}
                        >
                            取消
                        </button>
                    </>
                ) : (
                    <>
                        {/* 标签横向滚动 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 8,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                        }}>
                            {/* 全部 */}
                            <button
                                type="button"
                                onClick={() => handleTagPress(null)}
                                style={{
                                    flexShrink: 0,
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    backgroundColor: reactiveState.currentTagId == null
                                        ? 'rgba(255,255,255,0.9)'
                                        : 'rgba(255,255,255,0.1)',
                                    color: reactiveState.currentTagId == null ? '#000' : 'rgba(255,255,255,0.7)',
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
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        backgroundColor: reactiveState.currentTagId === tag.id
                                            ? 'rgba(255,255,255,0.9)'
                                            : 'rgba(255,255,255,0.1)',
                                        color: reactiveState.currentTagId === tag.id ? '#000' : 'rgba(255,255,255,0.7)',
                                    }}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                        {/* 搜索图标 */}
                        <button
                            type="button"
                            onClick={ctrl.showSearch}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                color: 'rgba(255,255,255,0.6)',
                                flexShrink: 0,
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* 角色网格 */}
            <CharacterPickList
                data={reactiveState.pickList}
                selectId={reactiveState.selectId}
                onChange={ctrl.selectCharacter}
                onConfirm={ctrl.confirmSelection}
                onEndReached={ctrl.requestPickListNext}
            />
        </div>
    );
});
