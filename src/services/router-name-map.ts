// 路由名称 ↔ URL path 双向映射
import { RouterEnums } from '$/enums';

export const routeNameToPath: Record<RouterEnums.RouteName, string> = {
    [RouterEnums.RouteName.Splash]:                 '/',
    [RouterEnums.RouteName.Home]:                   '/home',
    [RouterEnums.RouteName.Login]:                  '/login',
    [RouterEnums.RouteName.CharacterList]:          '/characters',
    [RouterEnums.RouteName.CharacterCreate]:        '/characters/create',
    [RouterEnums.RouteName.CharacterDetails]:       '/characters/$characterId',
    [RouterEnums.RouteName.CharacterInteraction]:   '/characters/$characterId/interaction',
    [RouterEnums.RouteName.CharacterSchedule]:      '/characters/$characterId/schedule',
    [RouterEnums.RouteName.CharacterStats]:         '/characters/$characterId/stats',
    [RouterEnums.RouteName.CharacterRelationships]: '/characters/$characterId/relationships',
    [RouterEnums.RouteName.CharacterTimbreList]:    '/characters/$characterId/timbre',
    [RouterEnums.RouteName.ScriptPreparePlay]:      '/scripts/$scriptId/prepare',
    [RouterEnums.RouteName.ScriptEdit]:             '/scripts/$scriptId/edit',
    [RouterEnums.RouteName.ScriptRoleEdit]:         '/scripts/$scriptId/role-edit',
    [RouterEnums.RouteName.ScriptDraft]:            '/scripts/draft',
    [RouterEnums.RouteName.PlayScriptOpening]:      '/play/$playId/opening',
    [RouterEnums.RouteName.PlayScript]:             '/play/$playId',
    [RouterEnums.RouteName.PlayScriptHistory]:      '/play/$playId/history',
    [RouterEnums.RouteName.PlayCharacterOpening]:   '/play/character/$characterId/opening',
    [RouterEnums.RouteName.Me]:                     '/me',
    [RouterEnums.RouteName.UserSettings]:           '/me/settings',
    [RouterEnums.RouteName.About]:                  '/me/about',
    [RouterEnums.RouteName.CancelAccount]:          '/me/cancel',
    [RouterEnums.RouteName.PDF]:                    '/pdf',
    [RouterEnums.RouteName.Web]:                    '/webview',
    [RouterEnums.RouteName.PermissionDenied]:       '/permission-denied',
};

const pathToRouteNameMap = Object.fromEntries(
    Object.entries(routeNameToPath).map(([name, path]) => [path, name]),
) as Record<string, RouterEnums.RouteName>;

export const pathToRouteName = (pathname: string): RouterEnums.RouteName | null => {
    if (pathToRouteNameMap[pathname]) return pathToRouteNameMap[pathname];
    for (const [name, pattern] of Object.entries(routeNameToPath)) {
        const regex = new RegExp(
            '^' + pattern.replace(/\$[^/]+/g, '[^/]+') + '$',
        );
        if (regex.test(pathname)) return name as RouterEnums.RouteName;
    }
    return null;
};
