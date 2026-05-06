import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { HomeController } from './home-controller';
import { TopNavBar } from './@parts/top-nav-bar';
import { SearchPanel } from './@parts/search-panel';
import { TagFeedList } from './@parts/tag-feed-list';
import { CharacterFeedList } from './@parts/character-feed-list';

export const HomePage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(HomeController);

    const state = useReactive(() => ({
        openSearch: ctrl.state.openSearch,
        isTagMode: ctrl.state.isTagMode,
        isCharacterMode: ctrl.state.isCharacterMode,
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page overflow-hidden">
                <TopNavBar />
                {state.openSearch ? (
                    <SearchPanel />
                ) : state.isTagMode ? (
                    <TagFeedList />
                ) : (
                    <CharacterFeedList />
                )}
            </div>
        </RenderParentProvider>
    );
});
