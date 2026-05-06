import { optimize } from '$/view';

export const TheaterPage = optimize(() => (
    <div className="flex flex-col h-full bg-bg-page">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
            <span className="text-text text-xl font-semibold">剧场</span>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-3xl">🎭</span>
            </div>
            <span className="text-text/40 text-sm">暂无剧本</span>
        </div>
    </div>
));
