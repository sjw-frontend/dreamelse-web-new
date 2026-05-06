import { NavbarEnums, RouterEnums } from '$/enums';

export const Routes = [
    [RouterEnums.RouteName.Home, NavbarEnums.Kind.Default],
    [RouterEnums.RouteName.CharacterList, NavbarEnums.Kind.Default],
    // [RouterEnums.RouteName.Me, NavbarEnums.Kind.Default],
] as const;
