import type { RouterEnums } from '$/enums';

import type { FetchTypes } from './fetch';

export declare namespace LinkingTypes {
    type ParseSearchParams<T extends RouteScheme> = LibTypes.Simplify<
        LibTypes.FrozenGeneralObj<
            FetchTypes.LooseSearchValue,
            LibTypes.ValueOf<T['searchKeys']>
        > &
            Partial<
                LibTypes.FrozenGeneralObj<
                    FetchTypes.LooseSearchValue,
                    LibTypes.ValueOf<T['optionalSearchKeys']>
                >
            >
    >;

    type RouteScheme = LibTypes.FrozenDefine<{
        path: RouterEnums.RouteName,
        searchKeys?: LibTypes.Arr<string>,
        optionalSearchKeys?: LibTypes.Arr<string>,
    }>;
}
