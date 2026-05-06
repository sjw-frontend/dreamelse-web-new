import { createContext } from 'react';
import type { useInitialPopup } from '../root-container/@com';

export const PopupHelperContext = createContext<
    ReturnType<typeof useInitialPopup>['helper'] | null
>(null);
