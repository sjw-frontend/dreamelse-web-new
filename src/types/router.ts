// @ts-nocheck
import type {
    CommonActions,
    PartialState,
    StackActionType,
    StackNavigationState,
    PartialRoute as _PartialRoute,
    Route as _Route,
    RouteConfig as _RouteConfig,
    RouteProp as _RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { PermissionEnums, RouterEnums } from '$/enums';

import type { CoreTypes } from './core';

export declare namespace RouterTypes {
    type RouteParamsObj = LibTypes.FrozenDefine<{
        ids?: LibTypes.Arr<LibTypes.Nullable<number | string>>,
        value?: boolean | number | string,
        title?: string,
        url?: string,
        preload?: true,
        preloadId?: number | null,
        pdfKind?: RouterEnums.PDFPageKind,
        permissionKind?: PermissionEnums.Kind,
        closeMode?: 'close' | 'text',
        options?: LibTypes.FrozenPick<
            NativeStackNavigationOptions,
            | 'animation'
            | 'animationDuration'
            | 'animationTypeForReplace'
            | 'presentation'
        >,
    }>;

    type RouteParams = RouteParamsObj | undefined;

    type RouteName = RouterEnums.RouteName;
    type RouteParamList = LibTypes.GeneralObj<RouteParams, RouteName>;

    type Route = _Route<RouteName, RouteParams>;
    type PartialRoute = _PartialRoute<Route>;
    type PartialableRoute = PartialRoute | Route;

    type RouteProp = _RouteProp<RouteParamList>;

    type RouteState = StackNavigationState<RouteParamList>;
    type PartialRouteState = PartialState<RouteState>;
    type PartialableRouteState = PartialRouteState | RouteState;

    type SimpleRoute = LibTypes.FrozenPick<Route, 'name' | 'params'>;
    type SimpleRouteWithController = LibTypes.Simplify<
        LibTypes.Define<{ ctrl?: CoreTypes.RenderController | null }> &
            LibTypes.FrozenPick<Route, 'name' | 'params'>
    >;

    type RouteWithRequiredParams = LibTypes.SetRequired<Route, 'params'>;

    type Operation = (routeName: RouteName, params?: RouteParams) => void;

    type DispatchActionType =
        | CommonActions.Action['type']
        | StackActionType['type'];
}
