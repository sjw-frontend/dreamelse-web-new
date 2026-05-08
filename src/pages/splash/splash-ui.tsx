import { useRegisterRenderController, useReactive } from '$/hooks';
import { ActivityIndicator } from '$/uis/primitives';
import { optimize } from '$/view';

import { SplashController } from './splash-controller';

export const SplashPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(SplashController);
    // SplashController state has no reactive fields needed for display,
    // but we subscribe to keep the pattern consistent.
    useReactive(() => ctrl.state);

    return (
        <RenderParentProvider>
            <div className="flex flex-col items-center justify-center w-full h-full bg-[#0D0D0D]">
                <img src="/assets/images/logo.png" alt="演我" style={{ width: 112, height: 112 }} />
                <h1
                    className="text-5xl font-semibold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    演我
                </h1>
                <p className="mt-3 text-sm text-text-secondary tracking-widest">
                    Be who you want to be
                </p>
                <div className="mt-10">
                    <ActivityIndicator size="large" color="#ABFF1A" />
                </div>
            </div>
        </RenderParentProvider>
    );
});
