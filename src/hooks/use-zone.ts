import { useContext } from 'react';

import { ZoneContext } from '../view/contexts';

export const useZone = () => {
    const zone = useContext(ZoneContext);
    if (zone == null) {
        throw new Error('useZone only allow call under ZoneContext');
    }
    return zone;
};
