import type { FileService } from '$/services';
import type { WorldLineTypes } from '$/types';
import { FileUtils } from '$/utils';

export const createEmptyResourceRecord = (): WorldLineTypes.Api.ResourceRecord => ({
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
            if (resourceRecord.background[item.id]) return;
            resourceRecord.background[item.id] = {
                id: item.id,
                files: item.images?.map(img =>
                    fileService.createImageResource(img.id, FileUtils.getImageInfoFromApiInfo(img))) ?? [],
                name: item.name,
                desc: item.desc,
                scale: item.scale,
                speed: item.frame_rate == null ? null : item.frame_rate / 60,
                loop: item.loop,
            };
        } catch {}
    });

    resource.tts?.forEach(item => {
        try {
            if (resourceRecord.tts[item.id]) return;
            resourceRecord.tts[item.id] = {
                id: item.id,
                file: fileService.createAudioResource(
                    item.voice_media.id,
                    FileUtils.getAudioInfoFromApiInfo(item.voice_media),
                    { cache: false },
                ),
                volume: item.default_volume,
                speed: item.speed,
                loop: false,
            };
        } catch {}
    });

    resource.character_appearances?.forEach(item => {
        try {
            if (resourceRecord.character_appearances[item.id]) return;
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

    return resourceRecord;
};
