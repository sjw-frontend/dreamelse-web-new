import { useCallback, useEffect, useRef, useState } from 'react';

import { ASSETS } from '$/consts';
import {
    useI18n,
    useInjectRenderController,
    useReactive,
} from '$/hooks';
import type { FileTypes, ReactTypes } from '$/types';
import { ScrollText } from '$/uis';
import { MathUtils, StringUtils, TimerUtils } from '$/utils';
import { optimize } from '$/view';

import { ReplaySelectTimeoutMS } from '../../../@com';
import {
    Countdown,
    CurvedGradientText,
    OptionList,
} from '../../../@uis';
import { I18nTexts, Settings } from '../../../dramatize-engine-const';
import { DramatizeEngineController } from '$/component-controllers';

export type OptionsProps = LibTypes.FrozenDefine<{
    showChatInput?: boolean,
    chatInputExtraStuffHeight?: number,
}>;

export const Options: ReactTypes.FC<OptionsProps> = optimize(
    ({
        showChatInput = true,
        chatInputExtraStuffHeight = Settings.defaultChatInputExtraStuffHeight,
    }) => {
        const i18n = useI18n(I18nTexts);

        const [isInputing, setIsInputing] = useState(false);

        const ctrl = useInjectRenderController(DramatizeEngineController);

        const reactiveState = useReactive(() => {
            const narrative = ctrl.state.narrative;
            return {
                show: narrative?.state.showInteraction,
                value: narrative?.state.interactionValue,

                isWorldLineEnd: ctrl.state.isWorldLineEnd,
                isReplay: ctrl.state.isReplay,
                isInteractPause:
                    !ctrl.state.isInteractStandby || !ctrl.state.play,
                play: ctrl.state.play,

                narrativeId: narrative?.state.narrativeId,
                options: narrative?.state.director.interaction?.options ?? [],
                timeoutMS: narrative?.state.director.interaction?.timeoutMS,
                get showCountDown() {
                    return this.timeoutMS != null;
                },
                timeoutValue:
                    narrative?.state.director.interaction?.timeoutValue,

                achievement: narrative?.state.director.interaction?.achievement,
                discovered: narrative?.state.director.interaction?.discovered,
                isEnd: narrative?.state.director.interaction?.isEnd,

                lastValue:
                    narrative?.state.director.interaction?.lastValue ?? null,
                get lastSelectOption() {
                    return this.options.find(
                        (item: { value: string }) => item.value === this.lastValue,
                    );
                },
            };
        });

        const [images, setImages] = useState<
            LibTypes.Arr<FileTypes.ImageResource>
        >([]);

        const [inputText, setInputText] = useState('');

        const handleInteract = useCallback(
            async (value: string) => {
                if (reactiveState.narrativeId != null) {
                    await ctrl.interact(reactiveState.narrativeId, value);
                }
            },
            [reactiveState.narrativeId],
        );

        const onSelect = useCallback(
            (option: { value: string }) => {
                handleInteract(option.value);
            },
            [handleInteract],
        );

        const onCountdownComplete = useCallback(() => {
            handleInteract(reactiveState.timeoutValue ?? '');
        }, [handleInteract, reactiveState.timeoutValue]);

        const onSubmitInput = useCallback(
            (text: string) => {
                if (!StringUtils.isEmpty(text.trim())) {
                    handleInteract(text.trim());
                    setInputText('');
                }
            },
            [handleInteract],
        );

        const handleInputFocus = useCallback(() => {
            ctrl.interacting();
            setIsInputing(true);
        }, []);

        const handleInputBlur = useCallback(() => {
            ctrl.interactStandby();
            setIsInputing(false);
        }, []);

        useEffect(() => {
            if (
                reactiveState.narrativeId != null &&
                !reactiveState.isEnd &&
                reactiveState.achievement
            ) {
                ctrl.requestAchievementImages(reactiveState.narrativeId).then(
                    (data: LibTypes.Arr<FileTypes.ImageResource>) => setImages(data),
                );
            }
        }, [
            reactiveState.isEnd,
            reactiveState.narrativeId,
            reactiveState.achievement,
        ]);

        const countDownControlRef =
            useRef<ReturnType<typeof TimerUtils.createTimedTask>>(null);

        useEffect(() => {
            if (
                reactiveState.show &&
                !reactiveState.isWorldLineEnd &&
                reactiveState.isReplay &&
                reactiveState.lastValue != null &&
                !reactiveState.showCountDown
            ) {
                countDownControlRef.current = TimerUtils.createTimedTask(
                    async () => handleInteract(reactiveState.lastValue ?? ''),
                    reactiveState.timeoutMS ?? ReplaySelectTimeoutMS,
                    {
                        isSuspended: reactiveState.isInteractPause,
                    },
                );
            }

            return () => {
                countDownControlRef.current?.clear();
                countDownControlRef.current = null;
            };
        }, [
            reactiveState.show,
            reactiveState.lastValue,
            reactiveState.isReplay,
            reactiveState.showCountDown,
            reactiveState.isInteractPause,
            handleInteract,
        ]);

        useEffect(() => {
            if (reactiveState.isInteractPause) {
                countDownControlRef.current?.suspend();
            } else {
                countDownControlRef.current?.resume();
            }
        }, [reactiveState.isInteractPause]);

        useEffect(() => {
            if (reactiveState.show && reactiveState.value != null) {
                handleInteract(reactiveState.value);
            }
        }, [reactiveState.show, reactiveState.value, handleInteract]);

        useEffect(() => {
            if (reactiveState.show && reactiveState.isEnd) {
                ctrl.end();
            }
        }, [reactiveState.show, reactiveState.isEnd]);

        if (!reactiveState.show) {
            return null;
        }

        if (reactiveState.isEnd) {
            return (
                <div style={{ position: 'absolute', inset: 0 }}>
                    {ASSETS.Dramatize.death && (
                        <img src={ASSETS.Dramatize.death} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                </div>
            );
        }

        if (reactiveState.isWorldLineEnd && !reactiveState.isReplay) {
            return null;
        }

        if (reactiveState.value != null) {
            return (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    {/* background */}
                    {reactiveState.achievement ? (
                        <img src={ASSETS.Dramatize.achievement} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)' }} />
                    )}
                    {/* top area */}
                    <div style={{ height: '36%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch' }}>
                        {reactiveState.achievement && (
                            <CurvedGradientText text={reactiveState.achievement.title} />
                        )}
                        {images.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                                {images.map((item, index) => (
                                    <img key={index} src={item.uri} alt="" style={{ height: 107, width: 60, objectFit: 'contain' }} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 32 }}>✨</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* result title */}
                    <div style={{ marginTop: 35, minHeight: 200, marginLeft: 48, marginRight: 48 }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, textAlign: 'center', fontWeight: 400, margin: 0 }}>
                            {i18n.youSelect()}
                        </p>
                        <ScrollText text={reactiveState.value} style={{ fontSize: 24, fontWeight: 500, textAlign: 'center', color: 'rgba(255,255,255,1)' }} />
                    </div>
                    {/* discovered */}
                    {reactiveState.discovered && reactiveState.discovered.length > 0 && (
                        <div style={{ marginLeft: 53, marginRight: 53 }}>
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ height: 1, width: 54, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, marginLeft: 10, marginRight: 10 }}>解锁彩蛋</span>
                                <div style={{ height: 1, width: 54, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                            </div>
                            <p style={{ marginTop: 15, color: 'rgba(255,255,255,1)', fontWeight: 400, fontSize: 16, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                                {reactiveState.discovered[0]}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div style={{ marginTop: 12, paddingLeft: 16, paddingRight: 16, alignSelf: 'stretch' as const }}>
                {/* countdown */}
                {reactiveState.showCountDown && (
                    <div style={reactiveState.isInteractPause ? { width: 0, height: 0, position: 'absolute', opacity: 0, overflow: 'hidden' } : { width: '100%', marginTop: 16, marginBottom: 16 }}>
                        <Countdown
                            seconds={MathUtils.ms2s(reactiveState.timeoutMS)}
                            onEnd={onCountdownComplete}
                        />
                    </div>
                )}
                {/* option list */}
                {!reactiveState.isInteractPause && reactiveState.options.length > 0 && (
                    <OptionList
                        options={reactiveState.options}
                        onSelect={onSelect}
                    />
                )}
                {/* inline text input (replaces ChatInput for play mode) */}
                {showChatInput && reactiveState.play && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 24, padding: '8px 16px', backdropFilter: 'blur(60px)' }}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onKeyDown={e => { if (e.key === 'Enter') onSubmitInput(inputText); }}
                            placeholder={reactiveState.lastSelectOption == null && reactiveState.lastValue ? reactiveState.lastValue : '输入你的回应...'}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#EDEDED', fontSize: 16 }}
                        />
                        <button
                            onClick={() => onSubmitInput(inputText)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M2 10l16-8-8 16V10H2z" fill="white" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        );
    },
);
