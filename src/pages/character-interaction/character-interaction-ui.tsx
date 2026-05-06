import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { Pressable, TextInput } from '$/uis/primitives';
import { ExpandablePanel } from '$/uis/expandable-panel';
import { optimize } from '$/view';
import { CharacterController } from '$/controllers';
import { CharacterEnums } from '$/enums';
import { cn } from '$/utils/cn';
import { CharacterInteractionController } from './character-interaction-controller';

// ── Message item ──────────────────────────────────────────────────────────────

const MessageItem = optimize(({ id }: { id: string }) => {
    const characterCtrl = useZoneController(CharacterController);
    const info = characterCtrl.getMessage(id);
    if (!info) return null;

    const { state, attrs } = info;
    const fromMe = attrs.fromMe;
    const kind = attrs.kind;

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
            <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
                {!fromMe && <CharacterAvatar info={info} />}
                <div className={cn(
                    'flex flex-row items-center gap-2 px-3 py-2 rounded-2xl max-w-[65%]',
                    fromMe ? 'bg-accent rounded-br-sm' : 'bg-white/10 rounded-bl-sm',
                )}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={fromMe ? 'text-bg-page' : 'text-text-primary'}>
                        <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M5 10a7 7 0 0014 0M12 19v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className={cn('text-sm', fromMe ? 'text-bg-page' : 'text-text-primary')}>
                        {state.audio.durationMS ? `${Math.round(state.audio.durationMS / 1000)}″` : '语音'}
                    </span>
                </div>
            </div>
        );
    }

    if (kind === CharacterEnums.MessageItemKind.Image && state.image) {
        return (
            <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
                {!fromMe && <CharacterAvatar info={info} />}
                <img
                    src={state.image.uri}
                    alt="image"
                    className="max-w-[60%] rounded-2xl object-cover"
                    style={{ maxHeight: 200 }}
                />
            </div>
        );
    }

    // Default: text message
    return (
        <div className={cn('flex items-end gap-2', fromMe ? 'flex-row-reverse' : 'flex-row')}>
            {!fromMe && <CharacterAvatar info={info} />}
            <div className={cn(
                'px-3 py-2 rounded-2xl max-w-[75%]',
                fromMe ? 'bg-accent rounded-br-sm' : 'bg-white/10 rounded-bl-sm',
                state.isSending && 'opacity-60',
            )}>
                <span className={cn('text-sm leading-relaxed', fromMe ? 'text-bg-page' : 'text-text-primary')}>
                    {state.content}
                </span>
            </div>
        </div>
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
    const bottomRef = useRef<HTMLDivElement>(null);
    const state = useReactive(() => ({
        msgIds: ctrl.state.msgIds,
        showLoading: ctrl.state.showLoading,
    }));

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.msgIds.length]);

    return (
        <div className="flex flex-col gap-3 px-4 pt-4 pb-2 overflow-y-auto flex-1">
            {state.msgIds.map((id: string) => (
                <MessageItem key={id} id={id} />
            ))}
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
            <div ref={bottomRef} />
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
