// @ts-nocheck
import { optimize } from '$/view';

interface ChapterItemProps {
    chapterName?: string | null;
    time?: string | null;
}

export const ChapterItem = optimize(({ chapterName, time }: ChapterItemProps) => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <svg width="20" height="20" viewBox="0 0 20 20">
                <polygon points="10,1 12.5,7.5 19,7.5 14,12 16,19 10,15 4,19 6,12 1,7.5 7.5,7.5" fill="rgba(255,255,255,0.4)" />
            </svg>
            <span style={{
                fontSize: 20, color: '#FBF4E5', fontWeight: 700,
                textShadow: '0 0 9px rgba(235,137,0,0.4)',
            }}>
                {chapterName}
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20">
                <polygon points="10,1 12.5,7.5 19,7.5 14,12 16,19 10,15 4,19 6,12 1,7.5 7.5,7.5" fill="rgba(255,255,255,0.4)" />
            </svg>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        </div>
        {time && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{time}</span>
        )}
    </div>
));
