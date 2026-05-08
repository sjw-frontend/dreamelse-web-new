import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '$/utils/cn';
import type { ReactNode } from 'react';
import type { ButtonKind } from '$/uis/button/button-ui';

export type DialogButton = {
    text: ReactNode;
    lightText?: boolean;
    disabled?: boolean;
    kind?: ButtonKind;
    onPress?: (index: number) => void;
};

export interface DialogProps {
    visible?: boolean;
    active?: boolean;
    onClose?: () => void;
    children?: ReactNode;
    className?: string;
    showCloseIcon?: boolean;
    headerImage?: string;
    headerImageStyle?: {
        width: number;
        height: number;
        offsetY: number;
    };
    position?: 'center' | 'bottom';
    title?: ReactNode;
    content?: ReactNode;
    buttons?: DialogButton[];
    buttonGroupKind?: 'row' | 'column';
    pressMaskClose?: boolean;
}

const buttonKindStyle = (kind?: ButtonKind, lightText?: boolean): React.CSSProperties => {
    if (kind === 'Danger') return { color: '#ff4444', background: 'transparent' };
    if (kind === 'Text' || lightText) return { color: 'rgba(255,255,255,0.5)', background: 'transparent' };
    return { backgroundColor: 'var(--color-accent, #ABFF1A)', color: '#0B1426' };
};

export const Dialog = ({
    visible,
    active,
    onClose,
    children,
    className,
    showCloseIcon,
    headerImage,
    headerImageStyle,
    position = 'center',
    title,
    content,
    buttons,
    buttonGroupKind = 'row',
    pressMaskClose = true,
}: DialogProps) => {
    const isOpen = visible ?? active ?? false;
    const isBottom = position === 'bottom';

    return (
        <RadixDialog.Root open={isOpen} onOpenChange={open => { if (!open && pressMaskClose) onClose?.(); }}>
            <RadixDialog.Portal>
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <RadixDialog.Overlay asChild>
                                <motion.div
                                    className="fixed inset-0 bg-overlay z-high"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => { if (pressMaskClose) onClose?.(); }}
                                />
                            </RadixDialog.Overlay>
                            <RadixDialog.Content asChild>
                                <motion.div
                                    className={cn(
                                        'fixed z-highest bg-bg-card',
                                        isBottom
                                            ? 'left-0 right-0 bottom-0 rounded-t-2xl p-6'
                                            : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-[calc(100%-48px)] max-w-sm',
                                        className,
                                    )}
                                    initial={isBottom ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                                    animate={isBottom ? { y: 0 } : { opacity: 1, scale: 1 }}
                                    exit={isBottom ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                >
                                    {showCloseIcon && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-text-primary cursor-pointer"
                                            aria-label="Close"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="1" y1="1" x2="11" y2="11" />
                                                <line x1="11" y1="1" x2="1" y2="11" />
                                            </svg>
                                        </button>
                                    )}
                                    {headerImage && (
                                        <div className="flex justify-center mb-4">
                                            <img
                                                src={headerImage}
                                                alt=""
                                                style={headerImageStyle ? {
                                                    width: headerImageStyle.width,
                                                    height: headerImageStyle.height,
                                                    marginTop: -headerImageStyle.offsetY,
                                                    objectFit: 'cover',
                                                    borderRadius: 12,
                                                } : undefined}
                                                className={headerImageStyle ? undefined : 'w-20 h-20 object-cover rounded-xl'}
                                            />
                                        </div>
                                    )}
                                    {title && (
                                        <p className="text-text-primary font-semibold text-lg mb-2">{title}</p>
                                    )}
                                    {content && (
                                        <p className="text-text-secondary text-sm mb-4">{content}</p>
                                    )}
                                    {children}
                                    {buttons && buttons.length > 0 && (
                                        <div
                                            className={cn(
                                                'flex mt-4',
                                                buttonGroupKind === 'column' ? 'flex-col gap-2' : 'flex-row gap-3',
                                            )}
                                        >
                                            {buttons.map((btn, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    disabled={btn.disabled}
                                                    onClick={() => btn.onPress?.(i)}
                                                    className="flex-1 h-10 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40"
                                                    style={buttonKindStyle(btn.kind, btn.lightText)}
                                                >
                                                    {btn.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </RadixDialog.Content>
                        </>
                    )}
                </AnimatePresence>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
};
