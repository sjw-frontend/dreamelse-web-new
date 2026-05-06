// @ts-nocheck
import { RouterController, ScriptController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { RouterEnums } from '$/enums';
import { ApiService } from '$/services';
import type { ScriptTypes } from '$/types';
import { StringUtils } from '$/utils';

type InternalState = LibTypes.VarDefine<{
    data: ScriptTypes.FrozenScriptInfo | null,
    selectedRoleId: string | null,
    editRoleId: string | null,
    newRole: ScriptTypes.RoleInfo | null,

    get selectRole(): ScriptTypes.RoleInfo | null,
    get editRole(): ScriptTypes.RoleInfo | null,

    _allowPlayTrigger: 0,
    get allowPlay(): boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'allowPlay'
    | 'data'
    | 'editRole'
    | 'newRole'
    | 'selectedRoleId'
    | 'selectRole'
>;

@renderController()
export class ScriptPreparePlayController extends BaseRenderController<
    State,
    InternalState
> {
    public constructor(
        apiService: ApiService,
        routerController: RouterController,
        scriptController: ScriptController,
        userController: UserController,
    ) {
        super();
        this.#apiService = apiService;
        this.#routerController = routerController;
        this.#scriptController = scriptController;
        this.#userController = userController;

        this.#init();
    }

    readonly #apiService;
    readonly #routerController;
    readonly #scriptController;
    readonly #userController;

    async #init() {
        const id = this.internal.route?.params?.ids?.[0]?.toString();

        if (id != null) {
            this.internal.data =
                await this.#scriptController.requestPlayDetails(id);
        }
    }

    protected override getInitialInternalState(): InternalState {
        return {
            data: null,
            selectedRoleId: null,
            editRoleId: null,
            newRole: null,
            get editRole() {
                return (
                    this.data?.state.roles?.find(
                        item => item.id === this.editRoleId,
                    ) ?? null
                );
            },
            get selectRole() {
                return (
                    this.data?.state.roles?.find(
                        item => item.id === this.selectedRoleId,
                    ) ?? null
                );
            },

            _allowPlayTrigger: 0,
            get allowPlay() {
                if (
                    this.data?.state.roles == null ||
                    this.data.state.roles.length === 0
                ) {
                    return false;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this._allowPlayTrigger;
                return this.data.state.roles.every(
                    item => !!item.state.characterInfo,
                );
            },
        };
    }

    // 返回
    public readonly handleBack = () => {
        this.#routerController.goBack();
    };

    public readonly collect = () => {
        const data = this.internal.data;

        if (data && this.#userController.isLoggedIn()) {
            if (!data.state.isCollected) {
                this.#apiService.call.feed.favourite_script({
                    script_id: data.id,
                });
            } else {
                this.#apiService.call.feed.unfavourite_script({
                    script_id: data.id,
                });
            }

            this.#userController.setMyScriptStats(prevValue => ({
                collectCount:
                    prevValue.collectCount + (data.state.isCollected ? -1 : 1),
            }));

            this.#scriptController.setScriptState(
                data.id,
                'isCollected',
                !data.state.isCollected,
            );
        }
    };

    // 选择角色
    public readonly selectRole = (roleId: string) => {
        this.internal.selectedRoleId = roleId;
    };

    public readonly createRole = () => {
        this.internal.newRole = this.#scriptController.createNewRole({
            isNpc: false,
            isOpen: false,
        });
    };

    public readonly editRole = (roleId: string) => {
        this.internal.editRoleId = roleId;
    };

    public readonly closeRoleEditor = () => {
        this.internal.editRoleId = null;
        this.internal.newRole = null;
    };

    // 扮演角色
    public readonly playAsRole = () => {
        console.log('[PreparePlay] playAsRole', {
            scriptId: this.internal.data?.id,
            selectedRoleId: this.internal.selectedRoleId,
            allowPlay: this.internal.allowPlay,
        });
        this.#routerController.replace(
            RouterEnums.RouteName.PlayScript,
            {
                ids: [this.internal.data?.id, this.internal.selectedRoleId],
            },
        );
    };

    // 扮演上帝
    public readonly playAsGod = () => {
        console.log('[PreparePlay] playAsGod', {
            scriptId: this.internal.data?.id,
            allowPlay: this.internal.allowPlay,
        });
        this.#routerController.replace(
            RouterEnums.RouteName.PlayScript,
            {
                ids: [this.internal.data?.id],
            },
        );
    };

    public readonly onUpdateRole = (role: ScriptTypes.RoleInfo) => {
        if (this.internal.data && this.internal.editRole) {
            this.#scriptController.setRoleState(
                this.internal.editRole.id,
                'backgroundDesc',
                role.state.backgroundDesc,
            );
            this.#scriptController.setRoleState(
                this.internal.editRole.id,
                'identities',
                role.state.identities.filter(
                    item => !StringUtils.isEmpty(item.label.trim()),
                ),
            );
            this.#scriptController.setRoleState(
                this.internal.editRole.id,
                'secret',
                role.state.secret,
            );

            this.internal._allowPlayTrigger++;
            this.#scriptController.setRoleState(
                this.internal.editRole.id,
                'characterId',
                role.state.characterId,
            );
        }
    };

    public readonly onAddRole = (role: ScriptTypes.RoleInfo) => {
        if (this.internal.data && this.internal.newRole) {
            this.#scriptController.setScriptState(
                this.internal.data.id,
                'roles',
                prevValue => [...(prevValue ?? []), role],
            );
        }
    };
}
