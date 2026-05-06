import { motion } from 'framer-motion';
import { type ReactNode, useRef } from 'react';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

export interface ExpandablePanelProps {
    expanded: boolean;
    onToggle: (expanded: boolean) => void;
    header?: ReactNode;
    footer?: ReactNode;
    backgroundBlur?: number;
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
}

export const ExpandablePanel = optimize(({
    expanded,
    onToggle,
    header,
    footer,
    backgroundBlur = 0,
    disabled,
    children,
    className,
}: ExpandablePanelProps) => {
    const dragStartY = useRef<number | null>(null);
    const dragStartExpanded = useRef<boolean>(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled) return;
        dragStartY.current = e.clientY;
        dragStartExpanded.current = expanded;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (disabled || dragStartY.current === null) return;
        const deltaY = e.clientY - dragStartY.current;
        const distance = Math.abs(deltaY);

        if (distance >= 8) {
            if (deltaY > 60) {
                onToggle(false);
            } else if (deltaY < -60) {
                onToggle(true);
            } else {
                onToggle(dragStartExpanded.current);
            }
        } else {
            onToggle(!dragStartExpanded.current);
        }

        dragStartY.current = null;
    };

    const hasBlur = backgroundBlur > 0;

    return (
        <div
            className={cn(
                'absolute bottom-0 left-0 right-0',
                'rounded-t-[30px]',
                'shadow-[0_-10px_60px_rgba(0,0,0,0.4)]',
                hasBlur ? '' : 'bg-bg-page/90',
                className,
            )}
            style={hasBlur ? { backdropFilter: `blur(${backgroundBlur}px)` } : undefined}
        >
            <div
                className={cn(
                    'w-full flex items-center justify-center',
                    expanded ? 'pt-3 pb-2' : 'py-[9px]',
                    disabled && 'opacity-0',
                )}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            >
                <div className="px-6 py-2 cursor-grab active:cursor-grabbing">
                    <div className="w-[60px] h-[6px] rounded-full bg-bg-grabber" />
                </div>
            </div>

            {header != null && (
                <div className="w-full overflow-visible">
                    {header}
                </div>
            )}

            {children != null && (
                <motion.div
                    className="overflow-hidden"
                    animate={{ height: expanded ? '60vh' : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    initial={false}
                >
                    <div className="h-[60vh] overflow-y-auto px-4">
                        {children}
                    </div>
                </motion.div>
            )}

            {footer != null && (
                <div className="px-4 pb-4">
                    {footer}
                </div>
            )}
        </div>
    );
});
