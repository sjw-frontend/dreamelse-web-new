// @ts-nocheck
import { useMemo } from 'react';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view';
import { Settings } from '../character-digest-const';

type AttributeItemProps = LibTypes.FrozenDefine<{
    label: string,
    value?: string | null,
    valueNode?: React.ReactNode,
    icon?: string | null,
    selectedIcon?: string | null,
    clickable?: boolean,
    onPress?: LibTypes.SimpleFunction,
    maxLength?: number,
    showIcon?: boolean,
    showArrow?: boolean,
    itemType?: 'card' | 'tag',
}>;

export const AttributeItem: ReactTypes.FC<AttributeItemProps> = optimize(({
    label,
    value,
    valueNode,
    icon,
    clickable = true,
    onPress,
    maxLength,
    showIcon = false,
    showArrow = true,
    itemType = 'tag',
}) => {
    const displayValue = useMemo(() => {
        if (!value || value.trim() === '') return null;
        if (maxLength != null && maxLength > 0 && value.length > maxLength) {
            return `${value.slice(0, maxLength)}...`;
        }
        return value;
    }, [value, maxLength]);

    const displayIcon = useMemo(() => {
        if (!showIcon || itemType === 'card') return null;
        if (!icon || icon.trim() === '') return null;
        return icon;
    }, [showIcon, icon, itemType]);

    if (itemType === 'card') {
        return (
            <button
                type="button"
                onClick={clickable ? onPress : undefined}
                disabled={!clickable}
                style={{
                    width: 83.6,
                    height: 83,
                    backgroundColor: '#1A1A1A',
                    borderRadius: 20,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    border: 'none',
                    cursor: clickable ? 'pointer' : 'default',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                }}
            >
                <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.15)', marginBottom: 4 }}>
                    {label}
                </span>
                {valueNode != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {valueNode}
                    </div>
                ) : displayValue != null ? (
                    <span style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: '#EDEDED',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}>
                        {displayValue}
                    </span>
                ) : null}
                {clickable && (
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none"
                        style={{ position: 'absolute', bottom: 10, right: 9.5 }}>
                        <path d="M1 1l5 5M6 1v5H1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>
        );
    }

    // tag 模式
    return (
        <button
            type="button"
            onClick={clickable ? onPress : undefined}
            disabled={!clickable}
            style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                overflow: 'hidden',
                padding: 0,
                cursor: clickable ? 'pointer' : 'default',
                flexShrink: 0,
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 32,
                paddingLeft: 12,
                paddingRight: 12,
                gap: 8,
                opacity: clickable ? 1 : 0.3,
            }}>
                {displayIcon && (
                    <img src={displayIcon} alt="" style={{ width: 24, height: 24 }} />
                )}
                {valueNode != null ? (
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#EDEDED' }}>
                        {valueNode}
                    </span>
                ) : displayValue != null ? (
                    <span style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#EDEDED',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {displayValue}
                    </span>
                ) : (
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                        {label}
                    </span>
                )}
                {clickable && showArrow && (
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                        <path d="M1 1l6 5-6 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
        </button>
    );
});
