// @ts-nocheck
import { AppController, ScriptController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import type { ScriptTypes } from '$/types';
import { StringUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    get defaultConfig(): ScriptTypes.DefaultConfig | null,
    _data: ScriptTypes.FrozenDraftInfo | null,
    get data(): ScriptTypes.FrozenDraftInfo,
    isNew: boolean,
    writable: boolean,

    get allowSubmit(): boolean,

    currentRoleId: string | null,
    get currentRole(): ScriptTypes.RoleInfo | null,
    newRole: ScriptTypes.RoleInfo | null,
    showExpandEdit: boolean,

    get isEmpty(): boolean,
    get needSave(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'allowSubmit'
    | 'currentRole'
    | 'data'
    | 'defaultConfig'
    | 'isNew'
    | 'needSave'
    | 'newRole'
    | 'showExpandEdit'
    | 'writable'
>;

type EventMap = LibTypes.FrozenDefine<{
    submit: LibTypes.Func<void, [data: ScriptTypes.FrozenDraftInfo]>,
}>;

type Props = LibTypes.FrozenDefine<{
    data?: ScriptTypes.FrozenDraftInfo | null,
}>;

@renderController()
export class ScriptEditorController extends BaseRenderController<
    State,
    InternalState,
    EventMap,
    Props
> {
    public constructor(
        scriptController: ScriptController,
        appController: AppController,
    ) {
        super();
        this.#scriptController = scriptController;
        this.#appController = appController;

        this.#init();
    }

    readonly #scriptController;
    readonly #appController;

    #init() {
        if (
            (this.internal.data.state.branches &&
                this.internal.data.state.branches.length > 0) ||
            !StringUtils.isEmpty(this.internal.data.state.openingDesc) ||
            (this.internal.data.state.roles &&
                this.internal.data.state.roles.filter(item => item.isNpc)
                    .length > 0)
        ) {
            this.internal.showExpandEdit = true;
        }
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        const isNew = !this.props.data;
        return {
            get defaultConfig() {
                return $this.#scriptController.state.defaultConfig;
            },
            _data: this.props.data ?? null,
            get data() {
                this._data ??= $this.#scriptController.createNewDraft();
                return this._data;
            },
            isNew,
            writable: true,

            get allowSubmit() {
                if (!this.writable) {
                    return true; // TODO
                }
                if (StringUtils.isEmpty(this.data.state.title)) {
                    return false;
                }
                if (StringUtils.isEmpty(this.data.state.storyDesc)) {
                    return false;
                }
                if (this.data.state.kinds?.length !== 1) {
                    return false;
                }
                // TODO: 添加更多验证逻辑
                return true;
            },
            currentRoleId: null,
            get currentRole() {
                return (
                    this.data.state.roles?.find(
                        item => item.id === this.currentRoleId,
                    ) ?? null
                );
            },
            newRole: null,

            showExpandEdit: false,

            get isEmpty() {
                if (!StringUtils.isEmpty(this.data.state.title.trim())) {
                    return false;
                }
                if (!StringUtils.isEmpty(this.data.state.storyDesc.trim())) {
                    return false;
                }
                if (!StringUtils.isEmpty(this.data.state.openingDesc.trim())) {
                    return false;
                }
                if (this.data.state.kinds && this.data.state.kinds.length > 0) {
                    return false;
                }
                if (this.data.state.roles?.find(item => item.isNpc)) {
                    return false;
                }
                if (
                    !this.data.state.fullyCustomRole &&
                    this.data.state.roles &&
                    this.data.state.roles.length > 0
                ) {
                    return false;
                }
                if (
                    this.data.state.branches &&
                    this.data.state.branches.filter(
                        item => !StringUtils.isEmpty(item),
                    ).length > 0
                ) {
                    return false;
                }

                return true;
            },

            get needSave() {
                if (!this.data.isLocal) {
                    return true;
                }
                return !this.isEmpty;
            },
        };
    }

    public readonly writable = (writable: boolean) =>
        (this.internal.writable = writable);

    public readonly updateTitle = (title: string) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'title',
            title,
        );
    };

    public readonly updateStoryDesc = (storyDesc: string) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'storyDesc',
            storyDesc.replaceAll(/\n+/g, '\n'),
        );
    };

    public readonly updateOpeningDesc = (openingDesc: string) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'openingDesc',
            openingDesc,
        );
    };

    public readonly toggleRoleKind = () => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'fullyCustomRole',
            prevValue => !prevValue,
        );
    };

    public readonly addKind = (item: ScriptTypes.Kind) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'kinds',
            prevValue => [...(prevValue ?? []), item],
        );
    };

    public readonly deleteKind = (item: ScriptTypes.Kind) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'kinds',
            prevValue => prevValue?.filter(kind => kind.id !== item.id) ?? null,
        );
    };

    public readonly selectKind = (item: ScriptTypes.Kind) => {
        this.#scriptController.setDraftState(this.internal.data.id, 'kinds', [
            item,
        ]);
    };

    public readonly updateBranches = (branches: LibTypes.VarArr<string>) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'branches',
            branches,
        );
    };

    public readonly addEmptyRole = (
        options: LibTypes.FrozenDefine<{ isOpen: boolean, isNpc: boolean }>,
    ) => {
        const newRole = this.#scriptController.createNewRole(options);
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'roles',
            prevValue => [...(prevValue ?? []), newRole],
        );
    };

    public readonly addRole = (newRole: ScriptTypes.RoleInfo) => {
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'roles',
            prevValue => [...(prevValue ?? []), newRole],
        );
    };

    public readonly deleteRole = (roleId: string) => {
        if (roleId === this.internal.currentRoleId) {
            this.internal.currentRoleId = null;
        }
        this.#scriptController.setDraftState(
            this.internal.data.id,
            'roles',
            prevValue => prevValue?.filter(role => role.id !== roleId) ?? null,
        );
    };

    public readonly toggleSettings = () => {
        this.internal.showExpandEdit = !this.internal.showExpandEdit;
    };

    public readonly editRole = (id: string) => {
        this.internal.currentRoleId = id;
    };

    public readonly createFixedRole = () => {
        this.internal.newRole = this.#scriptController.createNewRole({
            isNpc: false,
            isOpen: false,
        });
    };

    public readonly createOpenRole = () => {
        this.internal.newRole = this.#scriptController.createNewRole({
            isNpc: false,
            isOpen: true,
        });
    };

    public readonly createNpcRole = () => {
        this.internal.newRole = this.#scriptController.createNewRole({
            isNpc: true,
            isOpen: false,
        });
    };

    public readonly closeRoleEditor = () => {
        this.internal.newRole = null;
        this.internal.currentRoleId = null;
    };

    public readonly onUpdateRole = (role: ScriptTypes.RoleInfo) => {
        if (this.internal.currentRole) {
            this.#scriptController.setRoleState(
                this.internal.currentRole.id,
                'backgroundDesc',
                role.state.backgroundDesc,
            );
            this.#scriptController.setRoleState(
                this.internal.currentRole.id,
                'identities',
                role.state.identities.filter(
                    item => !StringUtils.isEmpty(item.label.trim()),
                ),
            );
            this.#scriptController.setRoleState(
                this.internal.currentRole.id,
                'secret',
                role.state.secret,
            );
            this.#scriptController.setRoleState(
                this.internal.data.id,
                'characterId',
                role.state.characterId,
            );
        }
    };

    public readonly onAddRole = (role: ScriptTypes.RoleInfo) => {
        if (this.internal.newRole) {
            this.addRole(role);
        }
    };

    public readonly handlePublish = async () => {
        await this.#appController.waitMoment(
            this.#scriptController.requestPublishScript(this.internal.data),
        );
        this.emitEvent('submit', this.internal.data);
    };

    public readonly handleUpdate = async () => {
        await this.#appController.waitMoment(
            this.#scriptController.requestUpdateDraft(this.internal.data),
        );
    };
}
