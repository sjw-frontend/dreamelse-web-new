// web版：替换 @react-navigation/native → TanStack Router
import { useRouterState } from '@tanstack/react-router';
import type { RouterTypes } from '$/types';
import { pathToRouteName } from '$/services/router-name-map';

export const useRouter = () => {
    const state = useRouterState();
    const match = state.matches.at(-1);
    const name = pathToRouteName(state.location.pathname);

    const route: RouterTypes.Route | null = match && name
        ? { name, key: match.id, params: match.params as RouterTypes.RouteParams }
        : null;

    return {
        route,
        isFocused: true,
    };
};
