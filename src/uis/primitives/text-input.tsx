import { forwardRef } from 'react';
import { cn } from '$/utils/cn';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface TextInputProps {
    className?: string;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
    onChangeText?: (text: string) => void;
    onSubmitEditing?: () => void;
    secureTextEntry?: boolean;
    autoFocus?: boolean;
    editable?: boolean;
    maxLength?: number;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

export const TextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextInputProps>(
    ({ className, multiline, numberOfLines, onChangeText, onSubmitEditing, secureTextEntry, editable = true, keyboardType, ...props }, ref) => {
        const baseClass = cn(
            'bg-transparent text-text-primary placeholder:text-text-placeholder',
            'outline-none border-none resize-none w-full',
            className,
        );
        const inputType = secureTextEntry ? 'password'
            : keyboardType === 'numeric' ? 'number'
            : keyboardType === 'email-address' ? 'email'
            : keyboardType === 'phone-pad' ? 'tel'
            : 'text';

        if (multiline) {
            return (
                <textarea
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    className={baseClass}
                    rows={numberOfLines ?? 3}
                    disabled={!editable}
                    onChange={e => onChangeText?.(e.target.value)}
                    {...props as TextareaHTMLAttributes<HTMLTextAreaElement>}
                />
            );
        }

        return (
            <input
                ref={ref as React.Ref<HTMLInputElement>}
                type={inputType}
                className={baseClass}
                disabled={!editable}
                onChange={e => onChangeText?.(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSubmitEditing?.()}
                {...props as InputHTMLAttributes<HTMLInputElement>}
            />
        );
    },
);
TextInput.displayName = 'TextInput';
