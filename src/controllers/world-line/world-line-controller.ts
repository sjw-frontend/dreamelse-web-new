import { BaseZoneController, zoneController } from '$/core';
import { DataStoreDomain } from '$/domains';
import { ApiService, FileService } from '$/services';
import type { ApiTypes, WorldLineTypes } from '$/types';
import { FileUtils } from '$/utils';

import { Settings } from './world-line-const';

type InternalState = LibTypes.GeneralObj;

type State = LibTypes.GeneralObj;

@zoneController()
export class WorldLineController extends BaseZoneController<
    State,
    InternalState
> {
    public constructor(apiService: ApiService, fileService: FileService) {
        super();
        this.#apiService = apiService;
        this.#fileService = fileService;
    }

    readonly #apiService;
    readonly #fileService;

    readonly #worldLineDataStore = this.getDomain(
        DataStoreDomain<
            WorldLineTypes.WorldLineState,
            WorldLineTypes.WorldLineAttrs
        >,
        {
            dataSizeLimit: Settings.dataSizeLimit,
        },
    );

    //#region get value

    public readonly setWorldLineState = this.#worldLineDataStore.setState;
    public readonly getWorldLine = this.#worldLineDataStore.get;

    //#endregion

    #createFromApiInfo(apiInfo: ApiTypes.Protocol.PlayEntity) {
        const info: WorldLineTypes.InitialWorldLineState = {
            id: apiInfo.play_id,
            title: apiInfo.title,
            tags: apiInfo.tags.map(item => ({
                id: item,
                label: item,
            })),
            hotMsg: apiInfo.corner_tag,
            cover: apiInfo.bkg_media
                ? this.#fileService.createImageResource(
                      apiInfo.bkg_media.id,
                      FileUtils.getImageInfoFromApiInfo(apiInfo.bkg_media),
                  )
                : null,
            backgroundColor: apiInfo.bkg_main_color ?? null,
            coverRoles:
                apiInfo.appearance_medias?.map(item =>
                    this.#fileService.createImageResource(
                        item.id,
                        FileUtils.getImageInfoFromApiInfo(item),
                    )) ?? [],
            actCount: apiInfo.act_count,
            achievements: apiInfo.achievements.map((item, index) => ({
                id: index.toString(),
                title: item.title,
                desc: '',
            })),
            lastPlayTime: apiInfo.last_play_time,
            // readonly id: WorldLineId,
            // isInitializing: boolean,
            // title: string,
            // tags: LibTypes.Arr<ScriptTypes.Tag>,
            // cover: FileTypes.SimpleVisual | null,
            // coverRoles: LibTypes.Arr<FileTypes.SimpleVisual>,
            // backgroundColor: string | null,
            // actCount: number,
            // achievements: LibTypes.Arr<Achievement>,
        };

        return info;
    }

    protected override getInitialInternalState(): InternalState {
        return {
            worldLineRecord: {},
        };
    }

    public readonly requestMyPlayList = async (nextCursor: string | null) => {
        const res = await this.#apiService.call.user.play_history({
            limit: Settings.limit,
            cursor: nextCursor ?? undefined,
        });

        const ids = res.list.map(
            item =>
                this.#worldLineDataStore.upsert({
                    id: item.play_id,
                    isLocal: false,
                    state: this.#createFromApiInfo(item),
                    scriptId: item.script_id,
                    roleId: item.play_role_id ?? null,
                }).id,
        );

        return {
            ids,
            hasMore: res.has_more,
            nextCursor: res.next_cursor ?? null,
        };
    };
}
