// @ts-nocheck
import { optimize } from '$/view';
import { BlurBackground } from '$/components/dramatize-engine/@uis';

interface ReviewChoiceBubbleProps {
    choice?: string | null;
}

export const ReviewChoiceBubble = optimize(({ choice }: ReviewChoiceBubbleProps) => {
    if (!choice) return null;
    return (
        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BlurBackground
                borderRadius={12}
                maskColor="rgba(255,255,255,0.08)"
                blurIntensity={20}
                style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
                <span style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.5)',
                    border: '0.5px solid rgba(255,255,255,0.3)',
                    borderRadius: 4, padding: '1px 4px',
                }}>
                    已选
                </span>
                <span style={{ fontSize: 13, color: '#EDEDED', fontWeight: 500 }}>{choice}</span>
            </BlurBackground>
        </div>
    );
});
