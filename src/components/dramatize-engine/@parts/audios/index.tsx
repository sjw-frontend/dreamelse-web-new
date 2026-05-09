import type { ReactNode } from 'react';

import { useInjectRenderController, useReactive } from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

import { DramatizeEngineController } from '$/component-controllers';

import { Audio } from './@parts';

export const Audios: ReactTypes.FC = optimize(() => {
    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        director: ctrl.state.narrative?.state.director,
        nextDirector: ctrl.state.nextNarrative?.state.director,
    }));

    // useMemo(() => {
    //     console.log('======new======');
    // }, [reactiveState.director]);
    // console.log('Audios====', reactiveState);

    const musics: LibTypes.VarArr<ReactNode> = [];

    if (reactiveState.director?.music?.element) {
        if (reactiveState.director.music.isChange) {
            if (reactiveState.director.music.prevElement) {
                musics.push(
                    <Audio
                        key={reactiveState.director.music.prevElement.id}
                        element={reactiveState.director.music.prevElement}
                        volumeFade
                        onReady={ctrl.elementReady}
                        onFinish={null}
                    />,
                );
            }
            musics.push(
                <Audio
                    key={reactiveState.director.music.element.id}
                    element={reactiveState.director.music.element}
                    volumeFade
                    onReady={ctrl.elementReady}
                    onFinish={null}
                />,
            );
        } else {
            musics.push(
                <Audio
                    key={reactiveState.director.music.element.id}
                    element={reactiveState.director.music.element}
                    volumeFade
                    onReady={ctrl.elementReady}
                    onFinish={null}
                />,
            );
        }
    } else if (reactiveState.director?.music?.prevElement) {
        musics.push(
            <Audio
                key={reactiveState.director.music.prevElement.id}
                element={reactiveState.director.music.prevElement}
                volumeFade
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );
    }

    if (
        reactiveState.nextDirector?.music?.isChange &&
        reactiveState.nextDirector.music.element
    ) {
        musics.push(
            <Audio
                key={reactiveState.nextDirector.music.element.id}
                element={reactiveState.nextDirector.music.element}
                volumeFade
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );
    }

    reactiveState.director?.ambient &&
        musics.push(
            <Audio
                key={reactiveState.director.ambient.id}
                element={reactiveState.director.ambient}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );

    reactiveState.director?.voiceFx &&
        musics.push(
            <Audio
                key={reactiveState.director.voiceFx.id}
                element={reactiveState.director.voiceFx}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );

    reactiveState.director?.captions.ttsElement &&
        musics.push(
            <Audio
                key={reactiveState.director.captions.ttsElement.id}
                element={reactiveState.director.captions.ttsElement}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={ctrl.ttsCaptionsFinish}
            />,
        );

    reactiveState.nextDirector?.ambient &&
        musics.push(
            <Audio
                key={reactiveState.nextDirector.ambient.id}
                element={reactiveState.nextDirector.ambient}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );

    reactiveState.nextDirector?.voiceFx &&
        musics.push(
            <Audio
                key={reactiveState.nextDirector.voiceFx.id}
                element={reactiveState.nextDirector.voiceFx}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );

    reactiveState.nextDirector?.captions.ttsElement &&
        musics.push(
            <Audio
                key={reactiveState.nextDirector.captions.ttsElement.id}
                element={reactiveState.nextDirector.captions.ttsElement}
                volumeFade={false}
                onReady={ctrl.elementReady}
                onFinish={null}
            />,
        );
    return <>{musics}</>;
});
