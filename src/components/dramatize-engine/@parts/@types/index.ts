import type { DramatizeTypes } from '$/types';

export type CanavsObjRef = LibTypes.FrozenDefine<{
    breakAnimations: LibTypes.Asyncable<DramatizeTypes.DirectorStyle, []>,
    removeSpecialEffects: LibTypes.Asyncable<void, []>,
}>;
