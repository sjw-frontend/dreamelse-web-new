import { useInjectRenderController, useReactive } from '$/hooks';
import { Search } from '$/uis/search/search-ui';
import { ScriptWaterfallV2 } from '$/components/script-waterfall-v2/script-waterfall-v2-ui';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { useWaterfallContentWidth } from '../@com/use-waterfall-content-width';
import { HomeController } from '../home-controller';

export const SearchPanel = optimize(() => {
    const ctrl = useInjectRenderController(HomeController);

    const state = useReactive(() => ({
        openSearch: ctrl.state.openSearch,
        searchText: ctrl.state.searchText,
        searchPlaceholder: ctrl.state.searchPlaceholder,
        searchScriptIds: ctrl.state.searchScriptIds,
    }));

    const contentWidth = useWaterfallContentWidth();

    if (!state.openSearch) return null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden mx-2">
            {/* Search header */}
            <div className="flex flex-row items-center gap-2 h-12 px-2 shrink-0">
                <button
                    type="button"
                    className="w-9 h-9 flex items-center justify-center cursor-pointer outline-none shrink-0"
                    onClick={ctrl.closeSearch}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <Search
                    className="flex-1 h-10 border-2"
                    value={state.searchText}
                    placeholder={state.searchPlaceholder || '搜索剧本...'}
                    onSearch={ctrl.search}
                    onChangeText={ctrl.setSearchText}
                    autoFocus
                />
            </div>

            {/* Search results waterfall */}
            <ScriptWaterfallV2
                scriptIds={state.searchScriptIds}
                itemContentWidth={contentWidth}
                onEndReached={ctrl.requestSearch}
                onPressItem={ctrl.onPressScript}
                bottomRightButton="collect"
                sceneKey="search"
            />
        </div>
    );
});
