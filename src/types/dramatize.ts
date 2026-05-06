import type { RefObject } from 'react';

import type { CharacterEnums, DramatizeEnums } from '$/enums';
import type { ApiTypes, FileTypes, StyleTypes, WorldLineTypes } from '$/types';
import type { EventUtils } from '$/utils';

export declare namespace DramatizeTypes {
    type DramatizeId = string;

    type DramatizeInfo = LibTypes.FrozenDefine<{
        id: DramatizeId,
        name: string,
        cover: FileTypes.ImageResource,
    }>;

    type DramatizeInfoRecord = LibTypes.VarGeneralObj<
        DramatizeInfo,
        DramatizeId
    >;

    type StateDramatizeInfo = LibTypes.FrozenDefine<DramatizeInfo>;

    type StateDramatizeInfoRecord = LibTypes.GeneralObj<
        StateDramatizeInfo,
        DramatizeId
    >;
}

export declare namespace DramatizeTypes {
    type UnitId = string;

    type ElementId = string;

    type ResourceId = string;

    type CommandId = number;
}

export declare namespace DramatizeTypes {
    type URIAttr<R extends FileTypes.Resource> = LibTypes.FrozenDefine<{
        resource: R,
        uri: string,
    }>;

    type SpecialEffectAttr = LibTypes.FrozenDefine<
        LibTypes.FrozenPick<UnitAnimated, 'durationMS' | 'repeat'> & {
            effectKey: DramatizeEnums.SpecialEffectKind,

            // attrs for vibrate
            startAlpha?: number,
            targetAlpha?: number,
            targetScale?: number,

            // attrs for shake
            amplitude?: number,
            speed?: number,

            // attrs for scene film filter
            playSpeed?: number,
            blackLineWidth?: number,
            dotSize?: number,

            // attrs for surrounding shadow
            startDist?: number,
            endDist?: number,
            endBrightness?: number,
        }
    >;

    type StyleAttr = LibTypes.VarDefine<{
        show?: boolean,
        baseScale?: number,
        style: UnitStyle,
        originOffest?: StyleTypes.Coordinate,
        selfOriginOffest?: StyleTypes.Coordinate,
        hotspots?: LibTypes.VarGeneralObj<
            StyleTypes.Coordinate,
            DramatizeEnums.OriginKind
        >,
        originKind?: DramatizeEnums.OriginKind,
        selfOriginKind?: DramatizeEnums.OriginKind,
        size?: DramatizeEnums.UnitSize,
        animated?: UnitAnimated | null,
        specialEffects?: LibTypes.VarArr<SpecialEffectAttr> | null,
    }>;

    type PlayAttr = LibTypes.VarDefine<{
        play: boolean,
        durationMS: number,
        speed?: number,
        loop?: boolean,
        volumeFade?: boolean,
    }>;

    type VolumeAttr = LibTypes.VarDefine<{
        volume: number,
    }>;
}

export declare namespace DramatizeTypes {
    type UnitAnimatedRepeat = boolean | 'default' | 'reverse';

    type UnitRelativeStyle = LibTypes.VarDefine<{
        relativeScale?: number,
    }>;

    type UnitAnimatedStyle = LibTypes.VarDefine<UnitRelativeStyle & UnitStyle>;

    type UnitAnimated = LibTypes.FrozenDefine<{
        style: UnitAnimatedStyle,
        durationMS?: number | null,
        repeat?: UnitAnimatedRepeat | null,
    }>;

    type UnitStyle = LibTypes.VarDefine<{
        height?: number,
        width?: number,
        x?: number,
        y?: number,
        scale?: number, // 0-正无穷 默认1  填1.5表示放大50%
        rotation?: number, // 0-360 默认0
        opacity?: number, // 0-1 默认1
        brightness?: number, // 0～正无穷 默认1 0是全黑，填2表示两倍亮度
        blur?: number, // 0-1 默认0
        zIndex?: number,
        color?: string | null,

        ts?: number, // 时间戳
        translate?: LibTypes.VarDefine<{
            x?: number,
            y?: number,
        }>,
    }>;

    type SceneStyle = LibTypes.FrozenDefine<{
        x?: number,
        y?: number,
        scale?: number,
        rotation?: number,
        blur?: number,
        brightness?: number,
        color?: string | null, // 元素本身要混合的颜色
        opacity?: number, // 元素本身透明度
        // 以下仅支持scene
        sharpness?: number, // 锐化 0-正无穷 默认0
        overlayColor?: string | null, // 遮罩颜色
        overlayOpacity?: number, // 遮罩透明度
    }>;

    type SceneAnimated = LibTypes.FrozenDefine<{
        style: SceneStyle,
        durationMS?: number | null,
        repeat?: LibTypes.Nullable<UnitAnimatedRepeat>,
    }>;
}

export declare namespace DramatizeTypes {
    type WatchCondition = LibTypes.FrozenDefine<{
        unitId: UnitId,
        key: keyof Required<Unit>['state'],
        value: boolean,
    }>;
}

export declare namespace DramatizeTypes {
    type SetTextContentActionParams = LibTypes.FrozenDefine<{
        title?: string,
        content?: string,
    }>;

    type SetProcessActionParams = LibTypes.FrozenDefine<{
        currentActCount?: number,
        currentDirectorIndex?: number,
    }>;

    type ActiveActionParams = LibTypes.FrozenDefine<{
        active: boolean,
        reset?: boolean,
    }>;

    type ShowActionParams = LibTypes.FrozenDefine<{
        parentId?: UnitId | null,
        show: boolean,
        keepAnimated?: boolean,
        keepEffect?: boolean,
    }>;

    type PlayActionParams = LibTypes.FrozenPick<
        PlayAttr,
        'loop' | 'play' | 'volumeFade'
    >;

    type AnimatedActionParams = LibTypes.FrozenDefine<UnitAnimated>;
    type ClearAnimatedActionParams = null;
    type ClearChildrenActionParams = null;
    type ClearSpecialEffectActionParams = null;
    type NarrativeBeginActionParams = LibTypes.FrozenDefine<{
        id: string,
        index: number,
    }>;
    type NarrativeEndActionParams = LibTypes.FrozenDefine<{
        id: string,
        index: number,
    }>;

    type SetStyleActionParams = LibTypes.FrozenPick<
        StyleAttr,
        'originKind' | 'selfOriginKind' | 'size' | 'style'
    >;

    type SetStyleFromUnitActionParams = LibTypes.FrozenDefine<{
        id: UnitId,
    }>;

    type SetRoleCountActionParams = LibTypes.FrozenDefine<{
        roleCount: number,
    }>;

    type AddSpecialEffectActionParams =
        | LibTypes.Arr<SpecialEffectAttr>
        | SpecialEffectAttr;

    type PlayToMSActionParams = LibTypes.FrozenDefine<{
        toMS: number,
    }>;

    type PlayToIndexActionParams = LibTypes.FrozenDefine<{
        toIndex: number,
    }>;

    type VolumeActionParams = LibTypes.FrozenDefine<VolumeAttr>;

    type NextStepActionParams = LibTypes.FrozenGeneralObj;

    type ActionConditions = LibTypes.FrozenDefine<{
        watch?: LibTypes.Arr<WatchCondition> | WatchCondition | null,
        expressions?: null, // TODO 实现复杂表达式
    }>;

    type BaseAction<
        K extends DramatizeEnums.ActionKind,
        P extends LibTypes.Reference | null,
    > = LibTypes.FrozenDefine<{
        kind: K,
        delayMS?: number | null,
        conditions?: ActionConditions | null,
        params: P,
    }>;

    type SetTextContentAction = BaseAction<
        DramatizeEnums.ActionKind.SetTextContent,
        SetTextContentActionParams
    >;

    type SetProcessAction = BaseAction<
        DramatizeEnums.ActionKind.SetProcess,
        SetProcessActionParams
    >;
    type NarrativeBeginAction = BaseAction<
        DramatizeEnums.ActionKind.NarrativeBegin,
        NarrativeBeginActionParams
    >;
    type NarrativeEndAction = BaseAction<
        DramatizeEnums.ActionKind.NarrativeEnd,
        NarrativeEndActionParams
    >;
    type PlayToIndexAction = BaseAction<
        DramatizeEnums.ActionKind.PlayToIndex,
        PlayToIndexActionParams
    >;
    type AddSpecialEffectAction = BaseAction<
        DramatizeEnums.ActionKind.AddSpecialEffect,
        AddSpecialEffectActionParams
    >;
    type ActiveAction = BaseAction<
        DramatizeEnums.ActionKind.Active,
        ActiveActionParams
    >;
    type AnimatedAction = BaseAction<
        DramatizeEnums.ActionKind.Animation,
        AnimatedActionParams
    >;
    type ClearAnimatedAction = BaseAction<
        DramatizeEnums.ActionKind.ClearAnimated,
        ClearAnimatedActionParams
    >;
    type ClearChildrenAction = BaseAction<
        DramatizeEnums.ActionKind.ClearChildren,
        ClearChildrenActionParams
    >;
    type ClearSpecialEffectAction = BaseAction<
        DramatizeEnums.ActionKind.ClearSpecialEffect,
        ClearSpecialEffectActionParams
    >;
    type NextStepAction = BaseAction<
        DramatizeEnums.ActionKind.NextStep,
        NextStepActionParams
    >;
    type PlayAction = BaseAction<
        DramatizeEnums.ActionKind.Play,
        PlayActionParams
    >;
    type PlayToMSAction = BaseAction<
        DramatizeEnums.ActionKind.PlayToMS,
        PlayToMSActionParams
    >;
    type VolumeAction = BaseAction<
        DramatizeEnums.ActionKind.Volume,
        VolumeActionParams
    >;
    type ShowAction = BaseAction<
        DramatizeEnums.ActionKind.Show,
        ShowActionParams
    >;
    type SetStyleAction = BaseAction<
        DramatizeEnums.ActionKind.SetStyle,
        SetStyleActionParams
    >;
    type SetStyleFromUnitAction = BaseAction<
        DramatizeEnums.ActionKind.SetStyleFromUnit,
        SetStyleFromUnitActionParams
    >;
    type SetRoleCountAction = BaseAction<
        DramatizeEnums.ActionKind.SetRoleCount,
        SetRoleCountActionParams
    >;

    type Action =
        | ActiveAction
        | AddSpecialEffectAction
        | AnimatedAction
        | ClearAnimatedAction
        | ClearChildrenAction
        | ClearSpecialEffectAction
        | NarrativeBeginAction
        | NarrativeEndAction
        | NextStepAction
        | PlayAction
        | PlayToIndexAction
        | PlayToMSAction
        | SetProcessAction
        | SetRoleCountAction
        | SetStyleAction
        | SetStyleFromUnitAction
        | SetTextContentAction
        | ShowAction
        | VolumeAction;
}

export declare namespace DramatizeTypes {
    type ProcessUnitProps = LibTypes.VarDefine<{
        unitList: LibTypes.VarArr<Unit>,
        currentDirectorIndex: number,
        currentActCount: number,
        preload: LibTypes.Arr<LibTypes.Arr<string>>, // TODO
        currentStepIndex: number,
        readonly steps: LibTypes.VarArr<Step>,
        get sceneUnit(): SceneUnit,
    }>;

    type TextUnitProps = LibTypes.VarDefine<{
        show?: boolean,
        title?: string,
        content: string,
        readonly isMe?: boolean,
        readonly kind: DramatizeEnums.TextKind,
    }>;

    export type OptionItem = LibTypes.FrozenDefine<{
        id: string,
        text: string,
        value: string,
    }>;

    type OptionsUnitProps = LibTypes.VarDefine<{
        show?: boolean,
        narratorId: string,
        options: LibTypes.Arr<OptionItem>,
        value: string | null,
        lastValue: string | null,
        relatedUnitIds: LibTypes.Arr<UnitId>,
        timeoutSEC?: number | null,
        timeoutValue?: string | null,
        achievement?: ApiTypes.Protocol.NarrativeAchievement,
        discovered?: LibTypes.Arr<string>,
    }>;

    type AudioUnitProps = LibTypes.VarDefine<
        Partial<VolumeAttr> & PlayAttr & URIAttr<FileTypes.AudioResource>
    >;

    type SceneUnitProps = LibTypes.VarDefine<
        LibTypes.VarPick<StyleAttr, 'animated' | 'specialEffects' | 'style'> & {
            roleCount: number,
        }
    >;

    type ImageUnitProps = LibTypes.VarDefine<
        StyleAttr & URIAttr<FileTypes.ImageResource>
    >;

    type ContainerUnitProps = LibTypes.VarOmit<ImageUnitProps, 'uri'>;

    type FramesUnitProps = LibTypes.VarDefine<
        PlayAttr &
            StyleAttr & {
                readonly frames: LibTypes.Arr<URIAttr<FileTypes.ImageResource>>,
                index?: number,
            }
    >;

    type VideoUnitProps = LibTypes.VarDefine<
        AudioUnitProps &
            StyleAttr & {
                readonly startMS?: number,
            }
    >;

    type LottieUnitProps = LibTypes.VarDefine<
        PlayAttr & StyleAttr & { uri: string }
    >;

    type BaseUnit<
        K extends DramatizeEnums.UnitKind,
        P extends LibTypes.FrozenGeneralObj,
    > = LibTypes.VarDefine<{
        id: UnitId,
        parentId?: UnitId | null,
        key: string,
        name?: string,
        kind: K,
        state: Partial<{
            active?: boolean,
            ready?: boolean,
            ended?: boolean,
        }>,
        props: P,
        childRecord?: LibTypes.VarGeneralObj<Unit>,
        preload?: boolean,
        ref?: RefObject<{
            cancelAnimations: LibTypes.SimpleFunction,
            cancelSpecialEffects: LibTypes.SimpleFunction,
        } | null>,
    }>;

    type ProcessUnit = BaseUnit<
        DramatizeEnums.UnitKind.Process,
        ProcessUnitProps
    >;

    type AudioUnit = BaseUnit<DramatizeEnums.UnitKind.Audio, AudioUnitProps>;
    type FramesUnit = BaseUnit<DramatizeEnums.UnitKind.Frames, FramesUnitProps>;
    type ImageUnit = BaseUnit<DramatizeEnums.UnitKind.Image, ImageUnitProps>;
    type TextUnit = BaseUnit<DramatizeEnums.UnitKind.Text, TextUnitProps>;
    type VideoUnit = BaseUnit<DramatizeEnums.UnitKind.Video, VideoUnitProps>;
    type LottieUnit = BaseUnit<DramatizeEnums.UnitKind.Lottie, LottieUnitProps>;
    type SceneUnit = BaseUnit<DramatizeEnums.UnitKind.Scene, SceneUnitProps>;
    type ContainerUnit = BaseUnit<
        DramatizeEnums.UnitKind.Container,
        ContainerUnitProps
    >;
    type OptionsUnit = BaseUnit<
        DramatizeEnums.UnitKind.Options,
        OptionsUnitProps
    >;

    type Unit =
        | AudioUnit
        | ContainerUnit
        | FramesUnit
        | ImageUnit
        | LottieUnit
        | OptionsUnit
        | ProcessUnit
        | SceneUnit
        | TextUnit
        | VideoUnit;

    type UnitCanSpecialEffect =
        | ContainerUnit
        | FramesUnit
        | ImageUnit
        | LottieUnit
        | SceneUnit
        | VideoUnit;
    type UnitCanAnimated =
        | ContainerUnit
        | FramesUnit
        | ImageUnit
        | LottieUnit
        | VideoUnit;
    type UnitCanSetStyle =
        | ContainerUnit
        | FramesUnit
        | ImageUnit
        | LottieUnit
        | VideoUnit;
    type UnitCanShow =
        | ContainerUnit
        | FramesUnit
        | ImageUnit
        | LottieUnit
        | TextUnit
        | VideoUnit;
    type UnitCanPlay = AudioUnit | FramesUnit | LottieUnit | VideoUnit;
    type UnitCanChildren = FramesUnit | ImageUnit | LottieUnit;

    // TODO 类型体操
    type UnitMap = LibTypes.Define<{
        [DramatizeEnums.UnitKind.Audio]: AudioUnit,
        [DramatizeEnums.UnitKind.Frames]: FramesUnit,
        [DramatizeEnums.UnitKind.Image]: ImageUnit,
        [DramatizeEnums.UnitKind.Container]: ContainerUnit,
        [DramatizeEnums.UnitKind.Text]: TextUnit,
        [DramatizeEnums.UnitKind.Video]: VideoUnit,
        [DramatizeEnums.UnitKind.Process]: ProcessUnit,
        [DramatizeEnums.UnitKind.Lottie]: LottieUnit,
        [DramatizeEnums.UnitKind.Scene]: SceneUnit,
        [DramatizeEnums.UnitKind.Options]: OptionsUnit,
    }>;
}

export declare namespace DramatizeTypes {
    type Command = LibTypes.FrozenDefine<{
        id: CommandId,
        delayMS?: number | null,
        conditions?: ActionConditions | null,
        target: LibTypes.Arr<UnitId> | UnitId,
        actions: LibTypes.Arr<Action>,
    }>;

    type Step = LibTypes.FrozenDefine<{
        delayMS?: number | null,
        commands: LibTypes.Arr<Command>,
        kind?: DramatizeEnums.StepKind,
    }>;
}

export declare namespace DramatizeTypes {
    type SpecialEffectShakeConfig = LibTypes.FrozenDefine<{
        amplitude?: number,
        speed?: number,
    }>;

    type BaseSpecialEffect<
        K extends DramatizeEnums.DirectorSpecialEffectKind,
        C extends LibTypes.Reference | null,
    > = LibTypes.FrozenDefine<{
        kind: K,
        config: C & LibTypes.FrozenPick<UnitAnimated, 'durationMS' | 'repeat'>,
    }>;

    type VibrateSpecialEffect = BaseSpecialEffect<
        DramatizeEnums.DirectorSpecialEffectKind.Vibrate,
        LibTypes.FrozenDefine<{
            startAlpha?: number,
            targetAlpha?: number,
            targetScale?: number,
        }>
    >;

    type ShakeSpecialEffect = BaseSpecialEffect<
        DramatizeEnums.DirectorSpecialEffectKind.Shake,
        SpecialEffectShakeConfig
    >;

    type DirectorSpecialEffect = ShakeSpecialEffect | VibrateSpecialEffect;

    type BaseSceneSpecialEffect<
        K extends DramatizeEnums.DirectorSceneSpecialEffectKind,
        C extends LibTypes.Reference | null,
    > = LibTypes.FrozenDefine<{
        kind: K,
        config: C & LibTypes.FrozenPick<UnitAnimated, 'durationMS' | 'repeat'>,
    }>;

    type ShakeSceneSpecialEffect = BaseSceneSpecialEffect<
        DramatizeEnums.DirectorSceneSpecialEffectKind.Shake,
        SpecialEffectShakeConfig
    >;

    type FilmFilterSceneSpecialEffect = BaseSceneSpecialEffect<
        DramatizeEnums.DirectorSceneSpecialEffectKind.FilmFilter,
        LibTypes.FrozenDefine<{
            playSpeed?: number,
            blackLineWidth?: number,
            dotSize?: number,
        }>
    >;

    type BaseVFXSceneSpecialEffect<
        K extends DramatizeEnums.DirectorSceneSpecialEffectKind,
    > = BaseSceneSpecialEffect<
        K,
        LibTypes.FrozenDefine<{
            intensity?: number,
            speed?: number,
        }>
    >;

    type RainSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Rain>;
    type StormSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Storm>;
    type SlantRainSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.SlantRain>;
    type FireSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Fire>;
    type LightningSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Lightning>;
    type ArcSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Arc>;
    type BlizzardSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Blizzard>;
    type CrystalSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Crystal>;
    type EmbersSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Embers>;
    type FireworksSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Fireworks>;
    type BokehSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Bokeh>;
    type HeartbeatSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Heartbeat>;
    type IntoYouSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.IntoYou>;
    type StarsSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Stars>;
    type NebulaSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Nebula>;
    type LaserSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Laser>;
    type PulseSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Pulse>;
    type FogSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Fog>;
    type VFogSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.VFog>;
    type CloudSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Cloud>;
    type SandySceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Sandy>;
    type OceanSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Ocean>;
    type CausticSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Caustic>;
    type BonfireSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Bonfire>;
    type BlazeSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.Blaze>;
    type VHSSceneSpecialEffect =
        BaseVFXSceneSpecialEffect<DramatizeEnums.DirectorSceneSpecialEffectKind.VHS>;

    type SnowSceneSpecialEffect = BaseSceneSpecialEffect<
        DramatizeEnums.DirectorSceneSpecialEffectKind.Snow,
        LibTypes.FrozenDefine<{
            intensity?: number,
            speed?: number,
            depth?: number,
        }>
    >;

    type FlareSceneSpecialEffect = BaseSceneSpecialEffect<
        DramatizeEnums.DirectorSceneSpecialEffectKind.Flare,
        LibTypes.FrozenDefine<{
            intensity?: number,
            speed?: number,
            type?: number,
        }>
    >;

    type DirectorSceneSpecialEffect =
        | ArcSceneSpecialEffect
        | BlazeSceneSpecialEffect
        | BlizzardSceneSpecialEffect
        | BokehSceneSpecialEffect
        | BonfireSceneSpecialEffect
        | CausticSceneSpecialEffect
        | CloudSceneSpecialEffect
        | CrystalSceneSpecialEffect
        | EmbersSceneSpecialEffect
        | FilmFilterSceneSpecialEffect
        | FireSceneSpecialEffect
        | FireworksSceneSpecialEffect
        | FlareSceneSpecialEffect
        | FogSceneSpecialEffect
        | HeartbeatSceneSpecialEffect
        | IntoYouSceneSpecialEffect
        | LaserSceneSpecialEffect
        | LightningSceneSpecialEffect
        | NebulaSceneSpecialEffect
        | OceanSceneSpecialEffect
        | PulseSceneSpecialEffect
        | RainSceneSpecialEffect
        | SandySceneSpecialEffect
        | ShakeSceneSpecialEffect
        | SlantRainSceneSpecialEffect
        | SnowSceneSpecialEffect
        | StarsSceneSpecialEffect
        | StormSceneSpecialEffect
        | VFogSceneSpecialEffect
        | VHSSceneSpecialEffect;

    type DirectorSetStyleActionParams = LibTypes.FrozenPick<
        DirectorVisualStyleAttr,
        'originKind' | 'selfOriginKind' | 'style'
    >;

    type DirectorSceneSetStyleActionParams = LibTypes.FrozenDefine<{
        style: DirectorSceneStyle,
    }>;

    type DirectorSetStyleFromElementActionParams = LibTypes.Define<{
        element: DirectorVisualElement,
    }>;

    type DirectorAnimatedActionParams = DirectorAnimation;

    type DirectorSceneAnimatedActionParams = DirectorSceneAnimation;

    type DirectorSpecialEffectActionParams = DirectorSpecialEffect;

    type DirectorSceneSpecialEffectActionParams = DirectorSceneSpecialEffect;

    type BaseDirectorAction<
        K extends DramatizeEnums.ActionKind,
        P extends LibTypes.Reference | null,
    > = LibTypes.Define<{
        kind: K,
        delayMS: LibTypes.Nullable<number>,
        params: P,
    }>;

    type DirectorSetStyleAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.SetStyle,
        DirectorSetStyleActionParams
    >;
    type DirectorSetStyleFromElementAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.SetStyleFromElement,
        DirectorSetStyleFromElementActionParams
    >;

    type DirectorSceneSetStyleAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.SceneSetStyle,
        DirectorSceneSetStyleActionParams
    >;

    type DirectorAnimatedAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.Animation,
        DirectorAnimatedActionParams
    >;

    type DirectorSceneAnimatedAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.SceneAnimation,
        DirectorSceneAnimatedActionParams
    >;

    type DirectorSpecialEffectAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.AddSpecialEffect,
        DirectorSpecialEffectActionParams
    >;

    type DirectorSceneSpecialEffectAction = BaseDirectorAction<
        DramatizeEnums.ActionKind.SceneSpecialEffect,
        DirectorSceneSpecialEffectActionParams
    >;

    type ActionUnion =
        | DirectorAnimatedAction
        | DirectorSceneAnimatedAction
        | DirectorSceneSetStyleAction
        | DirectorSceneSpecialEffectAction
        | DirectorSetStyleAction
        | DirectorSpecialEffectAction;

    type DirectorVisualActionUnion =
        | DirectorAnimatedAction
        | DirectorSetStyleAction
        | DirectorSetStyleFromElementAction
        | DirectorSpecialEffectAction;

    type DirectorSceneActionUnion =
        | DirectorSceneAnimatedAction
        | DirectorSceneSetStyleAction
        | DirectorSceneSpecialEffectAction;
}

export declare namespace DramatizeTypes {
    type Hotspots = LibTypes.VarGeneralObj<
        Partial<StyleTypes.Coordinate>,
        DramatizeEnums.OriginKind
    >;

    type ResourceAttr = LibTypes.FrozenDefine<{
        resourceId: ResourceId,
    }>;

    type DirectorPlayAttr = LibTypes.VarDefine<{
        play: boolean,
        speed?: number,
        loop?: boolean,
    }>;

    type DirectorVolumeAttr = LibTypes.VarDefine<{
        volume?: number,
    }>;

    type BaseDirectorStyle = LibTypes.VarDefine<{
        x?: number,
        y?: number,
        z?: number,

        scale?: number, // 0-正无穷 默认1  填1.5表示放大50%
        rotation?: number, // 0-360 默认0
        opacity?: number, // 0-1 默认1
        brightness?: number, // 0～正无穷 默认1 0是全黑，填2表示两倍亮度
        blur?: number, // 0-1 默认0

        color?: string | null, // null 为清空
    }>;

    type DirectorSceneStyle = LibTypes.VarDefine<
        LibTypes.VarOmit<BaseDirectorStyle, 'z'> & {
            sharpness?: number, // 锐化 0-正无穷 默认0
            overlayColor?: string | null, // 遮罩颜色
            overlayOpacity?: number, // 遮罩透明度
        }
    >;

    type DirectorRelativeStyle = LibTypes.VarDefine<{
        relativeScale?: number,
    }>;

    type DirectorVisualStyle = BaseDirectorStyle;

    type DirectorStyle = LibTypes.Simplify<
        DirectorSceneStyle & DirectorVisualStyle
    >;

    type DirectorAnimationStyle = LibTypes.VarDefine<
        BaseDirectorStyle & DirectorRelativeStyle
    >;

    type CurrentAnimationStyle = BaseDirectorStyle;

    type DirectorAnimation = LibTypes.VarDefine<{
        style: DirectorAnimationStyle,
        readonly durationMS?: number | null,
        readonly repeat?: UnitAnimatedRepeat | null,
    }>;

    type DirectorSceneAnimatedStyle = LibTypes.VarDefine<
        DirectorRelativeStyle & DirectorSceneStyle
    >;

    type SceneCurrentAnimationStyle = DirectorSceneStyle;

    type DirectorSceneAnimation = LibTypes.VarDefine<{
        style: DirectorSceneAnimatedStyle,
        readonly durationMS?: number | null,
        readonly repeat?: UnitAnimatedRepeat | null,
        readonly speed?: number,
    }>;

    type DirectorVisualStyleAttrGetter = LibTypes.VarDefine<{
        get show(): boolean,
    }>;

    type DirectorVisualStyleAttr = LibTypes.VarDefine<
        DirectorVisualStyleAttrGetter & {
            controlShow: boolean,
            style?: DirectorVisualStyle,
            currentAnimationStyle?: CurrentAnimationStyle,
            translate?: Partial<StyleTypes.Coordinate>,
            anchor?: Partial<StyleTypes.Coordinate>,

            originKind?: DramatizeEnums.OriginKind,
            selfOriginKind?: DramatizeEnums.OriginKind,
        }
    >;

    type VisualEventMap = LibTypes.FrozenDefine<{
        breakAnimations: LibTypes.Asyncable<
            LibTypes.Nullable<CurrentAnimationStyle>,
            []
        >,
        removeSpecialEffects: LibTypes.Asyncable<void, []>,
        runVisualAnimation: LibTypes.Func<void, [animation: DirectorAnimation]>,
        runVisualSpecialEffect: LibTypes.Func<
            void,
            [specialEffect: DirectorSpecialEffect]
        >,
    }>;

    type DirectorVisualAttr = LibTypes.VarDefine<
        ReturnType<typeof EventUtils.define<VisualEventMap>> & {
            readonly parentId: ElementId | null,
            readonly dimensionsScale?: number,
            readonly hotspots?: LibTypes.Nullable<Hotspots>,
            readonly actions: LibTypes.VarArr<DirectorVisualActionUnion>,
            readonly isSingle: boolean,
            extraZ?: number | null, // TODO 临时方案
        }
    >;

    type VisualState =
        | DirectorFramesElement['state']
        | DirectorImageElement['state'];

    type BaseElementState = LibTypes.VarDefine<{
        isReady?: boolean,
        isActionsExecuted?: boolean,
    }>;

    type BaseDirectorElement<
        K extends DramatizeEnums.UnitKind,
        S extends LibTypes.FrozenGeneralObj,
    > = LibTypes.VarDefine<{
        readonly id: ElementId,
        readonly kind: K,
        readonly state: BaseElementState & S,
    }>;

    type DirectorVisualElementKind =
        | DramatizeEnums.UnitKind.Frames
        | DramatizeEnums.UnitKind.Image;

    type DirectorImageElement = LibTypes.RequiredKeepUndefined<
        LibTypes.Define<
            BaseDirectorElement<
                DramatizeEnums.UnitKind.Image,
                DirectorVisualStyleAttr
            > &
                DirectorVisualAttr &
                ResourceAttr &
                StyleTypes.Dimensions & {
                    file: FileTypes.ImageResource,
                },
            'extraZ'
        >
    >;

    type DirectorFramesElement = LibTypes.RequiredKeepUndefined<
        LibTypes.Define<
            BaseDirectorElement<
                DramatizeEnums.UnitKind.Frames,
                DirectorPlayAttr & DirectorVisualStyleAttr
            > &
                DirectorVisualAttr &
                ResourceAttr &
                StyleTypes.Dimensions & {
                    meta: StyleTypes.Dimensions,
                    files: LibTypes.Arr<FileTypes.ImageResource>,
                },
            'extraZ'
        >
    >;

    type DirectorAudioElement = LibTypes.RequiredKeepUndefined<
        LibTypes.Define<
            BaseDirectorElement<
                DramatizeEnums.UnitKind.Audio,
                DirectorPlayAttr &
                    DirectorVolumeAttr & {
                        isEnd?: boolean,
                    }
            > &
                ResourceAttr & {
                    cache: boolean, // TODO 后面看有没有必要做缓存
                    file: FileTypes.AudioResource,
                }
        >
    >;

    type DirectorVisualElement = DirectorFramesElement | DirectorImageElement;

    type DirectorElement = DirectorAudioElement | DirectorVisualElement;

    type DirectorPlace = LibTypes.Define<{
        backgroundElement: DirectorFramesElement | DirectorImageElement,
        name: string,
        desc: string,
        isReset: boolean,
        showProfile: boolean,
    }>;

    type DirectorMusic = LibTypes.Define<{
        prevElement: DirectorAudioElement | null,
        element: DirectorAudioElement | null,
        isChange: boolean,
    }>;

    type DirectorScene = LibTypes.Define<{
        effectElements: LibTypes.Arr<DirectorFramesElement>,
        actions: LibTypes.Arr<DirectorSceneActionUnion>,
    }>;

    type DirectorCaptions = LibTypes.Define<{
        roleName: string | null,
        text: string,
        isMe: boolean,
        ttsElement: DirectorAudioElement | null,
    }>;

    type DirectorRole = LibTypes.Define<{
        index: number,

        roleName: string,
        roleDesc: string,
        species: CharacterEnums.Species,
        gender: CharacterEnums.Gender,
        showProfile: boolean,

        appearanceElement: DirectorImageElement | null,

        effectElements: LibTypes.VarArr<DirectorFramesElement>,
    }>;

    type DirectorInteraction = LibTypes.Define<{
        options: LibTypes.Arr<OptionItem>,
        lastValue: string | null,
        timeoutMS?: number | null,
        timeoutValue?: string | null,
        achievement?: WorldLineTypes.Api.Achievement | null,
        discovered?: LibTypes.Arr<string> | null,
        isEnd?: boolean,
    }>;

    type Director = LibTypes.Define<{
        scene: DirectorScene,
        place: DirectorPlace | null,
        music: DirectorMusic | null,
        captions: DirectorCaptions,
        ambient: DirectorAudioElement | null,
        voiceFx: DirectorAudioElement | null,
        roles: LibTypes.Arr<DirectorRole>,
        layoutMaterials: LibTypes.Arr<DirectorFramesElement>,
        interaction: DirectorInteraction | null,
    }>;
}
