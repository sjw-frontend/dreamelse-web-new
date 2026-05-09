// @ts-nocheck
import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import type { PopupTypes } from '$/types';
import { optimize } from '$/view/optimize';

interface Props { info: PopupTypes.DualInputDialogInfo | null; onClose: () => void }

export const DualInputDialog = optimize(({ info, onClose }: Props) => {
    const [values, setValues] = useState<[string, string]>([
        info?.fields?.[0]?.defaultValue ?? '',
        info?.fields?.[1]?.defaultValue ?? '',
    ]);

    if (!info) return null;

    const handleConfirm = () => {
        info.onConfirm?.(values);
        onClose();
    };

    const setField = (i: 0 | 1, v: string) =>
        setValues(prev => i === 0 ? [v, prev[1]] : [prev[0], v]);

    return (
        <RadixDialog.Root open={true} onOpenChange={open => { if (!open) onClose(); }}>
            <RadixDialog.Portal>
                <AnimatePresence>
                    <>
                        <RadixDialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-overlay z-high"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            />
                        </RadixDialog.Overlay>
                        <RadixDialog.Content asChild>
                            <motion.div
                                className="fixed z-highest bg-bg-card left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-[calc(100%-48px)] max-w-sm"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                            >
                                {info.title && (
                                    <p className="text-text-primary font-semibold text-lg mb-4">{info.title}</p>
                                )}
                                {([0, 1] as const).map(i => (
                                    <div key={i} className="mb-3">
                                        {info.fields?.[i]?.label && (
                                            <p className="text-text-secondary text-xs mb-1">{info.fields[i].label}</p>
                                        )}
                                        <input
                                            autoFocus={i === 0}
                                            value={values[i]}
                                            onChange={e => setField(i, e.target.value)}
                                            placeholder={info.fields?.[i]?.placeholder}
                                            maxLength={info.fields?.[i]?.maxLength}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary text-sm outline-none focus:border-white/30"
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 h-10 rounded-xl text-sm font-medium text-text-secondary bg-transparent cursor-pointer"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        className="flex-1 h-10 rounded-xl text-sm font-medium cursor-pointer"
                                        style={{ backgroundColor: 'var(--color-accent, #ABFF1A)', color: '#0B1426' }}
                                    >
                                        确认
                                    </button>
                                </div>
                            </motion.div>
                        </RadixDialog.Content>
                    </>
                </AnimatePresence>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
});
