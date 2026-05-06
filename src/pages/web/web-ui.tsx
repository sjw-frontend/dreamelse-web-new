import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';

import { WebController } from './web-controller';

export const WebPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(WebController);
    const state = useReactive(() => ({
        title: (ctrl.state as any).route?.params?.title as string ?? '',
        url: (ctrl.state as any).route?.params?.url as string ?? '',
    }));

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 15l-5-5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-text"
                            />
                        </svg>
                    </button>
                    {state.title ? (
                        <span className="text-text text-lg font-semibold truncate flex-1">
                            {state.title}
                        </span>
                    ) : null}
                </div>

                {/* iframe */}
                <div className="flex-1 overflow-hidden">
                    {state.url ? (
                        <iframe
                            src={state.url}
                            title={state.title}
                            className="w-full h-full border-none bg-bg-page"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-text/40 text-sm">暂无内容</span>
                        </div>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
