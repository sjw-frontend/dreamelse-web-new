import { useMemo } from 'react';
import { createZone } from '$/core';
import type { ReactTypes } from '$/types';
import { ZoneContext } from '../contexts/zone';

export const ZoneProvider: ReactTypes.FCWC = ({ children }) => {
    const zone = useMemo(createZone, []);

    return <ZoneContext value={zone}>{children}</ZoneContext>;
};
