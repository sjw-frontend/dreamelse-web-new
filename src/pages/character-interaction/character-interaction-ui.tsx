// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { Pressable, TextInput } from '$/uis/primitives';
import { ExpandablePanel } from '$/uis/expandable-panel';
import { optimize } from '$/view';
import { CharacterController } from '$/controllers';
import { CharacterEnums } from '$/enums';
import { cn } from '$/utils/cn';
import { CharacterInteractionController } from './character-interaction-controller';

// ── Sending status indicators ─────────────────────────────────────────────────

const SendingSpinner = () => (
    <div
        className="w-4 h-4 rounded-full border-2 border-white/40 shrink-0 animate-spin"
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
        if (playing) {
            el.pause();
        } else {
            el.play();
        }
    }, [playing]);

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer select-none',
                fromMe ? 'bg-accent rounded-br-sm' : 'bg-white/10 rounded-bl-sm',
            )}
            style={{ width: bubbleWidth }}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={fromMe ? 'text-bg-page' : 'text-text-primary'}>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
            ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={fromMe ? 'text-bg-page' : 'text-text-primary'}>
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 10a7 7 0 0014 0M12 19v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
            <span className={cn('text-sm', fromMe ? 'text-bg-page' : 'text-text-primary')}>
                {durationMS ? `${Math.round(durationMS / 1000)}″` : '语音'}
            </span>
        </div>
    );
});

// ── Message item ──────────────────────────────────────────────────────────────

const MessageItem = optimize(({ id }: { id: string }) => {
    const characterCtrl = useZoneController(CharacterController);
    const ctrl = useZoneController(CharacterInteractionController);
    const info = characterCtrl.getMessage(id);

    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (!info) return null;

    const { state, attrs } = info;
    const fromMe = attrs.fromMe;
    const kind = attrs.kind;

    // ── Long-press / context-menu logic ──────────────────────────────────────
    const canCopy = kind === CharacterEnums.MessageItemKind.Msg;
    const canRollback = state.isSuccess && !attrs.isLocal &&
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

    // ── Sending status ────────────────────────────────────────────────────────
    const isSending = state.isSending;
    const isError = state.isError;

    const statusIndicator = fromMe && (
        isSending ? <SendingSpinner /> :
        isError ? <SendErrorButton onPress={() => ctrl.resendMessage(id)} /> :
        null
    );

    if (kind === CharacterEnums.MessageItemKind.SysMsg) {
        return (
            <div className="flex justify-center py-1">
                <span className="text-xs text-text-tertiary bg-white/5 rounded-full px-3 py-1">
                    {state.content}
                </span>
            </div>
        );
    }

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
                    {!fromMe && <CharacterAvatar info={info} />}
                    <div {...bubbleProps}>
                        <VoiceMessageBubble id={id} fromMe={fromMe} />
                    </div>
                    {statusIndicator}
                </div>
            </>
        );
    }

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
                    {!fromMe && <CharacterAvatar info={info} />}
                    <img
                        src={state.image.uri}
                        alt="image"
                        className="max-w-[60%] rounded-2xl object-cover"
                        style={{ maxHeight: 200 }}
                        {...bubbleProps}
                    />
                    {statusIndicator}
                </div>
            </>
        );
    }

    // Default: text message
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
                {!fromMe && <CharacterAvatar info={info} />}
                <div
                    className={cn(
                        'px-3 py-2 rounded-2xl max-w-[75%]',
                        fromMe ? 'bg-accent rounded-br-sm' : 'bg-white/10 rounded-bl-sm',
                        isSending && 'opacity-60',
                    )}
                    {...bubbleProps}
                >
                    <span className={cn('text-sm leading-relaxed', fromMe ? 'text-bg-page' : 'text-text-primary')}>
                        {state.content}
                    </span>
                </div>
                {statusIndicator}
            </div>
        </>
    );
});

const CharacterAvatar = optimize(({ info }: { info: any }) => {
    const avatarUri = info?.attrs?.characterInfo?.avatarUri ?? null;
    return (
        <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0">
            {avatarUri
                ? <img src={avatarUri} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/60">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            }
        </div>
    );
});

// ── Panel header ──────────────────────────────────────────────────────────────

const PanelHeader = optimize(({ ctrl }: { ctrl: InstanceType<typeof CharacterInteractionController> }) => {
    const state = useReactive(() => ({
        dataState: ctrl.state.data?.state,
    }));

    const figureVisual = state.dataState?.behavior?.currentFigureVisual?.uri ?? null;
    const characterName = state.dataState?.name ?? '';
    const status = state.dataState?.behavior?.status ?? '';
    const location = state.dataState?.behavior?.location ?? '';

    return (
        <div className="flex flex-row items-center gap-3 px-4 py-3">
            <Pressable onPress={ctrl.toDetails}>
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                    {figureVisual
                        ? <img src={figureVisual} alt={characterName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    }
                </div>
            </Pressable>
            <div className="flex flex-col">
                <span className="text-white font-semibold text-base">{characterName}</span>
                {(status || location) && (
                    <span className="text-white/60 text-xs">{[status, location].filter(Boolean).join(' · ')}</span>
                )}
            </div>
        </div>
    );
});

// ── Chat input footer ─────────────────────────────────────────────────────────

const ChatInputFooter = optimize(({ ctrl, expanded }: {
    ctrl: InstanceType<typeof CharacterInteractionController>;
    expanded: boolean;
}) => {
    const [inputText, setInputText] = useState('');
    const state = useReactive(() => ({ chatEnabled: ctrl.state.chatEnabled }));

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) return;
        ctrl.sendMessage(text);
        setInputText('');
    }, [inputText, ctrl]);

    return (
        <div className={cn(
            'flex flex-row items-center gap-2 px-4 py-3',
            expanded ? 'border-t border-white/5 bg-bg-page/90' : 'bg-white/12 backdrop-blur-md',
        )}>
            <div className="flex-1 flex flex-row items-center bg-white/8 rounded-2xl px-3 h-10 border border-white/10">
                <TextInput
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/50"
                    placeholder="说点什么..."
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    editable={state.chatEnabled}
                />
            </div>
            <Pressable
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0"
                disabled={!state.chatEnabled}
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white">
                    <rect x="4" y="1" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 8a5 5 0 0010 0M6.5 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
            </Pressable>
            <Pressable
                onPress={handleSend}
                disabled={!state.chatEnabled || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0 disabled:opacity-40"
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 9l14-7-7 14V9H2z" fill="black" />
                </svg>
            </Pressable>
        </div>
    );
});

// ── Message list ──────────────────────────────────────────────────────────────

const MessageList = optimize(({ ctrl }: { ctrl: InstanceType<typeof CharacterInteractionController> }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const [listHeight, setListHeight] = useState<number>(() =>
        window.visualViewport?.height ?? window.innerHeight,
    );

    const state = useReactive(() => ({
        msgIds: ctrl.state.msgIds,
        showLoading: ctrl.state.showLoading,
    }));

    // ── visualViewport keyboard adaptation ───────────────────────────────────
    useEffect(() => {
        const vv = window.visualViewport;
        const update = () => {
            setListHeight(vv ? vv.height : window.innerHeight);
        };
        if (vv) {
            vv.addEventListener('resize', update);
        } else {
            window.addEventListener('resize', update);
        }
        return () => {
            if (vv) {
                vv.removeEventListener('resize', update);
            } else {
                window.removeEventListener('resize', update);
            }
        };
    }, []);

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
            // Only auto-scroll if we were already near the bottom
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
            className="flex flex-col-reverse gap-3 px-4 pt-4 pb-2 overflow-y-auto flex-1"
            style={{ maxHeight: listHeight }}
        >
            {/* Loading indicator at bottom of reversed list = visual top */}
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
            {/* Messages in reverse order so newest is at visual bottom */}
            {[...state.msgIds].reverse().map((id: string) => (
                <MessageItem key={id} id={id} />
            ))}
            {/* Sentinel at the top (visual) triggers history load */}
            <div ref={sentinelRef} className="h-1 shrink-0" />
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
    const figureVisual = state.dataState?.behavior?.currentFigureVisual?.uri ?? null;

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
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Character figure */}
                {figureVisual && (
                    <div className="absolute inset-0 pointer-events-none flex items-start justify-center overflow-hidden">
                        <img
                            src={figureVisual}
                            alt="character"
                            className="object-contain opacity-90"
                            style={{ maxHeight: state.chatExpanded ? '45%' : '70%', marginTop: 48, transition: 'max-height 0.3s ease' }}
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
                        footer={<ChatInputFooter ctrl={ctrl} expanded={state.chatExpanded} />}
                    >
                        <MessageList ctrl={ctrl} />
                    </ExpandablePanel>
                </div>
            </div>
        </RenderParentProvider>
    );
});
