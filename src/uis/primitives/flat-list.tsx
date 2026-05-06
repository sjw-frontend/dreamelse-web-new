import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { cn } from '$/utils/cn';
import type { ReactNode } from 'react';

export interface FlatListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => ReactNode;
    keyExtractor?: (item: T, index: number) => string;
    estimatedItemSize?: number;
    horizontal?: boolean;
    className?: string;
    contentContainerClassName?: string;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    ListEmptyComponent?: ReactNode;
    ListHeaderComponent?: ReactNode;
    ListFooterComponent?: ReactNode;
}

export const FlatList = <T,>({
    data,
    renderItem,
    keyExtractor,
    estimatedItemSize = 50,
    horizontal,
    className,
    contentContainerClassName,
    onEndReached,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
}: FlatListProps<T>) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const onEndReachedCalledRef = useRef(false);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedItemSize,
        horizontal,
        onChange: instance => {
            if (!onEndReached) return;
            const lastItem = instance.getVirtualItems().at(-1);
            if (!lastItem) return;
            if (lastItem.index >= data.length - 1 && !onEndReachedCalledRef.current) {
                onEndReachedCalledRef.current = true;
                onEndReached();
            } else if (lastItem.index < data.length - 1) {
                onEndReachedCalledRef.current = false;
            }
        },
    });

    if (data.length === 0 && ListEmptyComponent) {
        return <>{ListEmptyComponent}</>;
    }

    return (
        <div
            ref={parentRef}
            className={cn(
                'overflow-auto',
                horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
                className,
            )}
        >
            {ListHeaderComponent}
            <div
                className={cn('relative', contentContainerClassName)}
                style={{ [horizontal ? 'width' : 'height']: `${virtualizer.getTotalSize()}px` }}
            >
                {virtualizer.getVirtualItems().map(virtualItem => {
                    const item = data[virtualItem.index]!;
                    return (
                        <div
                            key={keyExtractor?.(item, virtualItem.index) ?? virtualItem.index}
                            className="absolute top-0 left-0 w-full"
                            style={{
                                transform: horizontal
                                    ? `translateX(${virtualItem.start}px)`
                                    : `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem({ item, index: virtualItem.index })}
                        </div>
                    );
                })}
            </div>
            {ListFooterComponent}
        </div>
    );
};
