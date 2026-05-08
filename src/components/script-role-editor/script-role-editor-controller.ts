// @ts-nocheck
import _ from 'lodash';

import type { CharacterEditorController } from '$/component-controllers';
import { CharacterController, ScriptController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { AppError } from '$/errors';
import type { CharacterTypes, ScriptTypes } from '$/types';
import { ErrUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    _data: ScriptTypes.RoleInfo | null,
    get data(): ScriptTypes.RoleInfo,
    currentRoleId: string | null,
    showMulitpleEditerDialog: boolean,
    multipleDialogEditKey:
        | 'backgroundDesc'
        | 'secret'
        | 'supplementBackgroundDesc'
        | null,
    editValue: string,
    showPickList: boolean,
    showCharacterEditor: boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'currentRoleId'
    | 'data'
    | 'editValue'
    | 'multipleDialogEditKey'
    | 'showCharacterEditor'
    | 'showMulitpleEditerDialog'
    | 'showPickList'
>;

type EventMap = LibTypes.FrozenDefine<{
    showPickList: LibTypes.SimpleFunction,
    finishPick: LibTypes.Func<void, [string]>,
    createCharacter: LibTypes.Func<void, [task: LibTypes.Asyncable]>,
    createCharacterFail: LibTypes.Func<void, [msg: string]>,
    duplicateRoleName: LibTypes.SimpleFunction,
}>;

type Props = LibTypes.FrozenDefine<{
    initialInfo: ScriptTypes.RoleInfo | null,
    role: ScriptTypes.RoleInfo | null,
    roleList: LibTypes.Arr<ScriptTypes.RoleInfo>,
    roleType?: 'fixed' | 'npc' | 'open' | null,
    onConfirm?: LibTypes.Func<void, [ScriptTypes.RoleInfo]>,
    onClose?: LibTypes.SimpleFunction,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    characterEditorCtrl: CharacterEditorController,
}>;

@renderController()
export class ScriptRoleEditorController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(
        characterController: CharacterController,
        scriptController: ScriptController,
    ) {
        super();
        this.#characterController = characterController;
        this.#scriptController = scriptController;
    }

    readonly #characterController;
    readonly #scriptController;

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            _data: null,
            get data() {
                this._data ??=
                    $this.props.role ??
                    ($this.props.initialInfo
                        ? $this.#scriptController.cloneNewRole(
                              $this.props.initialInfo,
                          )
                        : null);

                if (!this._data) {
                    throw new AppError(
                        'ScriptRoleEditorController getInitialInternalState: data 不能为空',
                    );
                }

                return this._data;
            },
            currentRoleId: null,
            showMulitpleEditerDialog: false,
            multipleDialogEditKey: null,
            editValue: '',
            showPickList: false,
            showCharacterEditor: false,
        };
    }

    public readonly updateRoleBackground = (value: string) => {
        this.#scriptController.setRoleState(
            this.internal.data.id,
            'backgroundDesc',
            value,
        );
    };

    public readonly updateRoleIdentities = (
        value: LibTypes.VarArr<ScriptTypes.Identity>,
    ) => {
        this.#scriptController.setRoleState(
            this.internal.data.id,
            'identities',
            value,
        );
    };

    public readonly updateRoleSecret = (value: string) => {
        this.#scriptController.setRoleState(
            this.internal.data.id,
            'secret',
            value,
        );
    };

    public readonly updateCharacterId = (value: string) => {
        this.#scriptController.setRoleState(
            this.internal.data.id,
            'characterId',
            value,
        );
    };

    public readonly showPickList = () => {
        this.internal.showPickList = true;
    };

    public readonly hidePickList = () => {
        this.internal.showPickList = false;
    };

    public readonly onClose = () => {
        this.internal.editValue = '';
    };

    public readonly changeMultipleEditValue = (value: string) => {
        this.internal.editValue = value;
    };

    public readonly finishEditMultipleEditValue = (value: string) => {
        if (this.internal.multipleDialogEditKey == null) {
            return;
        }
        this.#scriptController.setRoleState(
            this.internal.data.id,
            this.internal.multipleDialogEditKey,
            value,
        );
    };

    public readonly closeMultipleEditDialog = () => {
        this.internal.showMulitpleEditerDialog = false;
        this.internal.multipleDialogEditKey = null;
        this.internal.editValue = '';
    };

    public readonly startEditRoleBackground = () => {
        this.internal.showMulitpleEditerDialog = true;
        this.internal.multipleDialogEditKey = 'backgroundDesc';
        this.internal.editValue = this.internal.data.state.backgroundDesc;
    };

    public readonly startEditRoleSupplementBackground = () => {
        this.internal.showMulitpleEditerDialog = true;
        this.internal.multipleDialogEditKey = 'supplementBackgroundDesc';
        this.internal.editValue =
            this.internal.data.state.supplementBackgroundDesc ?? '';
    };

    public readonly startEditRoleSecret = () => {
        this.internal.showMulitpleEditerDialog = true;
        this.internal.multipleDialogEditKey = 'secret';
        this.internal.editValue = this.internal.data.state.secret;
    };

    public readonly handleCharacterConfirm = (
        character: CharacterTypes.FrozenCharacterInfo,
    ) => {
        let check = false;

        if (character.id === this.internal.data.state.characterId) {
            check = true;
        } else if (
            !this.props.roleList.find(
                item =>
                    item.state.characterInfo?.state.name.trim() ===
                    character.state.name.trim(),
            )
        ) {
            check = true;
        }

        if (check) {
            this.updateCharacterId(character.id);
            // 关闭选择列表
            this.hidePickList();
        } else {
            this.emitEvent('duplicateRoleName');
        }
    };

    public readonly handleConfirm = () => {
        this.props.onConfirm?.(this.internal.data);
        this.onClose();
        this.props.onClose?.();
    };

    public readonly addCharacter = () => {
        this.internal.showCharacterEditor = true;
    };

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        const { characterEditorCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            characterEditorCtrl.addEventListener('back', () => {
                this.internal.showCharacterEditor = false;
            }),
            characterEditorCtrl.addEventListener('submit', data => {
                this.emitEvent('createCharacter', async () => {
                    try {
                        const res =
                            await this.#characterController.requestCreate(data);

                        this.updateCharacterId(res.id);
                        this.internal.showCharacterEditor = false;
                        this.hidePickList();
                    } catch (e) {
                        this.emitEvent(
                            'createCharacterFail',
                            ErrUtils.getErrorMsg(e) ?? '',
                        );
                    }
                });
            }),
        );
    };
}
