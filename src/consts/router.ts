import { RouterEnums } from '$/enums';

export const PreloadPageInstanceGetters = {
    [RouterEnums.RouteName.Home]: async () =>
        (await import('../pages/home/home-controller')).HomeController,
    [RouterEnums.RouteName.CharacterTimbreList]: async () =>
        (
            await import('../pages/character-timbre-list/character-timbre-list-controller')
        ).CharacterTimbreListController,
} as const;
