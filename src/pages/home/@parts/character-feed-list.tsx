import { useInjectRenderController, useReactive } from '$/hooks';
import { LockAreaImage } from '$/uis';
import { FileUtils } from '$/utils';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { HomeController } from '../home-controller';
import type { CharacterFeed } from '../home-controller';
import { CharacterFeed as CharacterFeedComponent } from './character-feed/character-feed-ui';

export const CharacterFeedList = optimize(() => {
    const ctrl = useInjectRenderController(HomeController);

    const state = useReactive(() => ({
        isCharacterMode: ctrl.state.isCharacterMode,
        playWithCharacterList: ctrl.state.playWithCharacterList,
        currentPlayWithId: ctrl.state.currentPlayWithId,
        characterFeedList: ctrl.state.characterFeedList,
    }));

    if (!state.isCharacterMode) return null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Character avatar horizontal scroll */}
            <div className="h-20 shrink-0 overflow-x-auto scrollbar-none">
                <div className="flex flex-row items-center justify-center gap-2.5 h-full px-4 min-w-full">
                    {state.playWithCharacterList.map((item: { id: string; image: { uri: string; width: number; height: number; face?: { leftTop: { x: number; y: number }; rightBottom: { x: number; y: number } } | null } }) => {
                        const isActive = item.id === state.currentPlayWithId;
                        const innerSize = isActive ? 54 : 60;
                        const faceInfo = FileUtils.getImageFaceInfo(item.image, { top: 0.25, left: 0.25, right: 0.25 });
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="shrink-0 cursor-pointer outline-none"
                                onClick={() => ctrl.changeCharacterFeedId(item.id)}
                            >
                                <div
                                    className={cn(
                                        'w-[63px] h-[63px] rounded-full flex items-center justify-center',
                                        'border-[3px] transition-colors duration-150',
                                        isActive ? 'border-white' : 'border-transparent',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'rounded-full overflow-hidden border border-white/20',
                                            isActive ? 'w-[54px] h-[54px]' : 'w-[60px] h-[60px]',
                                        )}
                                    >
                                        <LockAreaImage
                                            image={item.image}
                                            area={faceInfo.face}
                                            rect={faceInfo.rect}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feed per character — only the active one renders content */}
            {state.characterFeedList.map((feed: CharacterFeed) => (
                <CharacterFeedComponent key={feed.id} id={feed.id} />
            ))}
        </div>
    );
});
