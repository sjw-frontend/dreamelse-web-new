import { useContext } from 'react';

import { PopupHelperContext } from '../view/contexts';

export const usePopup = () => {
    const popup = useContext(PopupHelperContext);

    if (popup == null) {
        throw new Error(
            'usePopupHelper only allow call under PopupHelperContext',
        );
    }
    return popup;
};
