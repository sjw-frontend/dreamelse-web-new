import { CharacterEnums, WorldLineEnums } from '$/enums';
import type { FileService } from '$/services';
import type { DramatizeTypes, WorldLineTypes } from '$/types';
import { FileUtils, JSONUtils } from '$/utils';

import { FramesNormalSpeedFPS } from './consts';

type HandleTargetStyle = LibTypes.VarPick<
    DramatizeTypes.BaseDirectorStyle,
    'scale' | 'z'
>;

type HandleTargetAnimationStyle = DramatizeTypes.DirectorRelativeStyle &
    HandleTargetStyle;

export const handleAnimationStyle = <T extends HandleTargetAnimationStyle>(
    targetStyle: LibTypes.Nullable<HandleTargetStyle>,
    animationStyle: T,
    extraZ: LibTypes.Nullable<number>,
): T => {
    const result = {
        ...animationStyle,
    };

    if (result.scale == null && animationStyle.relativeScale != null) {
        result.scale = (targetStyle?.scale ?? 1) * animationStyle.relativeScale;
    }

    if (result.z != null && extraZ != null) {
        result.z += extraZ;
    }

    return result;
};

export const createEmptyResourceRecord =
    (): WorldLineTypes.Api.ResourceRecord => ({
        background: {},
        music: {},
        layout: {},
        ambient: {},
        voice_fx: {},
        effect: {},
        tts: {},
        character_appearances: {},
        characters: {},
    });

export const insertResourceRecord = (
    resource: WorldLineTypes.Api.RawResource,
    resourceRecord: WorldLineTypes.Api.ResourceRecord,
    fileService: FileService,
) => {
    resource.background?.forEach(item => {
        try {
            if (resourceRecord.background[item.id]) {
                return;
            }
            resourceRecord.background[item.id] = {
                id: item.id,
                files:
                    item.images?.map(img =>
                        fileService.createImageResource(
                            img.id,
                            FileUtils.getImageInfoFromApiInfo(img),
                        )) ?? [],
                name: item.name,
                desc: item.desc,
                scale: item.scale,
                speed:
                    item.frame_rate == null
                        ? null
                        : item.frame_rate / FramesNormalSpeedFPS,
                loop: item.loop,
            };
        } catch {}
    });
    resource.music?.forEach(item => {
        try {
            if (resourceRecord.music[item.id]) {
                return;
            }

            resourceRecord.music[item.id] = {
                id: item.id,
                file: fileService.createAudioResource(
                    item.voice_media.id,
                    FileUtils.getAudioInfoFromApiInfo(item.voice_media),
                ),
                volume: item.default_volume,
                speed: item.speed,
                loop: true,
            };
        } catch {}
    });
    resource.layout?.forEach(item => {
        try {
            if (resourceRecord.layout[item.id]) {
                return;
            }

            const layout = JSONUtils.tryParse<WorldLineTypes.Api.Layout>(
                item.json,
            );
            if (layout) {
                resourceRecord.layout[item.id] = {
                    id: item.id,
                    layout,
                };
            }
        } catch {}
    });
    resource.ambient?.forEach(item => {
        try {
            if (resourceRecord.ambient[item.id]) {
                return;
            }

            resourceRecord.ambient[item.id] = {
                id: item.id,
                file: fileService.createAudioResource(
                    item.voice_media.id,
                    FileUtils.getAudioInfoFromApiInfo(item.voice_media),
                ),
                volume: item.default_volume,
                speed: item.speed,
                loop: item.is_loop,
            };
        } catch {}
    });
    resource.voice_fx?.forEach(item => {
        try {
            if (resourceRecord.voice_fx[item.id]) {
                return;
            }

            resourceRecord.voice_fx[item.id] = {
                id: item.id,
                file: fileService.createAudioResource(
                    item.voice_media.id,
                    FileUtils.getAudioInfoFromApiInfo(item.voice_media),
                ),
                volume: item.default_volume,
                speed: item.speed,
                loop: item.is_loop,
            };
        } catch {}
    });
    resource.tts?.forEach(item => {
        try {
            if (resourceRecord.tts[item.id]) {
                return;
            }

            resourceRecord.tts[item.id] = {
                id: item.id,
                file: fileService.createAudioResource(
                    item.voice_media.id,
                    FileUtils.getAudioInfoFromApiInfo(item.voice_media),
                    {
                        cache: false,
                    },
                ),
                volume: item.default_volume,
                speed: item.speed,
                loop: false,
            };
        } catch {}
    });
    resource.effect?.forEach(item => {
        try {
            if (resourceRecord.effect[item.id]) {
                return;
            }

            const effectCodeProps =
                item.effect_code &&
                JSONUtils.tryParse<WorldLineTypes.Api.EffectCodeProps>(
                    item.effect_code.props,
                );

            const motion =
                item.motion &&
                JSONUtils.tryParse<WorldLineTypes.Api.Motion>(
                    item.motion.props,
                );

            resourceRecord.effect[item.id] = {
                id: item.id,
                kind: item.effect_type,
                frames: item.frames && {
                    id: item.id,
                    files:
                        item.frames.images?.map(img =>
                            fileService.createImageResource(
                                img.id,
                                FileUtils.getImageInfoFromApiInfo(img),
                            )) ?? [],
                    name: item.frames.name,
                    scale: undefined,
                    speed:
                        item.frames.frame_rate == null
                            ? null
                            : item.frames.frame_rate / FramesNormalSpeedFPS,

                    loop: item.frames.loop,
                },
                effectCode: item.effect_code &&
                    effectCodeProps && {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        kind: item.effect_code
                            .effect_name as WorldLineEnums.ApiEffectCodeKind,
                        props: effectCodeProps,
                    },
                motion,
            };
        } catch {}
    });
    resource.character_appearances?.forEach(item => {
        try {
            if (resourceRecord.character_appearances[item.id]) {
                return;
            }

            resourceRecord.character_appearances[item.id] = {
                id: item.id,
                file: fileService.createImageResource(
                    item.appearance_media.id,
                    FileUtils.getImageInfoFromApiInfo(item.appearance_media),
                ),
                scale: item.scale,
            };
        } catch {}
    });
    resource.characters?.forEach(item => {
        try {
            if (resourceRecord.characters[item.role_name]) {
                return;
            }

            resourceRecord.characters[item.role_name] = {
                roleName: item.role_name,
                roleDesc: item.role_identities?.[0] ?? '',
                gender:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                    item.gender === CharacterEnums.ApiGender.Boy
                        ? CharacterEnums.Gender.Boy
                        : item.gender === CharacterEnums.ApiGender.Girl // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
                          ? CharacterEnums.Gender.Girl
                          : CharacterEnums.Gender.Other,
                species:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                    item.species === CharacterEnums.ApiSpecies.Man
                        ? CharacterEnums.Species.Man
                        : CharacterEnums.Species.Obj,
                isMe: item.is_me,
            };
        } catch {}
    });

    return resourceRecord;
};

export const calculateCaptionsDelayMS = (text: string) => {
    const len = text.length;
    if (len <= 20) {
        return len * 200;
    }

    return 20 * 200 + (len - 20) * 100;
};
