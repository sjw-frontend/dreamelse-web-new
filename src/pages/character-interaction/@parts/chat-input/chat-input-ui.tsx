// @ts-nocheck
import { useCallback, useRef, useState } from 'react';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import type { CharacterInteractionController } from '../../character-interaction-controller';
import {
    IconAdd,
    IconClose,
    IconKeyboard,
    IconSend,
    IconVoice,
} from './icons';

import imgImage from './image.png';
import imgGift from './gift.png';
import imgNameCard from './name-card.png';

// ── Add panel ─────────────────────────────────────────────────────────────────
// 对照原版：BlurView intensity=25, tint='light', bgInput 背景, height=90
// 图标容器：72×72, borderRadius=36, bgCard 背景, paddingH=12, paddingV=4
// 图标：30×30 PNG
// 文字：12px, rgba(11,20,38,0.45)

const AddPanel = optimize(({ ctrl, onClose }: {
    ctrl: InstanceType<typeof CharacterInteractionController>;
    onClose: () => void;
}) => {
    const handlePickImage = useCallback(() => {
        onClose();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const uri = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                ctrl.sendImageMessage?.({
                    kind: 'image',
                    uri,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
            img.src = uri;
        };
        input.click();
    }, [ctrl, onClose]);

    const items = [
        { img: imgImage, label: '图片', onPress: handlePickImage },
        { img: imgGift, label: '礼物', onPress: () => {} },
        { img: imgNameCard, label: '名片', onPress: () => {} },
    ];

    return (
        <div
            className="w-full pt-4"
            style={{ backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }}
        >
            <div className="flex flex-row items-center justify-start gap-3 px-4 bg-bg-input" style={{ height: 90 }}>
                {items.map(item => (
                    <button
                        key={item.label}
                        className="flex flex-col items-center justify-center gap-1.5"
                        style={{ width: 80.5 }}
                        onClick={item.onPress}
                    >
                        <div
                            className="flex items-center justify-center bg-bg-card"
                            style={{ width: 72, height: 72, borderRadius: 36, padding: '4px 12px' }}
                        >
                            <img
                                src={item.img}
                                alt={item.label}
                                style={{ width: 30, height: 30, objectFit: 'contain' }}
                            />
                        </div>
                        <span
                            className="text-center text-xs font-normal leading-[18px]"
                            style={{ color: 'rgba(11,20,38,0.45)', width: 80 }}
                        >
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
});

// ── Main ChatInput ─────────────────────────────────────────────────────────────
// 对照原版：
// inputWrapper: bgCard, borderRadius=20, border 1px rgba(255,255,255,0.06), height=60, paddingH=16
// iconButton: 30×30
// 语音模式"按住说话"：flex-1, height=60, 文字 rgba(0,0,0,0.3), fontSize=16, fontWeight=500
// 录音时：LinearGradient rgba(109,195,51) → rgba(175,242,49)

export const ChatInput = optimize(({ ctrl, expanded }: {
    ctrl: InstanceType<typeof CharacterInteractionController>;
    expanded: boolean;
}) => {
    const [inputText, setInputText] = useState('');
    const [focused, setFocused] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isDraggingOut, setIsDraggingOut] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const startYRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // 右侧图标逻辑（对照原版）：
    // 有文本 && 聚焦 && 非语音模式 → send
    // 面板打开 → close
    // 其他 → add
    const showSend = !isVoiceMode && inputText.trim().length > 0 && focused;
    const rightIcon = showSend ? 'send' : showAddPanel ? 'close' : 'add';

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) return;
        ctrl.sendMessage(text);
        setInputText('');
        setFocused(false);
        inputRef.current?.blur();
    }, [inputText, ctrl]);

    const handleRightButton = useCallback(() => {
        if (showSend) {
            handleSend();
        } else {
            const next = !showAddPanel;
            setShowAddPanel(next);
            if (next) {
                inputRef.current?.blur();
                setFocused(false);
            }
        }
    }, [showSend, showAddPanel, handleSend]);

    const handleToggleVoice = useCallback(() => {
        setIsVoiceMode(v => !v);
        setShowAddPanel(false);
        setFocused(false);
        inputRef.current?.blur();
    }, []);

    const handleFocus = useCallback(() => {
        setFocused(true);
        setShowAddPanel(false);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // 录音手势
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = e => chunksRef.current.push(e.data);
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch { /* mic denied */ }
    }, []);

    const stopRecording = useCallback((send: boolean) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) return;
        const durationMs = Date.now() - startTimeRef.current;
        recorder.onstop = () => {
            if (send) {
                ctrl.sendVoiceMessage?.(Promise.resolve({
                    text: '[语音消息]',
                    audioUri: null,
                    audioDurationMS: durationMs,
                }));
            }
            recorder.stream.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current = null;
        };
        recorder.stop();
        setIsRecording(false);
        setIsDraggingOut(false);
    }, [ctrl]);

    const handleVoicePointerDown = useCallback(async (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        startYRef.current = e.clientY;
        startTimeRef.current = Date.now();
        setIsDraggingOut(false);
        await startRecording();
    }, [startRecording]);

    const handleVoicePointerMove = useCallback((e: React.PointerEvent) => {
        if (startYRef.current === null) return;
        const deltaY = startYRef.current - e.clientY;
        setIsDraggingOut(deltaY > 50);
    }, []);

    const handleVoicePointerUp = useCallback(() => {
        if (startYRef.current === null) return;
        const duration = Date.now() - startTimeRef.current;
        const cancel = isDraggingOut || duration < 500;
        stopRecording(!cancel);
        startYRef.current = null;
    }, [isDraggingOut, stopRecording]);

    return (
        <div className={cn('flex flex-col w-full overflow-visible', expanded ? 'border-t border-white/5' : '')}>
            {/* Add panel - 在输入栏上方 */}
            {showAddPanel && (
                <AddPanel ctrl={ctrl} onClose={() => setShowAddPanel(false)} />
            )}

            {/* 录音提示文字 - 对照原版 position absolute top=-20 */}
            {isRecording && (
                <div className="text-center text-xs font-medium mb-1" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    {isDraggingOut ? '已取消' : '上滑取消发送'}
                </div>
            )}

            {/* 主输入栏 - 对照原版 inputWrapper 样式 */}
            <div className="flex flex-row items-center px-4 py-3 gap-0">
                {/* 整体输入框容器：bgCard, borderRadius=20, border, height=60, paddingH=16 */}
                <div
                    className="flex flex-row items-center flex-1 relative overflow-hidden"
                    style={{
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.06)',
                        height: 60,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                >
                    {/* 录音时绿色渐变覆盖层 */}
                    {isRecording && (
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to bottom, rgba(109,195,51,1), rgba(175,242,49,1))' }}
                        />
                    )}

                    {/* 左侧图标：语音/键盘切换，录音时隐藏 */}
                    {!isRecording && (
                        <button
                            className="relative z-10 flex items-center justify-center shrink-0"
                            style={{ width: 30, height: 30 }}
                            onClick={handleToggleVoice}
                        >
                            {isVoiceMode
                                ? <IconKeyboard className="w-[30px] h-[30px] text-text-primary" />
                                : <IconVoice className="w-[30px] h-[30px] text-text-primary" />
                            }
                        </button>
                    )}

                    {/* 中间内容 */}
                    {isVoiceMode ? (
                        /* 语音模式：按住说话 */
                        <div
                            className="relative z-10 flex-1 flex items-center justify-center"
                            style={{ height: 60 }}
                            onPointerDown={handleVoicePointerDown}
                            onPointerMove={handleVoicePointerMove}
                            onPointerUp={handleVoicePointerUp}
                            onPointerCancel={handleVoicePointerUp}
                        >
                            {isRecording ? (
                                /* 录音中：波形动画 */
                                <div className="flex items-center gap-1">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <span
                                            key={i}
                                            className="rounded-full bg-white animate-bounce"
                                            style={{
                                                width: 4,
                                                height: 8 + Math.abs(2 - i) * 6,
                                                animationDelay: `${i * 80}ms`,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span
                                    className="text-base font-medium select-none text-text-primary/50"
                                >
                                    按住说话
                                </span>
                            )}
                        </div>
                    ) : (
                        /* 文本模式：输入框 */
                        <input
                            ref={inputRef}
                            className={cn(
                                'relative z-10 flex-1 bg-transparent outline-none text-base font-medium text-text-primary',
                                'placeholder:text-text-primary/30',
                                focused ? 'text-left' : 'text-center',
                            )}
                            style={{ height: 60 }}
                            placeholder="自由输入"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onFocus={handleFocus}
                            onBlur={() => setFocused(false)}
                            onKeyDown={handleKeyDown}
                            maxLength={200}
                        />
                    )}

                    {/* 右侧图标：send/close/add，录音时隐藏 */}
                    {!isRecording && (
                        <button
                            className="relative z-10 flex items-center justify-center shrink-0"
                            style={{ width: 30, height: 30 }}
                            onClick={handleRightButton}
                        >
                            {rightIcon === 'send' && <IconSend className="w-[30px] h-[30px] text-text-primary" />}
                            {rightIcon === 'close' && <IconClose className="w-[30px] h-[30px] text-text-primary" />}
                            {rightIcon === 'add' && <IconAdd className="w-[30px] h-[30px] text-text-primary" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
