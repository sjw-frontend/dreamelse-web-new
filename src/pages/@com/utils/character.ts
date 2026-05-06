import type { CharacterController } from '$/controllers';
import type { RouterTypes } from '$/types';

export const getCharacterInfoFromRoute = (
    route: LibTypes.Nullable<RouterTypes.Route>,
    characterController: CharacterController,
) => {
    const id = route?.params?.ids?.[0]?.toString();
    if (id != null) {
        return characterController.getCharacter(id) ?? null;
    }
    return null;
};

export const getMaySetupCharacterInfoFromRoute = (
    route: LibTypes.Nullable<RouterTypes.Route>,
    characterController: CharacterController,
) => {
    const id = route?.params?.ids?.[0]?.toString();
    if (id != null) {
        return characterController.getCharacter(id) ?? null;
    }
    return null;
};

export const getIdFromRoute = (route: LibTypes.Nullable<RouterTypes.Route>) =>
    route?.params?.ids?.[0];

export const getIdsFromRoute = (route: LibTypes.Nullable<RouterTypes.Route>) =>
    route?.params?.ids;
