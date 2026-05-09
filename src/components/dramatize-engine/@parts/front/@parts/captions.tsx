import { useCallback, useEffect, useRef, useState } from 'react';

import { ASSETS, DRAMATIZE } from '$/consts';
import {
    useInjectRenderController,
    usePopup,
    useReactive,
} from '$/hooks';
import type { ReactTypes } from '$/types';
import { StringUtils } from '$/utils';
import { optimize } from '$/view';

import { calculateCaptionsDelayMS } from '../../../@com';
import { BlurBackground, SmoothTypewriter } from '../../../@uis';
import { DramatizeEngineController } from '$/component-controllers';

export const Captions: ReactTypes.FC = optimize(() => {
    const popup = usePopup();

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        play: ctrl.state.play,
        speed: ctrl.state.speed,
        show: ctrl.state.narrative?.state.showCaptions,
        allowNext:
            !ctrl.state.narrative?.state.director?.interaction &&
            !ctrl.state.isWorldLineEnd,
        roleName: ctrl.state.narrative?.state.director?.captions?.roleName,
        text: ctrl.state.narrative?.state.director?.captions?.text ?? '',
        isMe: ctrl.state.narrative?.state.director?.captions?.isMe,
        hasTTS: !!ctrl.state.narrative?.state.director?.captions?.ttsElement,
    }));

    const [forceTypingComplete, setForceTypingComplete] = useState(false);

    const timerRef = useRef<ReturnType<typeof ctrl.createTimedTask>>(null);

    const onTypingComplete = useCallback(() => {
        if (!reactiveState.hasTTS) {
            if (!forceTypingComplete) {
                ctrl.textCaptionsFinish();
            } else {
                timerRef.current = ctrl.createTimedTask(() => {
                    ctrl.textCaptionsFinish(true);
                }, calculateCaptionsDelayMS(reactiveState.text));
            }
        }
    }, [forceTypingComplete, reactiveState.hasTTS, reactiveState.text]);

    const handleNext = useCallback(() => {
        if (forceTypingComplete) {
            if (reactiveState.allowNext) {
                if (ctrl.state.nextNarrative?.state.isReady) {
                    ctrl.textCaptionsFinish(true);
                } else {
                    popup.showToast('剧情加载中...');
                }
            } else {
                ctrl.textCaptionsFinish(true);
            }
        } else {
            setForceTypingComplete(true);
        }
    }, [forceTypingComplete, reactiveState.allowNext]);

    const hasTitle = !StringUtils.isEmpty(reactiveState.roleName);

    useEffect(() => timerRef.current?.clear(), []);

    if (!reactiveState.show) {
        return null;
    }

    return (
        <BlurBackground
            style={{
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 12,
                paddingBottom: 12,
                width: '100%',
            } as React.CSSProperties}
        >
            <div onClick={handleNext} style={{ cursor: 'pointer' }}>
                {/* title row */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 34,
                        position: 'relative',
                    }}
                >
                    {hasTitle && (
                        <span
                            style={{
                                color: '#EDEDED',
                                fontWeight: 800,
                                fontSize: 24,
                                flex: 1,
                                borderBottom: '1px solid rgba(255,255,255,0.5)',
                                height: 34,
                                lineHeight: '34px',
                                textAlign: reactiveState.isMe ? 'right' : 'left',
                                fontFamily: 'MiSans, Inter, sans-serif',
                            }}
                        >
                            {reactiveState.roleName}
                        </span>
                    )}
                    {reactiveState.allowNext && (
                        <div
                            style={{
                                height: 34,
                                paddingLeft: 15,
                                display: 'flex',
                                alignItems: 'center',
                                position: 'absolute',
                                right: 0,
                            }}
                        >
                            <img
                                src={ASSETS.Dramatize.next}
                                alt=""
                                style={{ width: 20, height: 20 }}
                            />
                        </div>
                    )}
                </div>
                {/* typewriter text */}
                <SmoothTypewriter
                    typingSpeedMS={DRAMATIZE.TextDisplayTimePerCharMS}
                    text={reactiveState.text}
                    textStyle={{
                        fontWeight: hasTitle ? 600 : 900,
                        fontSize: hasTitle ? 20 : 24,
                        color: '#EDEDED',
                        fontFamily: hasTitle ? undefined : 'MiSans, Inter, sans-serif',
                    }}
                    lineCount={3}
                    lineHeight={hasTitle ? 24 : 38}
                    onComplete={onTypingComplete}
                    play={reactiveState.play}
                    speed={reactiveState.speed}
                    isComplete={forceTypingComplete}
                    startLineIndex={1}
                />
            </div>
        </BlurBackground>
    );
});
