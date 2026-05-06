import { DeviceService } from '$/services';

import { useZone } from './use-zone';

export const useDevice = () => {
    const zone = useZone();
    return zone.getService(DeviceService);
};
