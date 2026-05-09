import { useMemo, useState, useEffect } from 'react';
import { createZone } from '$/core';
import type { ReactTypes } from '$/types';
import { ZoneContext } from '../contexts/zone';
import { UserController } from '$/controllers';

export const ZoneProvider: ReactTypes.FCWC = ({ children }) => {
    const zone = useMemo(createZone, []);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const userController = zone.getZoneController(UserController);
        userController.loginByCache().then(() => setReady(true));
    }, [zone]);

    return (
        <ZoneContext value={zone}>
            {ready ? children : null}
        </ZoneContext>
    );
};
