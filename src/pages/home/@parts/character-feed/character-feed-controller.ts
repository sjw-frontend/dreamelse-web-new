// @ts-nocheck
import { ScriptController, UserController } from '$/controllers';
import { BaseRenderController, renderController } from '$/core';
import { ArrayUtils } from '$/utils';

import type { CharacterFeed, HomeController } from '../../home-controller';

type InternalState = LibTypes.VarDefine<{
    readonly id: string,
    info: LibTypes.Nullable<CharacterFeed>,
}>;

type State = LibTypes.FrozenPick<InternalState, 'info'>;

type Props = LibTypes.FrozenDefine<{
    id: string,
}>;

type RelatedControllers = LibTypes.FrozenDefine<{
    homeCtrl: HomeController,
}>;

@renderController()
export class CharacterFeedController extends BaseRenderController<
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
            loggedInUser => {
                if (this.internal.info?.readed) {
                    this.#clear();
                    loggedInUser && this.refresh();
                }
            },
        );
    }

    #clear() {
        this.internal.info &&= {
            ...this.internal.info,
            scriptIds: [],
            nextCursor: null,
            hasMore: true,
        };
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
                () => homeCtrl.state.characterFeedList,
                characterFeedList => {
                    this.internal.info = characterFeedList.find(
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
                kind: 'play_with',
                characterId: this.internal.info.id,
            });

            if (clear) {
                this.#clear();
            }

            this.#relatedControllers.homeCtrl.setCharacterFeedScriptIds(
                this.internal.id,
                ArrayUtils.toDeduplicate([
                    ...this.internal.info.scriptIds,
                    ...ids,
                ]),
            );
        }
    };

    public readonly refresh = async () => {
        await this.requestList(true);
    };
}
