// @ts-nocheck
import { optimize } from '$/view';
import { ReviewChoiceBubble } from './review-choice-bubble';

interface NarrationItemProps {
    text?: string | null;
    choice?: string | null;
}

export const NarrationItem = optimize(({ text, choice }: NarrationItemProps) => (
    <div style={{ padding: '12px 16px' }}>
        <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.5)',
            lineHeight: '22px', margin: 0,
            textShadow: '0 2.5px 5px rgba(0,0,0,0.25)',
        }}>
            {text}
        </p>
        {choice && <ReviewChoiceBubble choice={choice} />}
    </div>
));
