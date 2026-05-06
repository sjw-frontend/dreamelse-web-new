import { useMemo } from 'react';
import { useInjectRenderController, useReactive } from '$/hooks';
import { TagSelect, type TagSelectOption } from '$/uis/tag-select/tag-select-ui';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { HomeController } from '../home-controller';
import type { TagFeed } from '../home-controller';
import { TagFeed as TagFeedComponent } from './tag-feed/tag-feed-ui';

export const TagFeedList = optimize(() => {
    const ctrl = useInjectRenderController(HomeController);

    const state = useReactive(() => ({
        isTagMode: ctrl.state.isTagMode,
        tagFeedList: ctrl.state.tagFeedList,
        currentTagFeedId: ctrl.state.currentTagFeedId,
    }));

    const tags = useMemo(
        () =>
            state.tagFeedList.map<TagSelectOption<string>>((item: TagFeed) => ({
                value: item.id,
                label: item.isAll ? '全部' : item.title,
            })),
        [state.tagFeedList],
    );

    if (!state.isTagMode) return null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden mx-2">
            {/* Tag select bar */}
            <div className="shrink-0 px-2 py-2">
                <TagSelect
                    options={tags}
                    value={state.currentTagFeedId}
                    onChange={ctrl.changeTagFeedId}
                />
            </div>

            {/* Feed per tag — only the active one renders content */}
            {state.tagFeedList.map((feed: TagFeed) => (
                <TagFeedComponent key={feed.id} id={feed.id} />
            ))}
        </div>
    );
});
