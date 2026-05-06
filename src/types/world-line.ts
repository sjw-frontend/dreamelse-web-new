import type { CharacterEnums, WorldLineEnums } from '$/enums';
import type {
    ApiTypes,
    DataStoreTypes,
    DramatizeTypes,
    FileTypes,
    ScriptTypes,
} from '$/types';

export declare namespace WorldLineTypes {
    type WorldLineId = string;

    type InitialWorldLineState = LibTypes.VarDefine<{
        readonly id: WorldLineId,
        title: string,
        tags: LibTypes.Arr<ScriptTypes.Tag>,
        hotMsg: string,
        cover: FileTypes.ImageResource | null,
        coverRoles: LibTypes.Arr<FileTypes.ImageResource>,
        backgroundColor: string | null,
        actCount: number,
        achievements: LibTypes.Arr<Achievement>,
        lastPlayTime?: number,
    }>;

    type WorldLineState = LibTypes.VarDefine<InitialWorldLineState>;

    type WorldLineAttrs = LibTypes.VarDefine<{
        scriptId: string,
        roleId: string | null,
    }>;

    type WorldLineInfo = DataStoreTypes.DataItem<
        WorldLineState,
        WorldLineAttrs
    >;

    type FrozenWorldLineInfo = LibTypes.FrozenDefine<WorldLineInfo>;
}

export declare namespace WorldLineTypes {
    type Achievement = LibTypes.FrozenDefine<{
        id: string,
        title: string,
        desc: string,
    }>;
}

export declare namespace WorldLineTypes {
    namespace Api {
        type MotionStyle =
            | DramatizeTypes.DirectorAnimationStyle
            | DramatizeTypes.DirectorSceneAnimatedStyle
            | DramatizeTypes.DirectorSceneStyle
            | DramatizeTypes.DirectorVisualStyle;

        type MotionFromStyle =
            | DramatizeTypes.DirectorSceneStyle
            | DramatizeTypes.DirectorVisualStyle;

        type MotionToStyle =
            | DramatizeTypes.DirectorAnimationStyle
            | DramatizeTypes.DirectorSceneAnimatedStyle;

        type Achievement = LibTypes.FrozenDefine<{
            title: string,
            description: string,
        }>;

        type Motion = ElementMotion | SceneMotion;

        type SceneMotion = LibTypes.VarDefine<{
            start?: number, // MS
            end?: number, // MS
            loop?: DramatizeTypes.UnitAnimatedRepeat,
            from?: DramatizeTypes.DirectorSceneStyle,
            to?: DramatizeTypes.DirectorSceneAnimatedStyle,
        }>;

        type ElementMotion = LibTypes.VarDefine<{
            start?: number, // MS
            end?: number, // MS
            loop?: DramatizeTypes.UnitAnimatedRepeat,
            from?: DramatizeTypes.BaseDirectorStyle,
            to?: DramatizeTypes.DirectorAnimationStyle,
            visual_center?: 'default' | 'face',
            origin?: 'bottom' | 'center' | 'left' | 'right' | 'top',
            self_visual_center?: 'default' | 'face',
            self_origin?: 'bottom' | 'center' | 'left' | 'right' | 'top',
        }>;

        type Effect = LibTypes.FrozenDefine<{
            effect_id?: string,
            loop?: DramatizeTypes.UnitAnimatedRepeat,
        }>;

        type Actor = LibTypes.FrozenDefine<{
            slot?: number,
            pose?: string,
            motion?: ElementMotion,
            effects?: LibTypes.Arr<Effect>,
        }>;

        type Shot = LibTypes.VarDefine<
            Partial<{
                shot_id: number,
                delay?: number, // MS
                loop?: DramatizeTypes.UnitAnimatedRepeat,
                actors: LibTypes.Arr<Actor>,
                background?: {
                    motion?: ElementMotion,
                    effects?: LibTypes.Arr<Effect>,
                },
                scene?: {
                    motion?: SceneMotion,
                    effects?: LibTypes.Arr<Effect>,
                },
                materials?: LibTypes.Arr<{
                    key?: string,
                    type?: 'frames',
                    motion?: ElementMotion,
                    effects?: LibTypes.Arr<Effect>,
                }>,
            }>
        >;

        type Layout = LibTypes.VarDefine<{
            compositionInfo?: {
                name?: string,
                subjectSlots?: number,
                loop?: DramatizeTypes.UnitAnimatedRepeat,
            },
            shots?: LibTypes.Arr<Shot>,
        }>;

        type EffectCodeProps = LibTypes.FrozenDefine<{
            duration?: number,
            start_alpha?: number,
            target_alpha?: number,
            start_scale?: number,
            end_scale?: number,
            target_scale?: number,
            start_brightness?: number,
            end_brightness?: number,
            blur_range?: number,
            blur_strength?: number,
            shake_amplitude?: number,
            shake_speed?: number,
            black_line_width?: number,
            dot_size?: number,
            speed?: number,
        }>;

        type EffectCode = LibTypes.FrozenDefine<{
            kind: WorldLineEnums.ApiEffectCodeKind,
            props: EffectCodeProps | null,
        }>;

        type Narrative = LibTypes.VarDefine<
            LibTypes.SetFieldType<
                LibTypes.FrozenDefine<ApiTypes.Protocol.Narrative>,
                'index',
                bigint
            > & {
                isLastOne?: boolean,
            }
        >;

        type RawNarrative = LibTypes.VarDefine<
            ApiTypes.Protocol.Narrative & { isLastOne?: boolean }
        >;

        type NarrativeImage = LibTypes.RequiredKeepUndefined<
            LibTypes.FrozenDefine<{
                id: string,
                file: FileTypes.ImageResource,
                scale?: number,
            }>
        >;

        type NarrativeFrames = LibTypes.RequiredKeepUndefined<
            LibTypes.FrozenDefine<{
                id: string,
                files: LibTypes.Arr<FileTypes.ImageResource>,
                name?: string,
                scale?: number,

                speed?: LibTypes.Nullable<number>,
                loop?: boolean,
            }>
        >;

        type NarrativeBackground = LibTypes.RequiredKeepUndefined<
            LibTypes.FrozenDefine<
                NarrativeFrames & {
                    desc?: string,
                }
            >
        >;

        type NarrativeAudio = LibTypes.RequiredKeepUndefined<
            LibTypes.FrozenDefine<{
                id: string,
                file: FileTypes.AudioResource,
                volume?: number,

                speed?: number,
                loop?: boolean,
            }>
        >;

        type NarrativeLayout = LibTypes.RequiredKeepUndefined<
            LibTypes.Define<{
                id: string,
                layout: Layout,
            }>
        >;

        type NarrativeEffect = LibTypes.RequiredKeepUndefined<
            LibTypes.Define<{
                id: string,
                kind: WorldLineEnums.ApiEffectKind,
                frames?: NarrativeFrames,
                effectCode?: EffectCode | null,
                motion?: Motion | null,
            }>
        >;

        type NarrativeCharacter = LibTypes.RequiredKeepUndefined<
            LibTypes.FrozenDefine<{
                roleName: string,
                roleDesc: string,
                gender: CharacterEnums.Gender,
                species: CharacterEnums.Species,
                isMe: boolean,
            }>
        >;

        type ResourceKind = keyof ResourceRecord;
        type FramesResourceKind = keyof LibTypes.FrozenPick<
            ResourceRecord,
            'background' | 'effect'
        >;
        type ImageResourceKind = keyof LibTypes.FrozenPick<
            ResourceRecord,
            'background' | 'character_appearances'
        >;
        type AudioResourceKind = keyof LibTypes.FrozenPick<
            ResourceRecord,
            'ambient' | 'music' | 'tts' | 'voice_fx'
        >;

        type RawResource = Partial<ApiTypes.Protocol.NarrativeResource>;

        type ResourceRecord = LibTypes.Define<{
            background: LibTypes.VarGeneralObj<NarrativeBackground>,
            music: LibTypes.VarGeneralObj<NarrativeAudio>,
            layout: LibTypes.VarGeneralObj<NarrativeLayout>,
            ambient: LibTypes.VarGeneralObj<NarrativeAudio>,
            voice_fx: LibTypes.VarGeneralObj<NarrativeAudio>,
            effect: LibTypes.VarGeneralObj<NarrativeEffect>,
            tts: LibTypes.VarGeneralObj<NarrativeAudio>,
            character_appearances: LibTypes.VarGeneralObj<NarrativeImage>,
            characters: LibTypes.VarGeneralObj<NarrativeCharacter>,
        }>;

        type PlayInfo = LibTypes.Define<{
            narratives: LibTypes.Arr<Narrative>,
            resourceRecord: ResourceRecord,
        }>;
    }
}
