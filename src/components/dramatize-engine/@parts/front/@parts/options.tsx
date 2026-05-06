// @ts-nocheck
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import {
    ChatInput,
    type ChatInputRef,
    type SendVoiceMessageResult,
} from '$/components';
import { ASSETS } from '$/consts';
import {
    useI18n,
    useInjectRenderController,
    useReactive,
    useStyles,
} from '$/hooks';
import type { FileTypes, ReactTypes, StyleTypes } from '$/types';
import { ScrollText } from '$/uis';
import { MathUtils, StringUtils, TimerUtils } from '$/utils';
import { optimize } from '$/view';

import { ReplaySelectTimeoutMS } from '../../../@com';
import {
    Countdown,
    CurvedGradientText,
    OptionList,
    type OptionListProps,
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
        const styles = useStyles(stylesCreator);
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
                        item => item.value === this.lastValue,
                    );
                },
            };
        });

        const [images, setImages] = useState<
            LibTypes.Arr<FileTypes.ImageResource>
        >([]);

        const chatInputRef: ChatInputRef = useRef(null);

        const handleInteract = useCallback(
            async (value: string) => {
                if (reactiveState.narrativeId != null) {
                    chatInputRef.current?.blur();
                    await ctrl.interact(reactiveState.narrativeId, value);
                }
            },
            [reactiveState.narrativeId],
        );

        const onSelect = useCallback<OptionListProps['onPress'] & {}>(
            option => {
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
                }
            },
            [handleInteract],
        );

        const onSubmitVoiceInput = useCallback(
            (result: SendVoiceMessageResult & {}) => {
                if (!StringUtils.isEmpty(result.text.trim())) {
                    handleInteract(result.text.trim());
                }
            },
            [handleInteract],
        );

        const handleInputing = useCallback((inputing: boolean) => {
            if (inputing) {
                ctrl.interacting();
            } else {
                ctrl.interactStandby();
            }
            setIsInputing(inputing);
        }, []);

        useEffect(() => {
            if (
                reactiveState.narrativeId != null &&
                !reactiveState.isEnd &&
                reactiveState.achievement
            ) {
                ctrl.requestAchievementImages(reactiveState.narrativeId).then(
                    data => setImages(data),
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
                <View style={styles.resultView}>
                    <Image
                        source={ASSETS.Dramatize.death}
                        style={styles.bgImage}
                    />
                </View>
            );
        }

        if (reactiveState.isWorldLineEnd && !reactiveState.isReplay) {
            return null;
        }

        if (reactiveState.value != null) {
            return (
                <View style={styles.resultView}>
                    {reactiveState.achievement ? (
                        <Image
                            source={ASSETS.Dramatize.achievement}
                            style={styles.bgImage}
                        />
                    ) : (
                        <View style={styles.bg} />
                    )}
                    <View style={styles.resultTop}>
                        {reactiveState.achievement && (
                            <CurvedGradientText
                                text={reactiveState.achievement.title}
                                style={styles.achievement}
                            />
                        )}
                        {images.length > 0 ? (
                            <View style={styles.achievementImageView}>
                                {images.map((item, index) => (
                                    <Image
                                        source={item.uri}
                                        key={index}
                                        style={styles.achievementImage}
                                        contentFit='contain'
                                    />
                                ))}
                            </View>
                        ) : (
                            <LottieView
                                source={ASSETS.LogoLottie.whiteDance}
                                style={styles.whiteDance}
                                autoPlay
                                renderMode='SOFTWARE'
                            />
                        )}
                    </View>
                    <View style={styles.resultTitleView}>
                        <Text style={styles.resultTitle}>
                            {i18n.youSelect()}
                        </Text>
                        <ScrollText
                            minHeight={40}
                            maxHeight={96}
                            text={reactiveState.value}
                            textStyle={styles.resultText}
                        />
                    </View>
                    {reactiveState.discovered &&
                        reactiveState.discovered.length > 0 && (
                            <View style={styles.discovered}>
                                <View style={styles.discoveredTitleView}>
                                    <Image
                                        source={ASSETS.NewCommon.whiteLineLeft}
                                        style={styles.splitLine}
                                    />
                                    <Text style={styles.discoveredTitle}>
                                        解锁彩蛋
                                    </Text>
                                    <Image
                                        source={ASSETS.NewCommon.whiteLineRight}
                                        style={styles.splitLine}
                                    />
                                </View>
                                <Text
                                    style={styles.discoveredText}
                                    numberOfLines={5}
                                >
                                    {reactiveState.discovered[0]}
                                </Text>
                            </View>
                        )}
                </View>
            );
        }

        return (
            <View style={styles.view}>
                {reactiveState.showCountDown && (
                    <View
                        style={[
                            styles.countdownView,
                            reactiveState.isInteractPause && styles.hide,
                        ]}
                    >
                        <Countdown
                            duration={MathUtils.ms2s(reactiveState.timeoutMS)}
                            onComplete={onCountdownComplete}
                            paused={reactiveState.isInteractPause}
                        />
                    </View>
                )}
                {!reactiveState.isInteractPause &&
                    reactiveState.options.length > 0 && (
                        <OptionList
                            selectedId={reactiveState.lastSelectOption?.id}
                            options={reactiveState.options}
                            onPress={onSelect}
                        />
                    )}
                {showChatInput && reactiveState.play && (
                    <View style={styles.inputView}>
                        <ChatInput
                            ref={chatInputRef}
                            onInput={handleInputing}
                            onSendMsg={onSubmitInput}
                            onSendVoice={onSubmitVoiceInput}
                            extraStuffHeight={chatInputExtraStuffHeight}
                            defaultInputText={
                                reactiveState.lastSelectOption == null
                                    ? reactiveState.lastValue
                                    : null
                            }
                            style={isInputing ? null : styles.chatInput}
                            blur={isInputing ? 0 : 60}
                            theme={isInputing ? 'light' : 'dark'}
                        />
                    </View>
                )}
            </View>
        );
    },
);

const stylesCreator = (theme: StyleTypes.Theme) =>
    theme.transformStyles({
        view: {
            marginTop: 12,
            paddingHorizontal: 16,
            alignSelf: 'stretch',
        },
        hide: {
            width: 0,
            height: 0,
            position: 'absolute',
            opacity: 0,
            overflow: 'hidden',
        },
        countdownView: {
            width: '100%',
            marginVertical: 16,
        },
        inputView: { marginTop: 12, flex: 0 },
        chatInput: {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
        },
        splitLine: {
            height: 1,
            width: 54,
            opacity: 0.5,
        },
        resultView: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            position: 'absolute',
        },
        resultTop: {
            height: '36%',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
        },
        achievement: {
            marginBottom: -220,
        },
        achievementImageView: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
        },
        achievementImage: {
            height: 107,
            width: 60,
        },
        whiteDance: {
            alignSelf: 'center',
            width: 80,
            height: 80,
        },
        bg: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            position: 'absolute',
        },
        bgImage: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            position: 'absolute',
        },
        resultTitleView: {
            marginTop: 35,
            minHeight: 200,
            marginHorizontal: 48,
        },
        resultTitle: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 18,
            textAlign: 'center',
            fontWeight: 400,
        },
        resultText: {
            fontSize: 24,
            fontWeight: 500,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 1)',
        },
        discovered: {
            marginHorizontal: 53,
            alignItems: 'stretch',
        },
        discoveredTitleView: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        discoveredTitle: {
            color: 'rgba(255, 255, 255, 1)',
            opacity: 0.5,
            fontSize: 12,
            fontWeight: 500,
            marginHorizontal: 10,
        },
        discoveredText: {
            marginTop: 15,
            color: 'rgba(255, 255, 255, 1)',
            fontWeight: 400,
            fontSize: 16,
        },
    });
