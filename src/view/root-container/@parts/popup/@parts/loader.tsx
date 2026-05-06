import { AnimatePresence, motion } from 'framer-motion';
import type { PopupTypes } from '$/types';
import { ActivityIndicator } from '$/uis/primitives';
import { optimize } from '$/view/optimize';

interface Props { info: PopupTypes.LoaderInfo | null }

export const Loader = optimize(({ info }: Props) => (
    <AnimatePresence>
        {info && info.kind !== 'silence' && (
            <motion.div
                className="fixed inset-0 flex items-center justify-center z-max"
                style={{ backgroundColor: info.mask ? 'var(--color-overlay)' : 'transparent' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="flex flex-col items-center gap-3">
                    <ActivityIndicator size="large" />
                    {info.text && (
                        <span className="text-text-secondary text-sm">
                            {Array.isArray(info.text) ? info.text[0] : info.text}
                        </span>
                    )}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));
