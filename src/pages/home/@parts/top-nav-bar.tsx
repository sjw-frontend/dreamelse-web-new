import { useInjectRenderController, useReactive } from '$/hooks';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { HomeController } from '../home-controller';

export const TopNavBar = optimize(() => {
    const ctrl = useInjectRenderController(HomeController);

    const state = useReactive(() => ({
        isTagMode: ctrl.state.isTagMode,
        isCharacterMode: ctrl.state.isCharacterMode,
        openSearch: ctrl.state.openSearch,
    }));

    if (state.openSearch) return null;

    return (
        <div className="h-12 flex flex-row items-center justify-between px-4 shrink-0">
            {/* Search icon */}
            <button
                type="button"
                className="w-9 h-9 flex items-center justify-center cursor-pointer outline-none"
                onClick={ctrl.handleSearchPress}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Mode tabs */}
            <div className="flex flex-row items-center gap-6">
                <button
                    type="button"
                    className={cn(
                        'text-2xl font-semibold text-text-primary cursor-pointer outline-none transition-opacity duration-150',
                        state.isTagMode ? 'opacity-100' : 'opacity-30',
                    )}
                    onClick={() => ctrl.setMode('tag')}
                >
                    世界
                </button>
                <button
                    type="button"
                    className={cn(
                        'text-2xl font-semibold text-text-primary cursor-pointer outline-none transition-opacity duration-150',
                        state.isCharacterMode ? 'opacity-100' : 'opacity-30',
                    )}
                    onClick={() => ctrl.setMode('character')}
                >
                    和Ta玩
                </button>
            </div>

            {/* Me icon */}
            <button
                type="button"
                className="w-9 h-9 flex items-center justify-center cursor-pointer outline-none"
                onClick={ctrl.handleMePress}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
});
