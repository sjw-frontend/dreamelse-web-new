// @ts-nocheck
import { useCallback, useRef } from 'react';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';

type Props = {
    value: string | null;
    placeholder?: string;
    maxLength?: number;
    autoFocus?: boolean;
    className?: string;
    onChangeText?: (value: string) => void;
    onSearch?: (value: string) => void;
};

export const Search = optimize((props: Props) => {
    const { value, placeholder, maxLength, autoFocus, className, onChangeText, onSearch } = props;

    // Bind IME handlers directly on the DOM node to avoid React synthetic event ordering issues.
    // React's onChange fires before onCompositionEnd in Chrome, so we use native DOM listeners
    // in the capture phase to block input events during composition.
    const inputRef = useRef<HTMLInputElement>(null);
    const isComposingRef = useRef(false);
    const onChangeTextRef = useRef(onChangeText);
    onChangeTextRef.current = onChangeText;

    const bindIME = useCallback((el: HTMLInputElement | null) => {
        (inputRef as any).current = el;
        if (!el) return;

        const onCompositionStart = () => {
            isComposingRef.current = true;
        };

        const onCompositionEnd = () => {
            isComposingRef.current = false;
            onChangeTextRef.current?.(el.value);
        };

        // Capture phase: block input events during IME composition before React sees them
        const onInput = (e: Event) => {
            if (isComposingRef.current) {
                e.stopImmediatePropagation();
            }
        };

        el.addEventListener('compositionstart', onCompositionStart);
        el.addEventListener('compositionend', onCompositionEnd);
        el.addEventListener('input', onInput, true);
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChangeText?.(e.target.value);
        },
        [onChangeText],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !isComposingRef.current) {
                onSearch?.(value ?? '');
            }
        },
        [value, onSearch],
    );

    const handleSearchClick = useCallback(() => {
        onSearch?.(value ?? '');
    }, [value, onSearch]);

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-2 px-4 py-1',
                'border border-border-default rounded-full',
                'bg-bg-input',
                className,
            )}
        >
            <input
                ref={bindIME}
                type="text"
                value={value ?? ''}
                placeholder={placeholder}
                maxLength={maxLength ?? 100}
                autoFocus={autoFocus}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={cn(
                    'flex-1 bg-transparent outline-none border-none',
                    'text-base text-text-primary placeholder:text-text-placeholder',
                    'border-r border-divider pr-2',
                )}
            />
            <button
                type="button"
                onClick={handleSearchClick}
                className="shrink-0 px-1 cursor-pointer outline-none"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
});
