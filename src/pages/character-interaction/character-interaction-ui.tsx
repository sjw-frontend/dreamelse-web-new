// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { LockAreaImage } from '$/uis';
import { Pressable } from '$/uis/primitives';
import { ExpandablePanel } from '$/uis/expandable-panel';
import { FileUtils } from '$/utils';
import { optimize } from '$/view';
import { CharacterController } from '$/controllers';
import { CharacterEnums } from '$/enums';
import { cn } from '$/utils/cn';
import { CharacterInteractionController } from './character-interaction-controller';
import { ChatInput } from './@parts/chat-input/chat-input-ui';

// ── Sending status indicators ─────────────────────────────────────────────────

const SendingSpinner = () => (
    <div
        className="w-5 h-5 rounded-full border-2 border-black/20 shrink-0 animate-spin"
        style={{ borderTopColor: 'transparent' }}
    />
);

const SendErrorButton = ({ onPress }: { onPress: () => void }) => (
    <button
        onClick={onPress}
        className="w-5 h-5 flex items-center justify-center text-red-400 shrink-0 text-base leading-none"
        title="重新发送"
    >
        ⚠
    </button>
);

// ── Long-press context menu ───────────────────────────────────────────────────

type MenuOption = { label: string; value: string };

const ContextMenu = ({
    options,
    position,
    onSelect,
    onClose,
}: {
    options: MenuOption[];
    position: { x: number; y: number };
    onSelect: (value: string) => void;
    onClose: () => void;
}) => {
    useEffect(() => {
        const handler = () => onClose();
        window.addEventListener('pointerdown', handler);
        return () => window.removeEventListener('pointerdown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed z-50 bg-bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[120px]"
            style={{ left: position.x, top: position.y }}
            onPointerDown={e => e.stopPropagation()}
        >
            {options.map(opt => (
                <button
                    key={opt.value}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-white/10 transition-colors"
                    onClick={() => { onSelect(opt.value); onClose(); }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

// ── Voice message bubble ──────────────────────────────────────────────────────

const VoiceMessageBubble = optimize(({ id, fromMe }: { id: string; fromMe: boolean }) => {
    const characterCtrl = useZoneController(CharacterController);
    const info = characterCtrl.getMessage(id);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);

    if (!info) return null;
    const { state } = info;
    const durationMS = state.audio?.durationMS ?? 0;
    const bubbleWidth = Math.min(240, 86 + Math.round(durationMS / 1000) * 10);

    const handleToggle = useCallback(() => {
        const el = audioRef.current;
        if (!el) return;
        if (playing) { el.pause(); } else { el.play(); }
    }, [playing]);

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-2 px-4 py-2.5 rounded-3xl cursor-pointer select-none',
                fromMe
                    ? 'rounded-br-sm'
                    : 'bg-white/90 border border-black/[0.06] rounded-bl-sm',
            )}
            style={{
                width: bubbleWidth,
                background: fromMe ? 'linear-gradient(135deg, #C7FF5F 0%, #D0FFB5 100%)' : undefined,
            }}
            onClick={handleToggle}
        >
            {state.audio?.source && (
                <audio
                    ref={audioRef}
                    src={state.audio.source}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                />
            )}
            {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={fromMe ? 'text-black/80' : 'text-[#575757]'}>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
            ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={fromMe ? 'text-black/80' : 'text-[#575757]'}>
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 10a7 7 0 0014 0M12 19v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
            <span className={cn('text-sm font-medium', fromMe ? 'text-black/80' : 'text-[#575757]')}>
                {durationMS ? `${Math.round(durationMS / 1000)}″` : '语音'}
            </span>
        </div>
    );
});

// ── Message item ──────────────────────────────────────────────────────────────

const MessageItem = optimize(({ id, ctrl }: { id: string; ctrl: InstanceType<typeof CharacterInteractionController> }) => {
    const characterCtrl = useZoneController(CharacterController);
    const info = characterCtrl.getMessage(id);

    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (!info) return null;

    const { state, fromMe, kind, isLocal } = info;

    const canCopy = kind === CharacterEnums.MessageItemKind.Msg;
    const canRollback = state.isSuccess && !isLocal &&
        kind !== CharacterEnums.MessageItemKind.SysMsg;

    const menuOptions: MenuOption[] = [
        ...(canCopy ? [{ label: '复制', value: 'copy' }] : []),
        ...(canRollback ? [{ label: '回溯', value: 'rollback' }] : []),
    ];

    const openMenu = useCallback((x: number, y: number) => {
        if (menuOptions.length === 0) return;
        setMenu({ x, y });
    }, [menuOptions.length]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
    }, [openMenu]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.pointerType !== 'touch') return;
        const { clientX, clientY } = e;
        longPressTimer.current = setTimeout(() => {
            openMenu(clientX, clientY);
        }, 500);
    }, [openMenu]);

    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleMenuSelect = useCallback((value: string) => {
        if (value === 'copy') {
            ctrl.copyMsg(state.content ?? '');
        } else if (value === 'rollback') {
            ctrl.msgRollback(id);
        }
    }, [ctrl, id, state.content]);

    const bubbleProps = {
        onContextMenu: handleContextMenu,
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
    };

    const isSending = state.isSending;
    const isError = state.isError;

    const statusIndicator = fromMe && (
        isSending ? <SendingSpinner /> :
        isError ? <SendErrorButton onPress={() => ctrl.resendMessage(id)} /> :
        null
    );

    // ── System message ────────────────────────────────────────────────────────
    if (kind === CharacterEnums.MessageItemKind.SysMsg) {
        return (
            <div className="flex justify-center py-1">
                <span className="text-xs text-text-tertiary bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    {state.content}
                </span>
            </div>
        );
    }

    // ── Plot event ────────────────────────────────────────────────────────────
    if (kind === CharacterEnums.MessageItemKind.PlotEvent && state.invitation) {
        return (
            <div className="flex justify-center py-2">
                <div className="bg-bg-card rounded-2xl px-4 py-3 max-w-[80%] border border-border-default">
                    <span className="text-sm font-semibold text-text-primary block">{state.invitation.title}</span>
                    <span className="text-xs text-text-secondary block mt-1">{state.invitation.desc}</span>
                </div>
            </div>
        );
    }

    // ── Voice message ─────────────────────────────────────────────────────────
    if (kind === CharacterEnums.MessageItemKind.Voice && state.audio) {
        return (
            <>
                {menu && (
                    <ContextMenu
                        options={menuOptions}
                        position={menu}
                        onSelect={handleMenuSelect}
                        onClose={() => setMenu(null)}
                    />
                )}
                <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
                    <div {...bubbleProps}>
                        <VoiceMessageBubble id={id} fromMe={fromMe} />
                    </div>
                    {statusIndicator}
                </div>
            </>
        );
    }

    // ── Image message ─────────────────────────────────────────────────────────
    if (kind === CharacterEnums.MessageItemKind.Image && state.image) {
        return (
            <>
                {menu && (
                    <ContextMenu
                        options={menuOptions}
                        position={menu}
                        onSelect={handleMenuSelect}
                        onClose={() => setMenu(null)}
                    />
                )}
                <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
                    <img
                        src={state.image.uri}
                        alt="image"
                        className="max-w-[60%] rounded-3xl object-cover"
                        style={{ maxHeight: 200 }}
                        {...bubbleProps}
                    />
                    {statusIndicator}
                </div>
            </>
        );
    }

    // ── Text message ──────────────────────────────────────────────────────────
    return (
        <>
            {menu && (
                <ContextMenu
                    options={menuOptions}
                    position={menu}
                    onSelect={handleMenuSelect}
                    onClose={() => setMenu(null)}
                />
            )}
            <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
                <div
                    className={cn(
                        'px-4 py-2.5 rounded-3xl max-w-[75%]',
                        fromMe
                            ? 'rounded-br-sm'
                            : 'bg-white/90 border border-black/[0.06] rounded-bl-sm',
                        isSending && 'opacity-60',
                    )}
                    style={fromMe ? { background: 'linear-gradient(135deg, #C7FF5F 0%, #D0FFB5 100%)' } : undefined}
                    {...bubbleProps}
                >
                    <span className={cn('text-base font-medium leading-relaxed', fromMe ? 'text-black/90' : 'text-[#575757]')}>
                        {state.content}
                    </span>
                </div>
                {statusIndicator}
            </div>
        </>
    );
});

// ── Panel header ──────────────────────────────────────────────────────────────

const PanelHeader = optimize(({ ctrl }: { ctrl: InstanceType<typeof CharacterInteractionController> }) => {
    const state = useReactive(() => ({
        dataState: ctrl.state.data?.state,
    }));

    const avatar = state.dataState?.behavior?.currentFigureVisual ?? null;
    const characterName = state.dataState?.name ?? '';
    const status = state.dataState?.behavior?.status ?? '';
    const location = state.dataState?.behavior?.location ?? '';

    const avatarFaceInfo = useMemo(
        () => avatar && FileUtils.getImageFaceInfo(avatar, { left: 0.25, right: 0.25, top: 0.25 }),
        [avatar],
    );

    return (
        <div className="flex flex-row items-center gap-2 px-6 pb-2">
            {/* 24×24 avatar */}
            <Pressable onPress={ctrl.toDetails}>
                <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden shrink-0 border-2 border-bg-card">
                    {avatar
                        ? <LockAreaImage
                            image={avatar}
                            area={avatarFaceInfo?.face}
                            rect={avatarFaceInfo?.rect}
                            style={{ width: 24, height: 24, borderRadius: 12 }}
                          />
                        : <div className="w-full h-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/60">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    }
                </div>
            </Pressable>

            <div className="flex flex-col">
                <span className="text-2xl font-semibold text-text-primary leading-tight">{characterName}</span>
                {(status || location) && (
                    <div className="flex flex-row items-center gap-1 mt-0.5">
                        {status && (
                            <span
                                className="text-xs font-medium text-text-primary px-3 py-1 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.4)' }}
                            >
                                {status}
                            </span>
                        )}
                        {location && (
                            <div className="flex flex-row items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-text-primary shrink-0">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span className="text-xs font-semibold text-text-primary">{location}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

// ── Message list ──────────────────────────────────────────────────────────────

const MessageList = optimize(({ ctrl }: { ctrl: InstanceType<typeof CharacterInteractionController> }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

    const state = useReactive(() => ({
        msgIds: ctrl.state.msgIds,
        showLoading: ctrl.state.showLoading,
    }));

    // ── Initial scroll to bottom ──────────────────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, []);

    // ── Scroll to bottom when new messages arrive ─────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const currentLength = state.msgIds.length;
        if (currentLength > prevLengthRef.current) {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (distFromBottom < 120) {
                el.scrollTop = el.scrollHeight;
            }
        }
        prevLengthRef.current = currentLength;
    }, [state.msgIds.length]);

    // ── IntersectionObserver sentinel for loading history ────────────────────
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting) {
                    ctrl.loadMoreHistory?.() ?? ctrl.requestMoreMessagesUp?.();
                }
            },
            { root: scrollRef.current, threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [ctrl]);

    return (
        <div
            ref={scrollRef}
            className="flex flex-col gap-3 px-4 pt-4 pb-2 overflow-y-auto h-full"
        >
            {/* Sentinel at top triggers history load */}
            <div ref={sentinelRef} className="h-1 shrink-0" />

            {/* Loading indicator */}
            {state.showLoading && (
                <div className="flex items-center gap-1 pl-2 py-1">
                    {[0, 150, 300].map(delay => (
                        <span
                            key={delay}
                            className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                        />
                    ))}
                </div>
            )}

            {/* Messages oldest→newest, newest at bottom */}
            {[...state.msgIds].map((id: string) => (
                <MessageItem key={id} id={id} ctrl={ctrl} />
            ))}
        </div>
    );
});

// ── Main page ─────────────────────────────────────────────────────────────────

export const CharacterInteractionPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(CharacterInteractionController);

    const state = useReactive(() => ({
        dataState: ctrl.state.data?.state,
        chatExpanded: ctrl.state.chatExpanded,
        characterWriting: ctrl.state.characterWriting,
    }));

    const bgColor = state.dataState?.behavior?.backgroundColor ?? null;
    const bgImage = state.dataState?.behavior?.backgroundImage?.uri ?? null;
    const figureVisual = state.dataState?.behavior?.currentFigureVisual ?? null;

    const figureHeight = state.chatExpanded ? '45%' : '70%';

    const avatarFaceInfo = useMemo(
        () =>
            figureVisual &&
            FileUtils.getImageFaceInfo(figureVisual, { top: 0, bottom: 0 }, true),
        [figureVisual],
    );

    const handleToggle = useCallback((expanded: boolean) => {
        ctrl.togglePanel(expanded);
    }, [ctrl]);

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    {bgImage
                        ? <img src={bgImage} alt="bg" className="w-full h-full object-cover" />
                        : <div
                            className="w-full h-full"
                            style={{
                                background: bgColor
                                    ? `linear-gradient(to bottom, ${bgColor}aa 0%, #1A1A1A 100%)`
                                    : 'linear-gradient(to bottom, #2a2a2a 0%, #1A1A1A 100%)',
                            }}
                        />
                    }
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Character figure */}
                {figureVisual && (
                    <div className="absolute inset-0 pointer-events-none flex items-start justify-center overflow-hidden">
                        <LockAreaImage
                            image={figureVisual}
                            area={avatarFaceInfo?.face}
                            rect={avatarFaceInfo?.rect}
                            style={{
                                width: '100%',
                                height: figureHeight,
                                marginTop: 48,
                                transition: 'height 0.3s ease',
                                overflow: 'visible',
                                opacity: 0.9,
                            }}
                        />
                    </div>
                )}

                {/* Top bar */}
                <div className="relative z-10 flex flex-row items-center justify-between px-4 pt-4 pb-2 shrink-0">
                    <Pressable onPress={ctrl.goBack} className="w-10 h-10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Pressable>

                    {state.characterWriting && (
                        <span className="flex-1 text-white/80 text-sm font-medium text-left ml-2">
                            对方正在输入...
                        </span>
                    )}

                    <Pressable onPress={ctrl.toSchedule} className="w-10 h-10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5" />
                            <path d="M3 9h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </Pressable>
                </div>

                {/* Expandable chat panel at bottom */}
                <div className="absolute left-0 right-0 bottom-0 z-10">
                    <ExpandablePanel
                        expanded={state.chatExpanded}
                        onToggle={handleToggle}
                        backgroundBlur={16}
                        header={<PanelHeader ctrl={ctrl} />}
                        footer={<ChatInput ctrl={ctrl} expanded={state.chatExpanded} />}
                    >
                        <MessageList ctrl={ctrl} />
                    </ExpandablePanel>
                </div>
            </div>
        </RenderParentProvider>
    );
});
