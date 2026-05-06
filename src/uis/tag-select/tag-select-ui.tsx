// @ts-nocheck
import { useCallback } from 'react';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

type Value = number | string;

export type TagSelectOption<T extends Value> = {
    label: string;
    value: T;
};

type TagSelectProps<T extends Value> = {
    options: TagSelectOption<T>[];
    value?: T | null;
    onChange?: (value: T) => void;
    className?: string;
    itemClassName?: string;
    itemSelectedClassName?: string;
};

export const TagSelect = optimize(
    <T extends Value>(props: TagSelectProps<T>) => {
        const selectedValue = props.value;

        const handleOptionPress = useCallback(
            (optionValue: T) => {
                props.onChange?.(optionValue);
            },
            [props.onChange],
        );

        return (
            <div className={cn('w-full overflow-x-auto scrollbar-none', props.className)}>
                <div className="flex flex-row gap-1.5 pb-1">
                    {props.options.map(option => {
                        const isSelected = selectedValue === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleOptionPress(option.value)}
                                className={cn(
                                    'h-9 px-4 rounded-xl border-2 shrink-0',
                                    'text-base font-semibold transition-colors duration-150',
                                    'outline-none cursor-pointer',
                                    isSelected
                                        ? cn('bg-bg-card border-text-primary text-text-primary', props.itemSelectedClassName)
                                        : cn('bg-bg-card border-bg-card text-text-secondary', props.itemClassName),
                                )}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    },
);
