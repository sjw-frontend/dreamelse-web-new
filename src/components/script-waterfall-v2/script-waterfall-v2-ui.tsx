// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';
import { ScriptCard } from '../script-waterfall/@parts/script-card/script-card-ui';
import { ScriptWaterfallV2Controller, type Item } from './script-waterfall-v2-controller';

type Props = {
    scriptIds: readonly string[];
    itemContentWidth: number;
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

export const ScriptWaterfallV2 = optimize((props: Props) => {
    const {
        scriptIds,
        itemContentWidth,
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
        ScriptWaterfallV2Controller,
        { reportKind },
    );

    useMemo(() => {
        if (itemContentWidth > 0) {
            ctrl.updateIds(scriptIds, itemContentWidth, sceneKey);
        }
    }, [scriptIds, itemContentWidth, sceneKey]);

    const reactiveState = useReactive(() => ({
        list: ctrl.state.list,
    }));

    const leftCol: Item[] = [];
    const rightCol: Item[] = [];
    reactiveState.list.forEach((item, i) => {
        if (i % 2 === 0) leftCol.push(item);
        else rightCol.push(item);
    });

    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !onEndReached) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0]?.isIntersecting) onEndReached();
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [onEndReached]);

    const renderCol = (col: Item[]) => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.map(item => (
                <RenderParentProvider key={item.id}>
                    <ScriptCard
                        id={item.id}
                        contentWidth={item.contentWidth}
                        contentHeight={item.contentHeight}
                        showTags={showTags}
                        bottomRightButton={bottomRightButton}
                        scene={scene}
                        onPress={onPressItem}
                        onItemChange={onItemChange}
                        onShow={info => ctrl.reportShow([info])}
                        onClick={info => ctrl.reportClick(info)}
                    />
                </RenderParentProvider>
            ))}
        </div>
    );

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {renderCol(leftCol)}
                {renderCol(rightCol)}
            </div>
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
});
