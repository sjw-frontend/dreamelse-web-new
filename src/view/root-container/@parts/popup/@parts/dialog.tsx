// @ts-nocheck
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import type { PopupTypes } from '$/types';
import { cn } from '$/utils/cn';
import { optimize } from '$/view/optimize';
import { ButtonKind } from '$/enums/style';

interface Props { info: PopupTypes.DialogInfo | null }

export const Dialog = optimize(({ info }: Props) => {
    if (!info) return null;
    const isBottom = info.position === 'bottom';

    return (
        <RadixDialog.Root open={true} onOpenChange={open => { if (!open) info.onClose?.(); }}>
            <RadixDialog.Portal>
                <AnimatePresence>
                    <>
                        <RadixDialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-overlay z-high"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => info.pressMaskClose && info.onClose?.()}
                            />
                        </RadixDialog.Overlay>
                        <RadixDialog.Content asChild>
                            <motion.div
                                className={cn(
                                    'fixed z-highest bg-bg-card',
                                    isBottom
                                        ? 'left-0 right-0 bottom-0 rounded-t-2xl p-6'
                                        : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-[calc(100%-48px)] max-w-sm',
                                )}
                                initial={isBottom ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                                animate={isBottom ? { y: 0 } : { opacity: 1, scale: 1 }}
                                exit={isBottom ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                            >
                                {info.title && (
                                    <p className="text-text-primary font-semibold text-lg mb-2">{info.title}</p>
                                )}
                                {info.content && (
                                    <p className="text-text-secondary text-sm mb-4">{info.content}</p>
                                )}
                                <div className={cn('flex gap-3', info.buttonGroupKind === 'row' ? 'flex-row' : 'flex-col')}>
                                    {info.buttons?.map((btn, i) => (
                                        <button
                                            key={i}
                                            className={cn(
                                                'flex-1 h-10 rounded-xl text-sm font-medium',
                                                btn.kind === ButtonKind.Danger || btn.kind === 3 || btn.kind === 'Danger'
                                                    ? 'bg-danger text-white'
                                                    : btn.kind === ButtonKind.Text || btn.kind === 2 || btn.kind === 'text' || btn.kind === 'Text'
                                                        ? 'bg-transparent text-text-secondary'
                                                        : 'bg-accent text-text-on-accent',
                                            )}
                                            onClick={() => btn.onPress?.({ close: () => info.onClose?.() })}
                                        >
                                            {btn.text}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </RadixDialog.Content>
                    </>
                </AnimatePresence>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
});
