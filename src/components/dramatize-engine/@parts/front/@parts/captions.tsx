// @ts-nocheck
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { ASSETS, DRAMATIZE } from '$/consts';
import {
    useInjectRenderController,
    usePopup,
    useReactive,
    useStyles,
} from '$/hooks';
import type { ReactTypes, StyleTypes } from '$/types';
import { AsyncPressable } from '$/uis';
import { StringUtils } from '$/utils';
import { optimize } from '$/view';

import { calculateCaptionsDelayMS } from '../../../@com';
import { BlurBackground, SmoothTypewriter } from '../../../@uis';
import { DramatizeEngineController } from '$/component-controllers';

export const Captions: ReactTypes.FC = optimize(() => {
    const popup = usePopup();
    const styles = useStyles(stylesCreator);

    const ctrl = useInjectRenderController(DramatizeEngineController);

    const reactiveState = useReactive(() => ({
        play: ctrl.state.play,
        speed: ctrl.state.speed,
        show: ctrl.state.narrative?.state.showCaptions,
        allowNext:
            !ctrl.state.narrative?.state.director.interaction &&
            !ctrl.state.isWorldLineEnd,
        roleName: ctrl.state.narrative?.state.director.captions.roleName,
        text: ctrl.state.narrative?.state.director.captions.text ?? '',
        isMe: ctrl.state.narrative?.state.director.captions.isMe,
        hasTTS: !!ctrl.state.narrative?.state.director.captions.ttsElement,
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
        <BlurBackground style={styles.view}>
            <AsyncPressable style={styles.main} onPress={handleNext}>
                <View style={styles.titleView}>
                    {hasTitle && (
                        <Text
                            style={[
                                styles.title,
                                reactiveState.isMe && styles.right,
                            ]}
                        >
                            {reactiveState.roleName}
                        </Text>
                    )}
                    {reactiveState.allowNext && (
                        <View style={styles.next}>
                            <Image
                                source={ASSETS.Dramatize.next}
                                style={styles.nextIcon}
                            />
                        </View>
                    )}
                </View>
                <SmoothTypewriter
                    typingSpeedMS={DRAMATIZE.TextDisplayTimePerCharMS}
                    text={reactiveState.text}
                    textStyle={[styles.text, !hasTitle && styles.textNarrator]}
                    lineCount={3}
                    lineHeight={hasTitle ? 24 : 38}
                    onComplete={onTypingComplete}
                    play={reactiveState.play}
                    speed={reactiveState.speed}
                    isComplete={forceTypingComplete}
                    startLineIndex={1}
                />
            </AsyncPressable>
        </BlurBackground>
    );
});

const stylesCreator = (theme: StyleTypes.Theme) =>
    theme.transformStyles({
        view: {
            paddingHorizontal: 24,
            paddingVertical: 12,
            width: '100%',
            alignItems: 'stretch',
        },
        main: {},
        right: { textAlign: 'right' },
        titleView: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 34,
        },
        next: {
            height: 34,
            paddingLeft: 15,
            alignItems: 'center',
            flexDirection: 'row',
            position: 'absolute',
            right: 0,
        },
        nextIcon: {
            width: 20,
            height: 20,
        },
        title: {
            color: theme.colors.textPrimary,
            fontWeight: 800,
            fontSize: 24,
            textAlignVertical: 'center',
            height: 34,
            fontFamily: theme.fontFamilys.primaryTitle,
            flex: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.5)',
            borderBottomWidth: 1,
        },
        text: {
            fontWeight: 600,
            fontSize: 20,
            color: theme.colors.textPrimary,
        },
        textNarrator: {
            fontWeight: 900,
            fontSize: 24,
            fontFamily: theme.fontFamilys.primaryTitle,
        },
    });
