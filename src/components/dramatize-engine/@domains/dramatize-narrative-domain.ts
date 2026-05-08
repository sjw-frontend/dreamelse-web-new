import { cloneDeep } from 'lodash';

import { BaseDomain, domain } from '$/core';
import { CharacterEnums, DramatizeEnums, WorldLineEnums } from '$/enums';
import type { DramatizeTypes, WorldLineTypes } from '$/types';
import { ObjectUtils, TimerUtils } from '$/utils';

import {
    BeforeNextDramatizeTimeoutMS,
    DefaultAmbientVolume,
    DefaultBackgroundBrightnessWhenHasRole,
    DefaultBlurRoleBrightness,
    DefaultMusicVolume,
    DefaultTTSSpeed,
    DefaultVoiceFXVolume,
    NarrativeFinishTimeoutMS,
    NarratorRoles,
    NextNarrativeReadyTimeoutMS,
    QuickoptionTimeoutMS,
    ShowNewPlaceProfileDurationMS,
    VoiceFxDelayMSWhenHasAmbient,
    createAudioElement,
    createFramesElement,
    createFramesElementFromEffectInfo,
    createImageElement,
    createMotionActions,
    createSceneMotionActions,
    createSetStyleFromElementActions,
    getCanvasStyleFromMotion,
    getDefaultBackgroundStyle,
    getDefaultEffectStyle,
    getDefaultOneRoleShots,
    getDefaultRoleMotion,
    getDefaultRoleStyle,
    getDefaultSceneStyle,
    getDefaultThreeRoleShots,
    getDefaultTowRoleShots,
    handleAnimationStyle,
    handleEffects,
    handleSceneEffects,
    setDefaultMotionFrom,
} from '../@com';
import { DramatizeError } from '../@errors';

type InternalState = LibTypes.VarDefine<{
    index: number,

    isLastOne: boolean,
    isLastOneInCurrentStage: boolean,

    narrativeId: string,
    chapterIndex: number,

    imageElementList: LibTypes.Arr<DramatizeTypes.DirectorImageElement> | null,
    framesElementList: LibTypes.Arr<DramatizeTypes.DirectorFramesElement> | null,
    visualElementList: LibTypes.Arr<DramatizeTypes.DirectorVisualElement> | null,
    audioElementList: LibTypes.Arr<DramatizeTypes.DirectorAudioElement> | null,

    _director: DramatizeTypes.Director | null,
    get director(): DramatizeTypes.Director,

    play: boolean,
    speed: number,

    sceneStyle: DramatizeTypes.SceneStyle,
    showNewPlaceProfile: boolean,
    showNewRoleProfile: boolean,
    showCaptions: boolean,
    showInteraction: boolean,

    interactionValue: LibTypes.Nullable<string>,

    readonly isNarrator: boolean,
    isForceReady: boolean,
    _isReadyTrigger: number,
    get isReady(): boolean,
    isCaptionsFinished: boolean,
    isFinished: boolean,

    get isWorldLineEnd(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'chapterIndex'
    | 'director'
    | 'framesElementList'
    | 'imageElementList'
    | 'index'
    | 'interactionValue'
    | 'isFinished'
    | 'isLastOne'
    | 'isLastOneInCurrentStage'
    | 'isReady'
    | 'isWorldLineEnd'
    | 'narrativeId'
    | 'sceneStyle'
    | 'showCaptions'
    | 'showInteraction'
    | 'showNewPlaceProfile'
    | 'showNewRoleProfile'
>;

type Props = LibTypes.Define<{
    index: number,
    prevDirector: DramatizeTypes.Director | null,
    prevNarrative: WorldLineTypes.Api.Narrative | null,
    narrative: WorldLineTypes.Api.Narrative,
    resourceRecord: WorldLineTypes.Api.ResourceRecord,
    roleMap: LibTypes.VarGeneralObj<boolean>,
    disableProfile: boolean,
    speed: number,
    play: boolean,
    isReplay: boolean,
}>;

type EventMap = LibTypes.FrozenDefine<{
    breakSceneAnimations: LibTypes.Asyncable<
        LibTypes.Nullable<DramatizeTypes.SceneCurrentAnimationStyle>,
        []
    >,
    removeSceneSpecialEffects: LibTypes.Asyncable<void, []>,
    runSceneAnimation: LibTypes.Func<
        void,
        [animation: DramatizeTypes.DirectorSceneAnimation]
    >,
    runSceneSpecialEffect: LibTypes.Func<
        void,
        [specialEffect: DramatizeTypes.DirectorSceneSpecialEffect]
    >,
}>;

type Context = LibTypes.VarDefine<{
    isDramatizeStarted: boolean,

    layout: WorldLineTypes.Api.Layout | null,
    imageElementRecord: LibTypes.VarGeneralObj<DramatizeTypes.DirectorImageElement>,
    framesElementRecord: LibTypes.VarGeneralObj<DramatizeTypes.DirectorFramesElement>,
    visualElementRecord: LibTypes.VarGeneralObj<DramatizeTypes.DirectorVisualElement>,
    audioElementRecord: LibTypes.VarGeneralObj<DramatizeTypes.DirectorAudioElement>,

    get isDeactivate(): boolean,
}>;

type ExternalContext = LibTypes.FrozenPick<
    Context,
    | 'audioElementRecord'
    | 'framesElementRecord'
    | 'imageElementRecord'
    | 'visualElementRecord'
>;

@domain()
export class DramatizeNarrativeDomain extends BaseDomain<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor() {
        super();

        this.#watch();
        this.#init();
    }

    #timedTaskList: LibTypes.VarArr<TimerUtils.TimedTask> = [];

    readonly #ctx: Context = (() => {
        const $this = this;
        return {
            isDramatizeStarted: false,

            layout: null,
            visualElementRecord: {},
            audioElementRecord: {},
            imageElementRecord: {},
            framesElementRecord: {},

            get isDeactivate() {
                return $this.internal.isFinished || $this.isDestroyed;
            },
        };
    })();

    get #isKeepLayout() {
        try {
            const { narrative, prevNarrative } = this.props;

            return narrative.composition?.layout == null
                ? false
                : narrative.composition.layout ===
                      prevNarrative?.composition?.layout;
        } catch {
            return false;
        }
    }

    public get context(): ExternalContext {
        return this.#ctx;
    }

    #watch() {
        this.watch(
            () => this.internal.play,
            play => {
                this.#timedTaskList.forEach(item => {
                    if (play) {
                        item.resume();
                    } else {
                        item.suspend();
                    }
                });
            },
        );

        this.watch(
            () => this.internal.speed,
            speed => {
                if (speed > 0) {
                    this.#timedTaskList.forEach(item => {
                        item.speed = speed;
                    });
                }
            },
        );
    }

    #init() {
        this.#ctx.layout = this.#parseLayout();

        this.internal._director = this.#createDirector();
        const director = this.internal.director;

        this.internal.visualElementList = [
            ...director.scene.effectElements,
            director.place?.backgroundElement,
            ...director.roles.map((role: any) => role.appearanceElement),
            ...director.roles.map((role: any) => role.effectElements).flat(),
            ...director.layoutMaterials,
        ].filter((item: any) => {
            if (item) {
                this.#ctx.visualElementRecord[item.id] = item;
            }

            return !!item;
        });

        const imageElementList: LibTypes.VarArr<DramatizeTypes.DirectorImageElement> =
            [];

        const framesElementList: LibTypes.VarArr<DramatizeTypes.DirectorFramesElement> =
            [];

        this.internal.visualElementList.forEach((item: any) => {
            if (item.kind === DramatizeEnums.UnitKind.Image) {
                imageElementList.push(item);
                this.#ctx.imageElementRecord[item.id] = item;
            } else {
                framesElementList.push(item);
                this.#ctx.framesElementRecord[item.id] = item;
            }
        });

        this.internal.imageElementList = imageElementList;
        this.internal.framesElementList = framesElementList;

        this.internal.audioElementList = [
            director.music?.element,
            director.captions.ttsElement,
            director.ambient,
            director.voiceFx,
        ].filter(item => {
            if (item) {
                this.#ctx.audioElementRecord[item.id] = item;
            }

            return !!item;
        });
    }

    async #waitActionDelay(delayMS: number) {
        return new Promise<void>(resolve => {
            this.createTimedTask(() => resolve(), delayMS);
        });
    }

    #getShotConfig(
        shot: WorldLineTypes.Api.Shot,
        layout: WorldLineTypes.Api.Layout,
    ) {
        const baseDelayMS = shot.delay;
        const repeat = shot.loop ?? layout.compositionInfo?.loop;

        return {
            baseDelayMS,
            repeat,
        };
    }

    #execVisualActions(element: DramatizeTypes.DirectorVisualElement) {
        if (this.#ctx.isDeactivate || element.state.isActionsExecuted) {
            return;
        }
        element.state.isActionsExecuted = true;

        // Snapshot style before any actions run, so Animation's `from` is not
        // polluted by a same-frame SetStyle action.
        const initialStyle = { ...element.state.style };

        element.actions.forEach(async (action: any) => {
            if (action.delayMS != null && action.delayMS > 0) {
                await this.#waitActionDelay(action.delayMS);
            }
            if (this.#ctx.isDeactivate) {
                return;
            }
            switch (action.kind) {
                case DramatizeEnums.ActionKind.Animation: {
                    action.params.style = handleAnimationStyle(
                        element.state.style,
                        action.params.style,
                        element.extraZ,
                    );
                    action.params.fromStyle = element.state.style;
                    element.emitEvent('runVisualAnimation', action.params);
                    break;
                }
                case DramatizeEnums.ActionKind.AddSpecialEffect: {
                    element.emitEvent('runVisualSpecialEffect', action.params);
                    break;
                }
                case DramatizeEnums.ActionKind.SetStyleFromElement: {
                    element.state.style = ObjectUtils.mergeExcludeUndefined(
                        element.state.style,
                        {
                            ...action.params.element.state.style,
                            ...action.params.element.state
                                .currentAnimationStyle,
                        },
                    );
                    break;
                }
                case DramatizeEnums.ActionKind.SetStyle: {
                    element.state.originKind =
                        action.params.originKind ?? element.state.originKind;
                    element.state.selfOriginKind =
                        action.params.selfOriginKind ??
                        element.state.selfOriginKind;

                    const actionStyle = {
                        ...action.params.style,
                    };

                    if (actionStyle.z != null) {
                        actionStyle.z += element.extraZ ?? 0;
                    }

                    element.state.style = ObjectUtils.mergeExcludeUndefined(
                        element.state.style,
                        actionStyle,
                    );

                    const parent = ObjectUtils.getValue(
                        this.#ctx.visualElementRecord,
                        element.parentId,
                    );

                    if (parent?.hotspots) {
                        const hotspot =
                            parent.hotspots[
                                element.state.originKind ??
                                    DramatizeEnums.OriginKind.Default
                            ];

                        const canvasHotspot = getCanvasStyleFromMotion(
                            hotspot,
                            null,
                        );
                        element.state.translate = canvasHotspot;
                    }

                    if (element.hotspots) {
                        const hotspot =
                            element.hotspots[
                                element.state.selfOriginKind ??
                                    DramatizeEnums.OriginKind.Default
                            ];
                        const canvasHotspot = getCanvasStyleFromMotion(
                            hotspot,
                            null,
                        );
                        element.state.anchor = canvasHotspot;
                    }

                    break;
                }
            }
        });
    }

    #execSceneActions() {
        if (this.#ctx.isDeactivate) {
            return;
        }

        this.internal.director.scene.actions.forEach(async (action: any) => {
            if (action.delayMS != null && action.delayMS > 0) {
                await this.#waitActionDelay(action.delayMS);
            }
            if (this.#ctx.isDeactivate) {
                return;
            }
            switch (action.kind) {
                case DramatizeEnums.ActionKind.SceneAnimation: {
                    action.params.style = handleAnimationStyle(
                        this.internal.sceneStyle,
                        action.params.style,
                        null,
                    );
                    this.emitEvent('runSceneAnimation', action.params);
                    break;
                }
                case DramatizeEnums.ActionKind.SceneSpecialEffect: {
                    this.emitEvent('runSceneSpecialEffect', action.params);
                    break;
                }
                case DramatizeEnums.ActionKind.SceneSetStyle: {
                    this.internal.sceneStyle =
                        ObjectUtils.mergeExcludeUndefined(
                            this.internal.sceneStyle,
                            action.params.style,
                        );
                    break;
                }
            }
        });
    }

    #parseLayout() {
        try {
            const { narrative, resourceRecord } = this.props;

            const rawLayout = ObjectUtils.getValue(
                resourceRecord.layout,
                narrative.composition?.layout,
            );
            console.log('[ParseLayout] rawLayout', {
                layoutKey: narrative.composition?.layout,
                shots: rawLayout?.layout?.shots?.map((s: any) => ({
                    actors: s.actors?.map((a: any) => ({ motion: a.motion })),
                })),
            });

            let layout = cloneDeep(
                ObjectUtils.getValue(
                    resourceRecord.layout,
                    narrative.composition?.layout,
                )?.layout,
            );

            if (
                layout?.shots?.[0]?.actors == null ||
                layout.shots[0].actors.length === 0
            ) {
                const roleCount = narrative.composition?.subjects.length ?? 0;
                let actors: LibTypes.Arr<WorldLineTypes.Api.Actor> = [];
                if (roleCount === 1) {
                    actors = getDefaultOneRoleShots();
                } else if (roleCount === 2) {
                    actors = getDefaultTowRoleShots();
                } else if (roleCount === 3) {
                    actors = getDefaultThreeRoleShots();
                }

                layout = {
                    ...layout,
                    shots: [
                        {
                            actors,
                        },
                        ...(layout?.shots ?? []),
                    ],
                };
            }

            const DefaultMotionTo = getDefaultRoleMotion();
            const actorHasBrightnessList: LibTypes.VarArr<boolean> = [];

            layout.shots?.forEach((shot: any, shotIndex: any) => {
                shot.actors?.forEach((act: any, index: any) => {
                    const effectsLength = (act.effects ?? []).length;

                    actorHasBrightnessList[index] =
                        !!actorHasBrightnessList[index] ||
                        act.motion?.to?.brightness != null ||
                        act.motion?.from?.brightness != null ||
                        effectsLength > 0;

                    if (shotIndex === 0) {
                        console.log('[ParseLayout] act.motion raw', { shotIndex, index, motion: act.motion });
                        if (!act.motion?.to && effectsLength === 0) {
                            ObjectUtils.setValue(
                                act,
                                'motion.to',
                                DefaultMotionTo.to,
                            );
                            ObjectUtils.setValue(act, 'motion.start', 0);
                            ObjectUtils.setValue(
                                act,
                                'motion.end',
                                DefaultMotionTo.end,
                            );
                            ObjectUtils.setValue(
                                act,
                                'motion.loop',
                                DefaultMotionTo.loop,
                            );
                        }
                        setDefaultMotionFrom({
                            target: act,
                            defaultStyle: getDefaultRoleStyle(),
                        });
                    }
                });

                shot.materials?.forEach((shotMt: any) => {
                    setDefaultMotionFrom({
                        target: shotMt,
                        defaultStyle: getDefaultEffectStyle(),
                    });
                });

                if (shotIndex === 0 && shot.actors && shot.actors.length > 0) {
                    shot.background ??= {};
                    setDefaultMotionFrom({
                        target: shot.background,
                        defaultStyle: {
                            brightness: DefaultBackgroundBrightnessWhenHasRole,
                        },
                    });
                }
            });

            if (!this.internal.isNarrator) {
                const currentRoleIndex =
                    narrative.composition?.subjects.findIndex(
                        (sub: any) => sub.role === narrative.role,
                    );

                layout.shots?.[0]?.actors?.forEach((act: any, index: any) => {
                    if (
                        !actorHasBrightnessList[index] &&
                        currentRoleIndex !== index
                    ) {
                        ObjectUtils.setValue(
                            act,
                            'motion.from.brightness',
                            DefaultBlurRoleBrightness,
                        );
                    }
                });
            }

            return layout;
        } catch {
            return null;
        }
    }

    #handleScene() {
        const { narrative, resourceRecord } = this.props;
        const { layout } = this.#ctx;

        const actions: LibTypes.VarArr<DramatizeTypes.DirectorSceneActionUnion> =
            [];
        const effectElements: LibTypes.VarArr<DramatizeTypes.DirectorFramesElement> =
            [];

        try {
            const effectsResult =
                narrative.effects?.scene &&
                handleSceneEffects({
                    baseDelayMS: null,
                    repeat: null,
                    parentId: null,
                    effects: narrative.effects.scene.map((item: any) => ({
                        effect_id: item,
                    })),
                    resourceRecord,
                });

            if (effectsResult) {
                actions.push(...effectsResult.sceneActions);
                effectElements.push(...effectsResult.elements);
            }

            if (layout) {
                layout.shots?.forEach((shot: any) => {
                    const { baseDelayMS, repeat } = this.#getShotConfig(
                        shot,
                        layout,
                    );

                    const shotEffectsResult =
                        shot.scene?.effects &&
                        handleSceneEffects({
                            parentId: null,
                            baseDelayMS,
                            repeat,
                            effects: shot.scene.effects,
                            resourceRecord,
                        });

                    if (shotEffectsResult) {
                        actions.push(...shotEffectsResult.sceneActions);
                        effectElements.push(...shotEffectsResult.elements);
                    }

                    const motionActions =
                        shot.scene?.motion &&
                        createSceneMotionActions({
                            baseDelayMS,
                            repeat,
                            motion: shot.scene.motion,
                        });

                    if (motionActions) {
                        actions.push(...motionActions);
                    }
                });
            }
        } catch {}

        const scene: DramatizeTypes.DirectorScene = {
            effectElements,
            actions,
        };

        return scene;
    }

    #handlePlace() {
        const {
            narrative,
            prevDirector,
            prevNarrative,
            disableProfile,
            resourceRecord,
        } = this.props;
        const { layout } = this.#ctx;

        let place: DramatizeTypes.DirectorPlace | null = null;

        try {
            if (narrative.scene) {
                const resource =
                    resourceRecord.background[narrative.scene.background];

                if (resource) {
                    let backgroundElement =
                        prevDirector?.place?.backgroundElement ?? null;

                    const actions: LibTypes.VarArr<DramatizeTypes.DirectorVisualActionUnion> =
                        [];
                    const isChange =
                        prevNarrative?.scene?.background !==
                        narrative.scene.background;

                    let isReset = false;

                    if (!backgroundElement || isChange) {
                        backgroundElement =
                            resource.files.length > 1
                                ? createFramesElement({
                                      parentId: null,
                                      resourceKind: 'background',
                                      resource,
                                      actions,
                                      isSingle: true,
                                  })
                                : resource.files[0]
                                  ? createImageElement({
                                        resourceKind: 'background',
                                        resource: {
                                            id: resource.id,
                                            file: resource.files[0],
                                            scale: resource.scale,
                                        },
                                        actions,
                                        isSingle: true,
                                    })
                                  : null;

                        if (backgroundElement) {
                            backgroundElement.state.style =
                                getDefaultBackgroundStyle();
                        }
                        isReset = true;
                    }

                    if (!this.#isKeepLayout) {
                        if (layout) {
                            layout.shots?.forEach((shot: any) => {
                                const { baseDelayMS, repeat } =
                                    this.#getShotConfig(shot, layout);

                                const shotEffectsResult =
                                    shot.background?.effects &&
                                    handleEffects({
                                        parentId: null,
                                        baseDelayMS,
                                        repeat,
                                        effects: shot.background.effects,
                                        resourceRecord,
                                        dimensionsScale: resource.scale,
                                    });

                                if (shotEffectsResult) {
                                    actions.push(...shotEffectsResult.actions);
                                }

                                const motionActions =
                                    shot.background?.motion &&
                                    createMotionActions({
                                        baseDelayMS,
                                        repeat,
                                        motion: shot.background.motion,
                                        dimensionsScale: resource.scale,
                                    });

                                if (motionActions) {
                                    actions.push(...motionActions);
                                }
                            });
                        }
                    }

                    if (backgroundElement) {
                        const name =
                            narrative.scene.background_name ??
                            resource.name ??
                            '';
                        const desc =
                            narrative.scene.scene_desc ?? resource.desc ?? '';

                        const showProfile = !disableProfile && isChange;

                        place = {
                            backgroundElement,
                            name,
                            desc,
                            isReset,
                            showProfile,
                        };
                    }
                }
            }
        } catch {}

        return place;
    }

    #handleRoles() {
        const {
            narrative,
            prevDirector,
            roleMap,
            disableProfile,
            resourceRecord,
        } = this.props;
        const { layout } = this.#ctx;

        const roles: LibTypes.VarArr<DramatizeTypes.DirectorRole> = [];

        try {
            const layoutShot = layout?.shots?.[0];
            if (layoutShot) {
                const isOne = layoutShot.actors?.length === 1;
                const appearanceSet = new Set<string | undefined>();

                const isRoleKeepLayoutMap = new Map<number, boolean>();

                layoutShot.actors?.forEach((_: any, index: any) => {
                    const subject = narrative.composition?.subjects[index];

                    const character = ObjectUtils.getValue(
                        resourceRecord.characters,
                        subject?.role,
                    );
                    const appearance = appearanceSet.has(subject?.appearance)
                        ? null
                        : ObjectUtils.getValue(
                              resourceRecord.character_appearances,
                              subject?.appearance,
                          );

                    appearanceSet.add(subject?.appearance);

                    const appearanceElement =
                        (appearance &&
                            createImageElement({
                                resource: appearance,
                                resourceKind: 'character_appearances',
                                actions: [],
                                isSingle: true,
                            })) ??
                        null;

                    const effectElements: LibTypes.VarArr<DramatizeTypes.DirectorFramesElement> =
                        [];

                    if (appearanceElement) {
                        appearanceElement.extraZ = index;
                        let isRoleKeepLayout = this.#isKeepLayout;
                        const prevRole = roles[index];
                        if (
                            character?.species !== CharacterEnums.Species.Man ||
                            prevRole?.species !== CharacterEnums.Species.Man
                        ) {
                            isRoleKeepLayout = false;
                        }

                        isRoleKeepLayoutMap.set(index, isRoleKeepLayout);

                        if (isRoleKeepLayout) {
                            const prevAppearanceElement =
                                prevDirector?.roles[index]?.appearanceElement;
                            const defaultMotionTo = getDefaultRoleMotion();

                            if (prevAppearanceElement) {
                                appearanceElement.actions.push(
                                    ...createSetStyleFromElementActions({
                                        delayMS: null,
                                        element: prevAppearanceElement,
                                    }),
                                    ...createMotionActions({
                                        baseDelayMS: null,
                                        repeat: null,
                                        dimensionsScale: appearance?.scale,
                                        motion: defaultMotionTo,
                                    }),
                                );
                            } else {
                                const actor = setDefaultMotionFrom({
                                    target: {
                                        motion: defaultMotionTo,
                                    },
                                    defaultStyle: getDefaultRoleStyle(),
                                });

                                appearanceElement.actions.push(
                                    ...createMotionActions({
                                        baseDelayMS: null,
                                        repeat: null,
                                        dimensionsScale: appearance?.scale,
                                        motion: actor.motion,
                                    }),
                                );
                            }

                            appearanceElement.state.translate =
                                prevAppearanceElement?.state.translate;
                            appearanceElement.state.anchor =
                                prevAppearanceElement?.state.anchor;
                        }

                        const effectResult =
                            subject?.effect_names &&
                            handleEffects({
                                parentId: appearanceElement.id,
                                baseDelayMS: null,
                                repeat: null,
                                effects: subject.effect_names.map((item: any) => ({
                                    effect_id: item,
                                })),
                                resourceRecord,
                                dimensionsScale: appearance?.scale,
                                scope: DramatizeEnums.SpecialEffectScope
                                    .Element,
                            });

                        if (effectResult) {
                            appearanceElement.actions.push(
                                ...effectResult.actions,
                            );
                            effectElements.push(...effectResult.elements);
                        }
                    }

                    let showProfile = false;
                    if (
                        isOne &&
                        subject?.role_type ===
                            WorldLineEnums.ApiRoleType.character
                    ) {
                        showProfile = !disableProfile && !roleMap[subject.role];
                        roleMap[subject.role] = true;
                    }

                    const role: DramatizeTypes.DirectorRole = {
                        index,
                        showProfile,
                        appearanceElement,

                        effectElements,
                        roleName: character?.roleName ?? '',
                        roleDesc: character?.roleDesc ?? '',
                        species:
                            character?.species ?? CharacterEnums.Species.Man,
                        gender: character?.gender ?? CharacterEnums.Gender.Boy,
                    };
                    roles.push(role);
                });

                layout.shots?.forEach((shot: any) => {
                    const { baseDelayMS, repeat } = this.#getShotConfig(
                        shot,
                        layout,
                    );

                    shot.actors?.forEach((act: any, index: any) => {
                        const role = roles[index];
                        const isRoleKeepLayout = isRoleKeepLayoutMap.get(index);
                        if (
                            role?.appearanceElement?.actions &&
                            !isRoleKeepLayout
                        ) {
                            const shotEffectsResult =
                                act.effects &&
                                handleEffects({
                                    parentId: role.appearanceElement.id,
                                    baseDelayMS,
                                    repeat,
                                    effects: act.effects,
                                    resourceRecord,
                                    dimensionsScale:
                                        role.appearanceElement.dimensionsScale,
                                });

                            if (shotEffectsResult) {
                                role.appearanceElement.actions.push(
                                    ...shotEffectsResult.actions,
                                );
                                role.effectElements.push(
                                    ...shotEffectsResult.elements,
                                );
                            }

                            const motionActions =
                                act.motion &&
                                createMotionActions({
                                    baseDelayMS,
                                    repeat,
                                    motion: act.motion,
                                    dimensionsScale:
                                        role.appearanceElement.dimensionsScale,
                                });

                            if (motionActions) {
                                role.appearanceElement.actions.push(
                                    ...motionActions,
                                );
                            }
                        }
                    });
                });
            }
        } catch {}

        return roles;
    }

    #handleMusic() {
        const { narrative, prevNarrative, prevDirector, resourceRecord } =
            this.props;

        let music: DramatizeTypes.DirectorMusic | null = null;

        try {
            if (narrative.scene) {
                const resource = resourceRecord.music[narrative.scene.music];
                let element = null;

                const prevElement = prevDirector?.music?.element ?? null;
                const isChange =
                    narrative.scene.music !== prevNarrative?.scene?.music;

                if (resource) {
                    element =
                        isChange || !prevElement
                            ? createAudioElement({
                                  cache: true,
                                  resourceKind: 'music',
                                  resource,
                                  defaultSettings: {
                                      loop: true,
                                      volume: DefaultMusicVolume,
                                  },
                              })
                            : prevElement;
                }

                music = {
                    prevElement,
                    element,
                    isChange,
                };
            }
        } catch {}

        return music;
    }

    #handleCaptions() {
        const { narrative, resourceRecord } = this.props;
        try {
            let ttsElement;
            if (narrative.audio?.tts != null) {
                const resource = resourceRecord.tts[narrative.audio.tts];

                ttsElement =
                    resource &&
                    createAudioElement({
                        cache: false,
                        resource,
                        resourceKind: 'tts',
                        defaultSettings: {
                            speed: DefaultTTSSpeed,
                        },
                    });
            }

            const roleInfo = resourceRecord.characters[narrative.role];

            const captions: DramatizeTypes.DirectorCaptions = {
                roleName: this.internal.isNarrator ? null : narrative.role,
                text: narrative.text,
                isMe: !!roleInfo?.isMe,
                ttsElement: ttsElement ?? null,
            };

            return captions;
        } catch {
            const captions: DramatizeTypes.DirectorCaptions = {
                roleName: this.internal.isNarrator ? null : narrative.role,
                text: narrative.text,
                isMe: false,
                ttsElement: null,
            };
            return captions;
        }
    }

    #handleAmbient() {
        const { narrative, resourceRecord } = this.props;

        try {
            if (narrative.audio?.ambient != null) {
                const resource =
                    resourceRecord.ambient[narrative.audio.ambient];

                if (resource) {
                    const element = createAudioElement({
                        cache: true,
                        resource,
                        resourceKind: 'ambient',
                        defaultSettings: {
                            volume: DefaultAmbientVolume,
                        },
                    });
                    return element;
                }
            }
        } catch {}

        return null;
    }

    #handleVoiceFx() {
        const { narrative, resourceRecord } = this.props;

        try {
            if (narrative.audio?.voice_fx != null) {
                const resource =
                    resourceRecord.voice_fx[narrative.audio.voice_fx];

                if (resource) {
                    const element = createAudioElement({
                        cache: true,
                        resource,
                        resourceKind: 'voice_fx',
                        defaultSettings: {
                            volume: DefaultVoiceFXVolume,
                        },
                    });
                    return element;
                }
            }
        } catch {}

        return null;
    }

    #handleLayoutMaterials(): LibTypes.Arr<DramatizeTypes.DirectorFramesElement> {
        const { prevDirector, resourceRecord } = this.props;
        const { layout } = this.#ctx;

        const layoutMaterials: LibTypes.VarArr<DramatizeTypes.DirectorFramesElement> =
            [];

        if (this.#isKeepLayout && prevDirector) {
            return prevDirector.layoutMaterials;
        }

        try {
            if (layout) {
                layout.shots?.forEach((shot: any) => {
                    const { baseDelayMS, repeat } = this.#getShotConfig(
                        shot,
                        layout,
                    );

                    shot.materials?.forEach((material: any) => {
                        if (material.key != null) {
                            const effectInfo =
                                resourceRecord.effect[material.key];
                            if (
                                effectInfo?.kind ===
                                WorldLineEnums.ApiEffectKind.Frames
                            ) {
                                const frames =
                                    createFramesElementFromEffectInfo({
                                        parentId: null,
                                        effectInfo,
                                        scope: null,
                                    });

                                if (frames) {
                                    const shotEffectsResult =
                                        material.effects &&
                                        handleEffects({
                                            parentId: null,
                                            baseDelayMS,
                                            repeat,
                                            effects: material.effects,
                                            resourceRecord,
                                            dimensionsScale:
                                                frames.dimensionsScale,
                                        });

                                    if (shotEffectsResult) {
                                        frames.actions.push(
                                            ...shotEffectsResult.actions,
                                        );
                                    }

                                    const motionActions =
                                        material.motion &&
                                        createMotionActions({
                                            baseDelayMS,
                                            repeat,
                                            motion: material.motion,
                                            dimensionsScale:
                                                frames.dimensionsScale,
                                        });

                                    if (motionActions) {
                                        frames.actions.push(...motionActions);
                                    }

                                    layoutMaterials.push(frames);
                                }
                            }
                        }
                    });
                });
            }
        } catch {}

        return layoutMaterials;
    }

    #handleInteraction() {
        const { narrative } = this.props;

        if (
            narrative.interaction?.script_choice ||
            narrative.isLastOne ||
            narrative.is_last_one_in_scene ||
            narrative.is_fallback
        ) {
            const isEnd = narrative.achievement?.event_type === 'ending';

            let hasInteraction = true;

            if (narrative.isLastOne) {
                hasInteraction = false;
                if (isEnd) {
                    hasInteraction = true;
                } else if (
                    narrative.interaction?.script_choice?.options &&
                    narrative.interaction.script_choice.options.length > 0
                ) {
                    hasInteraction = true;
                } else if (narrative.interaction_choice != null) {
                    hasInteraction = true;
                }
            }

            if (!hasInteraction) {
                return null;
            }

            try {
                const interaction: DramatizeTypes.DirectorInteraction = {
                    options:
                        narrative.interaction?.script_choice?.options.map(
                            (text: any, index: any) => ({
                                id: index.toString(),
                                text,
                                value: text,
                            }),
                        ) ?? [],

                    lastValue: narrative.interaction_choice ?? null,
                    timeoutMS:
                        narrative.interaction?.script_choice?.kind ===
                        WorldLineEnums.ApiOptionsKind.quickoption
                            ? QuickoptionTimeoutMS
                            : null,
                    get timeoutValue() {
                        return this.options[0]?.value ?? null;
                    },
                    achievement: narrative.achievement && {
                        title: narrative.achievement.title,
                        description: narrative.achievement.description,
                    },
                    discovered: narrative.discovered,
                    isEnd,
                };

                return interaction;
            } catch {
                const interaction: DramatizeTypes.DirectorInteraction = {
                    options: [],
                    lastValue: null,
                    timeoutMS: null,
                    timeoutValue: null,
                    achievement: null,
                    discovered: null,
                };

                return interaction;
            }
        }

        return null;
    }

    #createDirector(): DramatizeTypes.Director {
        const scene = this.#handleScene();
        const place = this.#handlePlace();
        const music = this.#handleMusic();
        const captions = this.#handleCaptions();
        const ambient = this.#handleAmbient();
        const voiceFx = this.#handleVoiceFx();
        const roles = this.#handleRoles();
        const interaction = this.#handleInteraction();
        const layoutMaterials = this.#handleLayoutMaterials();

        return {
            scene,
            place,
            music,
            captions,
            ambient,
            voiceFx,
            roles,
            layoutMaterials,
            interaction,
        };
    }

    protected override destroy() {
        super.destroy();
        this.#timedTaskList.forEach(item => {
            item.clear();
        });
        this.#timedTaskList = [];
    }

    protected override getInitialInternalState(): InternalState {
        const { narrative, index, play, speed, isReplay } = this.props;

        let isNarrator = false;
        try {
            isNarrator = NarratorRoles.includes(narrative.role.trim());
        } catch {}
        return {
            index,
            play,
            speed,
            isNarrator,

            narrativeId: narrative.narrative_id,
            chapterIndex: narrative.act_count,

            isLastOne: !!narrative.isLastOne,
            isLastOneInCurrentStage: narrative.is_last_one_in_scene,

            _director: null,
            get director() {
                if (!this._director) {
                    throw new DramatizeError('找不到 director');
                }
                return this._director;
            },

            sceneStyle: getDefaultSceneStyle(),
            showNewPlaceProfile: false,
            showNewRoleProfile: false,
            showCaptions: false,
            showInteraction: false,

            interactionValue: isReplay ? null : narrative.interaction_choice,

            isFinished: false,
            isCaptionsFinished: false,

            imageElementList: null,
            framesElementList: null,
            visualElementList: null,
            audioElementList: null,
            isForceReady: false,
            _isReadyTrigger: 0,
            get isReady() {
                if (this.isForceReady) {
                    return true;
                }
                if (
                    this.visualElementList == null ||
                    this.audioElementList == null
                ) {
                    return false;
                }

                if (
                    this.visualElementList.length === 0 &&
                    this.audioElementList.length === 0
                ) {
                    return true;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this._isReadyTrigger;
                return (
                    this.visualElementList.every((item: any) => item.state.isReady) &&
                    this.audioElementList.every((item: any) => item.state.isReady)
                );
            },

            get isWorldLineEnd() {
                return this.isFinished && this.isLastOne;
            },
        };
    }

    public readonly setSpeed = (value: number) => {
        this.internal.speed = value;
    };

    public readonly play = (value: boolean) => {
        this.internal.play = value;
    };

    public readonly beforeNextDramatize = async () => {
        await this.until(() => this.internal.play);
        const director = this.internal.director;

        try {
            await new Promise<void>(resolve => {
                Promise.all([
                    director.place?.backgroundElement
                        .emitEvent('breakAnimations')
                        .race.then((currentAnimationStyle: any) => {
                            if (
                                director.place?.backgroundElement &&
                                currentAnimationStyle
                            ) {
                                this.setCurrentAnimationStyle(
                                    director.place.backgroundElement.id,
                                    currentAnimationStyle,
                                );
                            }
                        }),
                    this.#isKeepLayout
                        ? null
                        : director.place?.backgroundElement.emitEvent(
                              'removeSpecialEffects',
                          ).race,
                    ...director.roles.map(async (item: any) =>
                        item.appearanceElement
                            ?.emitEvent('breakAnimations')
                            .race.then((currentAnimationStyle: any) => {
                                if (
                                    item.appearanceElement &&
                                    currentAnimationStyle
                                ) {
                                    this.setCurrentAnimationStyle(
                                        item.appearanceElement.id,
                                        currentAnimationStyle,
                                    );
                                }
                            })),
                ]).then(() => resolve());

                this.createTimedTask(() => {
                    resolve();
                }, BeforeNextDramatizeTimeoutMS);
            });
        } catch {}

        await this.until(() => this.internal.play);

        director.roles.forEach((item: any) => {
            if (item.appearanceElement) {
                item.appearanceElement.state.controlShow = false;
            }
        });
    };

    public readonly dramatize = async (isFirst = false) => {
        if (this.#ctx.isDeactivate || this.#ctx.isDramatizeStarted) {
            return;
        }
        this.#ctx.isDramatizeStarted = true;

        if (isFirst) {
            this.createTimedTask(() => {
                this.forceReady();
            }, NextNarrativeReadyTimeoutMS);
        }
        await this.until(() => this.internal.isReady && this.internal.play);

        this.emitEvent('breakSceneAnimations');
        this.emitEvent('removeSceneSpecialEffects');

        if (!this.internal.director.interaction) {
            this.createTimedTask(() => {
                this.finish();
            }, NarrativeFinishTimeoutMS);
        }

        const {
            place,
            roles,
            music,
            captions,
            ambient,
            voiceFx,
            interaction,
            layoutMaterials,
        } = this.internal.director;

        if (place?.backgroundElement) {
            place.backgroundElement.state.controlShow = true;
        }

        // this.internal.showNewPlaceProfile = !!place?.showProfile;
        if (this.internal.showNewPlaceProfile) {
            layoutMaterials.forEach((item: any) => {
                item.state.controlShow = false;
            });
            this.createTimedTask(() => {
                this.internal.showNewPlaceProfile = false;
            }, ShowNewPlaceProfileDurationMS);
        }

        if (music?.isChange) {
            if (music.element) {
                music.element.state.play = true;
            }
            if (music.prevElement) {
                music.prevElement.state.play = false;
            }
        }

        await this.until(
            () => !this.internal.showNewPlaceProfile && this.internal.play,
        );

        this.internal.showCaptions = true;
        this.#execSceneActions();

        this.internal.showNewRoleProfile = !!roles[0]?.showProfile;

        this.internal.visualElementList?.forEach((item: any) => {
            item.state.controlShow = true;
            this.#execVisualActions(item);
        });

        if (captions.ttsElement) {
            captions.ttsElement.state.play = true;
        }
        if (ambient) {
            ambient.state.play = true;
        }
        if (voiceFx) {
            if (!ambient) {
                voiceFx.state.play = true;
            } else {
                this.createTimedTask(() => {
                    voiceFx.state.play = true;
                }, VoiceFxDelayMSWhenHasAmbient);
            }
        }

        await this.until(
            () => this.internal.isCaptionsFinished && this.internal.play,
        );

        if (interaction) {
            this.internal.showInteraction = true;
        } else {
            this.finish();
        }
    };

    public readonly setInteractionValue = (value: string | null) => {
        if (this.internal.director.interaction) {
            this.internal.interactionValue = value;
        }
    };

    public readonly captionsFinish = (delayMS?: number) => {
        if (delayMS == null || delayMS <= 0) {
            this.internal.isCaptionsFinished = true;
        } else {
            this.createTimedTask(() => {
                this.internal.isCaptionsFinished = true;
            }, delayMS);
        }
    };

    public readonly finish = async () => {
        if (!this.#ctx.isDeactivate) {
            await this.until(() => this.internal.play);
        }

        this.internal.isFinished = true;
    };

    public readonly elementReady = (id: DramatizeTypes.ElementId) => {
        const element = [
            ...(this.internal.visualElementList ?? []),
            ...(this.internal.audioElementList ?? []),
        ].find(ele => ele.id === id);
        if (element) {
            this.internal._isReadyTrigger++;
            element.state.isReady = true;
        }
    };

    public readonly setCurrentAnimationStyle = (
        id: DramatizeTypes.ElementId,
        style: DramatizeTypes.CurrentAnimationStyle,
    ) => {
        const element = this.internal.visualElementList?.find(
            (ele: any) => ele.id === id,
        );
        if (element) {
            element.state.currentAnimationStyle = style;
            element.state.style = ObjectUtils.mergeExcludeUndefined(
                element.state.style,
                style,
            );
        }
    };

    public readonly forceReady = () => (this.internal.isForceReady = true);

    public readonly createTimedTask = (
        handler: LibTypes.SimpleFunction,
        delayMS: number,
    ) => {
        const timer = TimerUtils.createTimedTask(handler, delayMS, {
            speed: this.internal.speed,
            isSuspended: !this.internal.play,
        });
        this.#timedTaskList.push(timer);

        return timer;
    };

    public readonly createLoopTimedTask = (
        handler: LibTypes.SimpleFunction,
        delayMS: number,
    ) => {
        const timer = TimerUtils.createTimedTask(handler, delayMS, {
            loop: true,
            speed: this.internal.speed,
            isSuspended: !this.internal.play,
        });
        this.#timedTaskList.push(timer);

        return timer;
    };

    public readonly sleep = async (delayMS: number) => {
        if (delayMS > 0) {
            await new Promise<void>(resolve => {
                this.createTimedTask(() => {
                    resolve();
                }, delayMS);
            });
        }
    };

    public readonly isLastOne = () => {
        this.internal.isLastOne = true;
    };
}
