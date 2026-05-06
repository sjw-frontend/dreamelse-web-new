import { type DramatizeEnums, WorldLineEnums } from '$/enums';
import type { DramatizeTypes, WorldLineTypes } from '$/types';

import { createFramesElementFromEffectInfo } from './element';
import {
    createEffectsActions,
    createSceneEffectsActions,
} from './handle-actions';

const innerHandleEffects = (
    params: LibTypes.VarDefine<{
        effects: LibTypes.Arr<WorldLineTypes.Api.Effect>,
        resourceRecord: WorldLineTypes.Api.ResourceRecord,
        scope: LibTypes.Nullable<DramatizeEnums.SpecialEffectScope>,
        parentId: DramatizeTypes.ElementId | null,
    }>,
) => {
    const { effects, resourceRecord, scope, parentId } = params;

    const actionEffects: LibTypes.VarArr<WorldLineTypes.Api.Effect> = [];
    const elements: LibTypes.VarArr<DramatizeTypes.DirectorFramesElement> = [];

    effects.forEach(item => {
        if (item.effect_id != null) {
            const effectInfo = resourceRecord.effect[item.effect_id];
            if (
                effectInfo?.kind === WorldLineEnums.ApiEffectKind.Code ||
                effectInfo?.kind === WorldLineEnums.ApiEffectKind.Motion
            ) {
                actionEffects.push(item);
            } else {
                const ele =
                    effectInfo &&
                    createFramesElementFromEffectInfo({
                        effectInfo,
                        scope,
                        parentId,
                    });
                ele && elements.push(ele);
            }
        }
    });

    return {
        actionEffects,
        elements,
    };
};

export const handleEffects = (
    params: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        effects: LibTypes.Arr<WorldLineTypes.Api.Effect>,
        dimensionsScale: LibTypes.Nullable<number>,
        resourceRecord: WorldLineTypes.Api.ResourceRecord,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
        scope?: DramatizeEnums.SpecialEffectScope,
        parentId: DramatizeTypes.ElementId | null,
    }>,
) => {
    const {
        effects,
        dimensionsScale,
        resourceRecord,
        baseDelayMS,
        repeat,
        scope,
        parentId,
    } = params;

    const actions: LibTypes.VarArr<DramatizeTypes.DirectorVisualActionUnion> =
        [];

    const { actionEffects, elements } = innerHandleEffects({
        effects,
        resourceRecord,
        scope,
        parentId,
    });

    actions.push(
        ...createEffectsActions({
            baseDelayMS,
            dimensionsScale,
            repeat,
            effects: actionEffects,
            resourceRecord,
        }),
    );

    return {
        elements,
        actions,
    };
};

export const handleSceneEffects = (
    params: LibTypes.VarDefine<{
        baseDelayMS: LibTypes.Nullable<number>,
        effects: LibTypes.Arr<WorldLineTypes.Api.Effect>,
        resourceRecord: WorldLineTypes.Api.ResourceRecord,
        repeat: LibTypes.Nullable<DramatizeTypes.UnitAnimatedRepeat>,
        scope?: DramatizeEnums.SpecialEffectScope,
        parentId: DramatizeTypes.ElementId | null,
    }>,
) => {
    const { effects, resourceRecord, baseDelayMS, repeat, scope, parentId } =
        params;

    const sceneActions: LibTypes.VarArr<DramatizeTypes.DirectorSceneActionUnion> =
        [];

    const { actionEffects, elements } = innerHandleEffects({
        effects,
        resourceRecord,
        scope,
        parentId,
    });

    sceneActions.push(
        ...createSceneEffectsActions({
            baseDelayMS,
            repeat,
            effects: actionEffects,
            resourceRecord,
        }),
    );

    return {
        elements,
        sceneActions,
    };
};
