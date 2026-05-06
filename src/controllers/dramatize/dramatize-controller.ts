import { BaseZoneController, zoneController } from '$/core';
import type { DramatizeTypes } from '$/types';

type InternalState = LibTypes.VarDefine<{
    dramatizeRecord: DramatizeTypes.DramatizeInfoRecord,
}>;

type State = LibTypes.FrozenPick<InternalState, 'dramatizeRecord'>;

@zoneController()
export class DramatizeController extends BaseZoneController<
    State,
    InternalState
> {
    public constructor() {
        super();
    }

    protected override getInitialInternalState(): InternalState {
        return {
            dramatizeRecord: {},
        };
    }
}
