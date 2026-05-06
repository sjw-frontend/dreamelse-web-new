import { forwardRef, useState } from 'react';
import { cn } from '$/utils/cn';
import type { ImgHTMLAttributes } from 'react';

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    source?: { uri: string } | number;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none';
    transition?: number;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
    ({ source, contentFit = 'cover', className, transition, src, ...props }, ref) => {
        const [loaded, setLoaded] = useState(false);
        const uri = typeof source === 'object' && source !== null ? (source as { uri: string }).uri : src;

        return (
            <img
                ref={ref}
                src={uri}
                className={cn(
                    contentFit === 'cover' && 'object-cover',
                    contentFit === 'contain' && 'object-contain',
                    contentFit === 'fill' && 'object-fill',
                    transition != null && 'transition-opacity duration-300',
                    transition != null && !loaded && 'opacity-0',
                    transition != null && loaded && 'opacity-100',
                    className,
                )}
                onLoad={() => setLoaded(true)}
                {...props}
            />
        );
    },
);
Image.displayName = 'Image';
