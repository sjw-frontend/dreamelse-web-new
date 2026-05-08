// @ts-nocheck
import { optimize } from '$/view';
import { ReviewChoiceBubble } from './review-choice-bubble';

interface DialogItemProps {
    roleName?: string | null;
    text?: string | null;
    isMe?: boolean;
    choice?: string | null;
}

export const DialogItem = optimize(({ roleName, text, isMe, choice }: DialogItemProps) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        padding: '6px 16px',
    }}>
        {roleName && !isMe && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                {roleName}
            </span>
        )}
        <div style={{
            maxWidth: '75%',
            backgroundColor: isMe ? 'var(--color-bg-card)' : 'transparent',
            borderRadius: 24,
            padding: isMe ? '10px 16px' : '0',
        }}>
            <span style={{ fontSize: 16, color: '#EDEDED', fontWeight: 500, lineHeight: '22px' }}>
                {text}
            </span>
        </div>
        {choice && <ReviewChoiceBubble choice={choice} />}
    </div>
));
