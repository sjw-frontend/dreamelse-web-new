// @ts-nocheck
import { useCallback, useMemo } from 'react';
import { ASSETS } from '$/consts';
import { ScriptController } from '$/controllers';
import { useInjectRenderController, useReactive, useZoneController } from '$/hooks';
import { Image } from '$/uis/primitives';
import { optimize } from '$/view';
import { ScriptWaterfallController, type Item } from '../../script-waterfall-controller';

type Props = {
    item: Item;
    index: number;
    onPressItem?: (scriptInfo: any) => void;
    onItemChange?: (scriptInfo: any) => void;
    showTags?: boolean;
    bottomRightButton?: 'collect' | 'more' | null;
    sceneKey: string | null;
    scene?: string;
};

const OPTIMAL_WH_RATIO = 1.5; // height = width * 1.5，对齐 app 版 VISUAL.OptimalWHRatio
const OPTIMAL_ASPECT_RATIO = `1 / ${OPTIMAL_WH_RATIO}`; // CSS aspectRatio = width/height = 1/1.5

// float2percent: converts pixel ratio to percentage string (matches RN MathUtils.float2percent)
const f2p = (n: number) => `${(n * 100).toFixed(4)}%`;

export const ScriptCard = optimize((props: Props) => {
    const { item, index, onPressItem, onItemChange, showTags, bottomRightButton, sceneKey, scene } = props;

    const ctrl = useInjectRenderController(ScriptWaterfallController);
    const scriptCtrl = useZoneController(ScriptController);

    const reactiveState = useReactive(
        () => ({
            scriptInfo: scriptCtrl.getScript(item.id),
            scriptState: scriptCtrl.getScript(item.id)?.state,
        }),
        { deep: true },
        [item.id],
    );

    const sceneInfo = (() => {
        if (sceneKey == null) return { backgroundImage: null, cover: null, bgColor: null, coverRoles: [] };
        return reactiveState.scriptState?.sceneInfoRecord?.[sceneKey] ?? { backgroundImage: null, cover: null, bgColor: null, coverRoles: [] };
    })();

    const layoutInfo = useMemo(() => {
        // bgContainer aspect ratio — matches v2 controller heightLevel
        const bgAspectRatio =
            item.heightLevel === 'high'
                ? 183 / 248
                : item.heightLevel === 'middle'
                  ? 183 / 183
                  : 183 / 137;

        // Single role: centered
        const roleStyle = {
            width: item.contentWidth * (240 / 183),
            aspectRatio: OPTIMAL_ASPECT_RATIO,
            position: 'absolute' as const,
            zIndex: 100,
            left: '50%',
            transform: 'translateX(-50%)',
        };

        // Two roles: front (index 0) large left, back (index 1) smaller right
        const frontRoleStyle = {
            width: item.contentWidth * (340 / 183),
            aspectRatio: OPTIMAL_ASPECT_RATIO,
            position: 'absolute' as const,
            zIndex: 100,
            left: f2p(-102 / 183),
            top: f2p(30 / 248),
        };

        const backRoleStyle = {
            width: item.contentWidth * (240 / 183),
            aspectRatio: OPTIMAL_ASPECT_RATIO,
            position: 'absolute' as const,
            zIndex: 90,
            right: f2p(-92 / 183),
            top: f2p(45 / 248),
        };

        // label style based on labelKind
        const labelKind: number = reactiveState.scriptState?.labelKind ?? 4;
        const showLabelGradient = labelKind === 1;

        const labelTextColor =
            labelKind === 2 ? '#FF7700'
            : labelKind === 3 ? '#9F6A37'
            : 'rgba(255,255,255,0.6)';

        const labelBgColor = labelKind === 2 ? 'rgba(255,119,0,0.12)' : 'transparent';

        return { bgAspectRatio, roleStyle, frontRoleStyle, backRoleStyle, showLabelGradient, labelTextColor, labelBgColor, labelKind };
    }, [item.heightLevel, item.contentWidth, reactiveState.scriptState?.labelKind]);

    // label text — matches v2 logic
    const label = (() => {
        if (scene === 'published' && reactiveState.scriptState?.publishTime != null) {
            const d = new Date(reactiveState.scriptState.publishTime);
            return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return reactiveState.scriptState?.label ?? null;
    })();

    const onPressItemHandler = useCallback(() => {
        if (reactiveState.scriptInfo) {
            ctrl.reportClick(reactiveState.scriptInfo);
            onPressItem?.(reactiveState.scriptInfo);
        }
    }, [onPressItem, reactiveState.scriptInfo]);

    const onCollect = useCallback(() => {
        if (reactiveState.scriptInfo) {
            ctrl.collect(reactiveState.scriptInfo.id);
            onItemChange?.(reactiveState.scriptInfo);
        }
    }, [onItemChange, reactiveState.scriptInfo]);

    if (!reactiveState.scriptState) return null;

    const title = reactiveState.scriptState.title ?? '';
    const tags = reactiveState.scriptState.tags ?? [];
    const isCollected = reactiveState.scriptState.isCollected;

    // Cover image: prefer backgroundImage (PGC composite) over cover
    const coverUri = sceneInfo.backgroundImage?.uri ?? sceneInfo.cover?.uri ?? null;
    // Only render role images when no backgroundImage
    const coverRoles = sceneInfo.backgroundImage ? [] : (sceneInfo.coverRoles ?? []);

    return (
        <div
            className="w-full cursor-pointer"
            style={{ height: item.contentHeight + 8, paddingBottom: 8 }}
            onClick={onPressItemHandler}
        >
            {/* contentView — borderRadius 12, bgCard background, overflow hidden */}
            <div
                className="relative overflow-hidden"
                style={{
                    width: item.contentWidth,
                    height: item.contentHeight,
                    borderRadius: 12,
                    backgroundColor: '#1A1A1A',
                }}
            >
                {/* ── bgContainer: image area, aspect ratio controlled ── */}
                <div
                    className="relative overflow-hidden w-full"
                    style={{
                        aspectRatio: `${183} / ${Math.round(183 / layoutInfo.bgAspectRatio)}`,
                        borderRadius: 12,
                    }}
                >
                    {/* bg image */}
                    {coverUri ? (
                        <Image
                            source={{ uri: coverUri }}
                            contentFit="cover"
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: sceneInfo.bgColor ?? '#AAAAAA' }} />
                    )}

                    {/* gradient: transparent → rgba(0,0,0,0.75), bottom 25% only */}
                    <div
                        className="absolute w-full"
                        style={{
                            bottom: 0,
                            height: '25%',
                            zIndex: 110,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.75))',
                        }}
                    />

                    {/* role images — only when no backgroundImage */}
                    {coverRoles.length === 1 && coverRoles[0]?.uri && (
                        <img
                            src={coverRoles[0].uri}
                            alt=""
                            className="pointer-events-none"
                            style={layoutInfo.roleStyle}
                        />
                    )}
                    {coverRoles.length >= 2 && (
                        <>
                            {coverRoles[0]?.uri && (
                                <img
                                    src={coverRoles[0].uri}
                                    alt=""
                                    className="pointer-events-none"
                                    style={layoutInfo.frontRoleStyle}
                                />
                            )}
                            {coverRoles[1]?.uri && (
                                <img
                                    src={coverRoles[1].uri}
                                    alt=""
                                    className="pointer-events-none"
                                    style={layoutInfo.backRoleStyle}
                                />
                            )}
                        </>
                    )}

                    {/* tags: bottom-left inside image, joined with · */}
                    {tags.length > 0 && (
                        <span
                            className="absolute pointer-events-none"
                            style={{
                                zIndex: 120,
                                left: 12,
                                bottom: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.7)',
                                lineHeight: '16px',
                            }}
                        >
                            {tags.slice(0, 2).map(t => t.label).join('·')}
                        </span>
                    )}
                </div>

                {/* ── bottomView: title + label + button ── */}
                <div
                    className="flex flex-col"
                    style={{ margin: 12, marginTop: 8 }}
                >
                    {/* title */}
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#EDEDED',
                            lineHeight: '19px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {title}
                    </p>

                    {/* bottomContent: label left, collect button right */}
                    <div
                        className="flex flex-row items-center justify-between relative"
                        style={{ height: 20, marginTop: 4 }}
                    >
                        {/* label */}
                        <div
                            className="relative overflow-hidden flex items-center"
                            style={{
                                height: 20,
                                borderRadius: 4,
                                maxWidth: '80%',
                                backgroundColor: layoutInfo.labelBgColor,
                                flexShrink: 1,
                            }}
                        >
                            {/* gradient background for labelKind === 1 */}
                            {layoutInfo.showLabelGradient && (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(to right, #D9FF8D, #ADEFFA)',
                                        zIndex: 0,
                                    }}
                                />
                            )}
                            {label ? (
                                <span
                                    className="relative"
                                    style={{
                                        zIndex: 1,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        lineHeight: '20px',
                                        color: layoutInfo.labelTextColor,
                                        paddingLeft: layoutInfo.labelKind === 1 || layoutInfo.labelKind === 2 ? 6 : 0,
                                        paddingRight: layoutInfo.labelKind === 1 || layoutInfo.labelKind === 2 ? 6 : 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {label}
                                </span>
                            ) : null}
                        </div>

                        {/* collect button — position absolute right:-10 bottom:-10 */}
                        {bottomRightButton === 'collect' && (
                            <button
                                type="button"
                                className="absolute flex items-center justify-center"
                                style={{ width: 40, height: 40, right: -10, bottom: -10 }}
                                onClick={e => { e.stopPropagation(); onCollect(); }}
                            >
                                <img
                                    src={isCollected ? ASSETS.NewCommon.iconCollected : ASSETS.NewCommon.iconCollect}
                                    alt=""
                                    style={{ width: 20, height: 20 }}
                                />
                            </button>
                        )}
                        {bottomRightButton === 'more' && (
                            <button
                                type="button"
                                className="flex items-center justify-center shrink-0"
                                style={{ width: 20, height: 20 }}
                                onClick={e => { e.stopPropagation(); }}
                            >
                                <img
                                    src={ASSETS.NewCommon.moreGray}
                                    alt=""
                                    style={{ width: 24, height: 24 }}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
