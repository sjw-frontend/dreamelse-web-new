import { type ReactNode, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

export type MenuOption = {
    label: string;
    value: string;
    icon?: ReactNode;
};

export type MenuAnchor = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface MenuProps {
    active: boolean | null;
    onClose?: () => void;
    optionList?: MenuOption[];
    value?: string | null;
    coordinate?: { x: number; y: number };
    anchor?: MenuAnchor;
    onChange?: (label: string, option: MenuOption, index: number) => void;
    onDidHide?: () => void;
    showMask?: boolean;
}

function getPositionStyle(
    coordinate: { x: number; y: number } | undefined,
    anchor: MenuAnchor,
): React.CSSProperties {
    if (!coordinate) {
        return { top: 0, left: 0 };
    }

    const { x, y } = coordinate;

    switch (anchor) {
        case 'top-left':
            return { left: x, top: y };
        case 'top-right':
            return { right: `calc(100% - ${x}px)`, top: y };
        case 'bottom-left':
            return { left: x, bottom: `calc(100% - ${y}px)` };
        case 'bottom-right':
            return { right: `calc(100% - ${x}px)`, bottom: `calc(100% - ${y}px)` };
    }
}

export const Menu = optimize((props: MenuProps) => {
    const {
        active,
        onClose,
        optionList = [],
        value,
        coordinate,
        anchor = 'top-left',
        onChange,
        onDidHide,
        showMask = false,
    } = props;

    const handleOptionClick = useCallback(
        (option: MenuOption, index: number) => {
            onChange?.(option.label, option, index);
        },
        [onChange],
    );

    const positionStyle = getPositionStyle(coordinate, anchor);

    return (
        <AnimatePresence onExitComplete={onDidHide}>
            {active && (
                <>
                    <div
                        className={cn(
                            'fixed inset-0 z-high',
                            showMask ? 'bg-black/50' : 'bg-transparent',
                        )}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed z-highest bg-bg-elevated rounded-xl shadow-lg overflow-hidden min-w-[150px]"
                        style={positionStyle}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        {optionList.map((option, index) => {
                            const isSelected = value === option.value;
                            const isLast = index === optionList.length - 1;

                            return (
                                <div key={option.value}>
                                    <button
                                        type="button"
                                        className={cn(
                                            'w-full px-4 py-3 flex flex-row items-center gap-3',
                                            'text-base text-left cursor-pointer',
                                            'hover:bg-white/5 transition-colors duration-100',
                                            isSelected
                                                ? 'text-accent'
                                                : 'text-text-primary',
                                        )}
                                        onClick={() => handleOptionClick(option, index)}
                                    >
                                        {option.icon != null && (
                                            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
                                                {option.icon}
                                            </span>
                                        )}
                                        <span className="flex-1">{option.label}</span>
                                    </button>
                                    {!isLast && (
                                        <div className="border-b border-border-default" />
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});
