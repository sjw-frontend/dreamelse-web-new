// @ts-nocheck
import { ScriptController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { ArrayUtils } from '$/utils';

import type { HomeController, TagFeed } from '../../home-controller';

type InternalState = LibTypes.VarDefine<{
    readonly id: string,
    info: LibTypes.Nullable<TagFeed>,
}>;

type State = LibTypes.FrozenPick<InternalState, 'info'>;

type Props = LibTypes.FrozenDefine<{
    id: string,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    homeCtrl: HomeController,
}>;

@renderController()
export class TagFeedController extends BaseRenderController<
    State,
    InternalState,
    never,
    Props
> {
    public constructor(
        scriptController: ScriptController,
        userController: UserController,
    ) {
        super();

        this.#scriptController = scriptController;
        this.#userController = userController;

        this.#watch();
    }

    readonly #scriptController;
    readonly #userController;

    #relatedControllers?: RelatedControllers;

    #watch() {
        this.watch(
            () => this.internal.info?.readed,
            readed => {
                if (readed) {
                    this.requestList();
                }
            },
            {
                immediate: true,
            },
        );

        this.watch(
            () => this.#userController.state.loggedInUser,
            () => {
                if (this.internal.info?.readed) {
                    this.refresh();
                }
            },
        );
    }

    protected override getInitialInternalState(): InternalState {
        return {
            id: this.props.id,
            info: null,
        };
    }

    public readonly setRelatedControllers = (
        relatedControllers: RelatedControllers,
    ) => {
        this.#relatedControllers = relatedControllers;
        const { homeCtrl } = relatedControllers;

        this.autoClearRelatedControllers(
            this.watch(
                () => homeCtrl.state.tagFeedList,
                tagFeedList => {
                    this.internal.info = tagFeedList.find(
                        item => item.id === this.internal.id,
                    );
                },
                {
                    immediate: true,
                },
            ),
        );
    };

    public readonly requestList = async (clear = false) => {
        if (this.internal.info?.readed && this.#relatedControllers) {
            const ids = await this.#scriptController.requestRecList({
                kind: 'world',
                tag:
                    this.internal.info.searchValue == null
                        ? null
                        : {
                              index: this.internal.info.searchValue,
                              tag_name: this.internal.info.title,
                          },
            });

            const existingIds = clear === true ? [] : this.internal.info.scriptIds;

            this.#relatedControllers.homeCtrl.setTagFeedScriptIds(
                this.internal.id,
                ArrayUtils.toDeduplicate([
                    ...existingIds,
                    ...ids,
                ]),
            );
        }
    };

    #refreshPending = false;

    public readonly refresh = async () => {
        if (this.#refreshPending) return;
        this.#refreshPending = true;
        try {
            await this.requestList(true);
        } finally {
            this.#refreshPending = false;
        }
    };
}
