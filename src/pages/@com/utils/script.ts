import type { ScriptController } from '$/controllers';
import type { RouterTypes } from '$/types';

export const getScriptInfoFromRoute = (
    route: LibTypes.Nullable<RouterTypes.Route>,
    scriptController: ScriptController,
) => {
    const id = route?.params?.ids?.[0]?.toString();
    if (id != null) {
        return scriptController.getScript(id) ?? null;
    }
    return null;
};
