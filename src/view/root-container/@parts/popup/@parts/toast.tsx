import { AnimatePresence, motion } from 'framer-motion';
import type { PopupTypes } from '$/types';
import { optimize } from '$/view/optimize';

interface Props { info: PopupTypes.ToastInfo | null }

export const Toast = optimize(({ info }: Props) => (
    <AnimatePresence>
        {info && (
            <motion.div
                className="fixed left-1/2 -translate-x-1/2 z-max"
                style={{ bottom: info.position === 'top' ? 'auto' : 80, top: info.position === 'top' ? 60 : 'auto' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
            >
                <div className="bg-bg-toast text-text-primary text-sm px-4 py-2 rounded-xl max-w-xs text-center">
                    {info.text}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));
