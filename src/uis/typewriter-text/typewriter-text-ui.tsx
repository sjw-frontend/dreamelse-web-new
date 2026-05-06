import { useEffect, useRef, useState } from 'react';
import { cn } from '$/utils/cn';

export interface TypewriterTextProps {
    text: string;
    speed?: number;
    className?: string;
    onComplete?: () => void;
}

export const TypewriterText = ({ text, speed = 30, className, onComplete }: TypewriterTextProps) => {
    const [displayed, setDisplayed] = useState('');
    const indexRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayed('');

        const tick = () => {
            if (indexRef.current < text.length) {
                indexRef.current++;
                setDisplayed(text.slice(0, indexRef.current));
                timerRef.current = setTimeout(tick, speed);
            } else {
                onComplete?.();
            }
        };

        timerRef.current = setTimeout(tick, speed);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [text, speed]);

    return <span className={cn('text-text-primary', className)}>{displayed}</span>;
};
