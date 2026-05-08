// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScriptController } from '$/controllers';
import { useReactive, useRegisterRenderController, useZoneController } from '$/hooks';
import { cn } from '$/utils/cn';
import { optimize } from '$/view';
import { ScriptCard } from './@parts/script-card/script-card-ui';
import { ScriptWaterfallController, type Item } from './script-waterfall-controller';

type Props = {
    scriptIds: readonly string[];
    itemContentWidth: number;
    isDraft?: boolean;
    onPressItem?: (scriptInfo: any) => void;
    onItemChange?: (scriptInfo: any) => void;
    onEndReached?: () => void;
    onRefresh?: () => void;
    reportKind?: string;
    showTags?: boolean;
    bottomRightButton?: 'collect' | 'more' | null;
    sceneKey: string | null;
    scene?: string;
};

export const ScriptWaterfall = optimize((props: Props) => {
    const {
        scriptIds,
        itemContentWidth,
        isDraft,
        onPressItem,
        onItemChange,
        onEndReached,
        reportKind,
        showTags,
        bottomRightButton,
        sceneKey,
        scene,
    } = props;

    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        ScriptWaterfallController,
        { reportKind, isDraft },
    );

    // Update ids whenever scriptIds or itemContentWidth changes
    useMemo(() => {
        if (itemContentWidth > 0) {
            ctrl.updateIds(scriptIds, itemContentWidth, sceneKey);
        }
    }, [scriptIds, itemContentWidth, sceneKey]);

    const reactiveState = useReactive(() => ({
        list: ctrl.state.list,
    }));

    // Flatten the list — state.list is Item[] (one per script)
    // Split into two columns manually for a masonry-style layout
    const leftCol: Item[] = [];
    const rightCol: Item[] = [];
    reactiveState.list.forEach((item, i) => {
        if (i % 2 === 0) leftCol.push(item);
        else rightCol.push(item);
    });

    // Infinite scroll sentinel
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!onEndReached) return;
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting) {
                    onEndReached();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [onEndReached]);

    const renderCard = useCallback(
        (item: Item, colIndex: number) => (
            <ScriptCard
                key={item.id}
                item={item}
                index={colIndex}
                onPressItem={onPressItem}
                onItemChange={onItemChange}
                showTags={showTags}
                bottomRightButton={bottomRightButton}
                sceneKey={sceneKey}
                scene={scene}
            />
        ),
        [onPressItem, onItemChange, showTags, bottomRightButton, sceneKey, scene],
    );

    if (reactiveState.list.length === 0) {
        return (
            <RenderParentProvider>
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-full bg-bg-card flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-quaternary">
                            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="text-text-tertiary text-sm">暂无内容</span>
                </div>
            </RenderParentProvider>
        );
    }

    return (
        <RenderParentProvider>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {/* Two-column waterfall: 8px left/right padding, 8px center gap — matches RN */}
                <div className="flex flex-row" style={{ gap: 8 }}>
                    {/* Left column */}
                    <div className="flex flex-col" style={{ width: itemContentWidth }}>
                        {leftCol.map(item => renderCard(item, 0))}
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col" style={{ width: itemContentWidth }}>
                        {rightCol.map(item => renderCard(item, 1))}
                    </div>
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-4 w-full" />
            </div>
        </RenderParentProvider>
    );
});
