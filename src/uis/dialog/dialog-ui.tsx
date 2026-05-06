import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '$/utils/cn';
import type { ReactNode } from 'react';

export interface DialogProps {
    visible?: boolean;
    active?: boolean;
    onClose?: () => void;
    children?: ReactNode;
    className?: string;
    showCloseIcon?: boolean;
    headerImage?: string;
    position?: 'center' | 'bottom';
}

export const Dialog = ({
    visible,
    active,
    onClose,
    children,
    className,
    showCloseIcon,
    headerImage,
    position = 'center',
}: DialogProps) => {
    const isOpen = visible ?? active ?? false;
    const isBottom = position === 'bottom';

    return (
        <RadixDialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose?.(); }}>
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
                                            <img src={headerImage} alt="" className="w-20 h-20 object-cover rounded-xl" />
                                        </div>
                                    )}
                                    {children}
                                </motion.div>
                            </RadixDialog.Content>
                        </>
                    )}
                </AnimatePresence>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
};
