import { optimize } from '$/view';

export const TheaterCharacterCreatedPage = optimize(() => (
    <div className="flex flex-col h-full bg-bg-page items-center justify-center gap-6 px-8">
        {/* Celebration icon */}
        <div className="w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center">
            <span className="text-5xl">🎉</span>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-text text-2xl font-semibold">角色创建成功！</h1>
            <p className="text-text/60 text-sm leading-relaxed">
                你的专属角色已经准备好了，快去开始你的演绎之旅吧。
            </p>
        </div>

        <button
            type="button"
            className="mt-2 w-full max-w-xs h-14 rounded-2xl bg-brand-green text-black text-lg font-semibold active:opacity-80 transition-opacity"
        >
            继续
        </button>
    </div>
));
