// @ts-nocheck
/**
 * DramatizeEngineController — web 版
 * 完整迁移自 RN 版，去掉 AppController 依赖（web 无 app active 概念）
 */
import { BaseRenderController, renderController } from '$/core';
import { FileService } from '$/services';
import type { WorldLineTypes } from '$/types';
import { ObjectUtils, TaskUtils } from '$/utils';

import {
    MaxNarrativeTrigger,
    NarrativeCount,
    NarrativeFinishDelayMS,
    NarrativeFinishDelayMSWhenHasInteraction,
    NarrativeFinishDelayMSWhenTTS,
    NextNarrativeReadyTimeoutMS,
    RawNarrativeMinCount,
    RequestNawNarrativePollingDelayMS,
    RequestNawNarrativePollingIfEmptyDelayMS,
    RequestNawNarrativePollingIfFailDelayMS,
    ShowInteractResultWhenNoNeedRequestContinueTimeMS,
} from './@com/consts';
import { createEmptyResourceRecord, insertResourceRecord } from './@com/resource';
import { DramatizeNarrativeDomain } from './dramatize-narrative-domain';

type InternalState = LibTypes.VarDefine<{
    isDry: boolean,
    get play(): boolean,
    controlPlay: boolean,
    isBlur: boolean,
    speed: number,
    muted: boolean,
    currentPointer: number,
    _narrativeTrigger: number,
    get prevNarrative(): DramatizeNarrativeDomain | null,
    get narrative(): DramatizeNarrativeDomain | null,
    get nextNarrative(): DramatizeNarrativeDomain | null,
    get isWaitReady(): boolean,
    get isWaitFirst(): boolean,
    get isLoading(): boolean,
    isWaitRequestContinue: boolean,
    isLock: boolean,
    get isWorldLineEnd(): boolean,
    get isActive(): boolean,
    get chapterIndex(): number,
    interactStatus: 'handling' | 'interacting' | 'standby',
    get isInteractStandby(): boolean,
    get isInteracting(): boolean,
    get isInteractHandling(): boolean,
    get isInteractionShow(): boolean,
    isReplay: boolean,
}>;

type State = LibTypes.FrozenPick<
    InternalState,
    | 'isDry'
    | 'isInteractHandling'
    | 'isInteractionShow'
    | 'isInteractStandby'
    | 'isLoading'
    | 'isReplay'
    | 'isWaitFirst'
    | 'isWaitReady'
    | 'isWorldLineEnd'
    | 'muted'
    | 'narrative'
    | 'nextNarrative'
    | 'play'
    | 'speed'
>;

type EventMap = LibTypes.FrozenDefine<{
    pressCanvas: LibTypes.SimpleFunction,
    reset: LibTypes.SimpleFunction,
    rechoice: LibTypes.Asyncable<boolean, [narrativeId: string, value: string]>,
    breakSceneAnimations: LibTypes.Asyncable<any, []>,
    removeSceneSpecialEffects: LibTypes.Asyncable<void, []>,
    runSceneAnimation: LibTypes.Func<void, [animation: any]>,
    runSceneSpecialEffect: LibTypes.Func<void, [specialEffect: any]>,
}>;

type Context = LibTypes.VarDefine<{
    playId: string | null,
    narrativeList: LibTypes.VarArr<DramatizeNarrativeDomain>,
    currentNarrativeMaxIndex: number,
    currentRawNarrativeMaxIndex: bigint,
    currentRawNarrative: WorldLineTypes.Api.Narrative | null,
    rawNarrativeList: LibTypes.VarArr<WorldLineTypes.Api.Narrative>,
    get needWaitRequestContinue(): boolean,
    get allowRequestContinue(): boolean,
    get allowRequestNarratives(): boolean,
    disableProfile: boolean,
    readonly roleMap: LibTypes.VarGeneralObj<boolean>,
    readonly resourceRecord: WorldLineTypes.Api.ResourceRecord,
}>;

type RequestContinueReq = LibTypes.Define<{
    narrativeId: string,
    value: string,
}>;

type StartOptions = LibTypes.Define<{
    requestNarrativesCallback?: LibTypes.Async<PushNarrativesOptions, []>,
    requestContinueCallback?: LibTypes.Async<void, [req: RequestContinueReq]>,
    requestAchievementImages?: LibTypes.Async<any[], [narrativeId: string]>,
}>;

type PushNarrativesOptions = LibTypes.Define<{
    narratives: LibTypes.Arr<WorldLineTypes.Api.RawNarrative>,
    resource: WorldLineTypes.Api.RawResource,
    hasMore: boolean,
}>;

@renderController()
export class DramatizeEngineController extends BaseRenderController<State, InternalState, EventMap> {
    public constructor(fileService: FileService) {
        super();
        this.#fileService = fileService;
        this.#watch();
    }

    readonly #fileService;

    #requestNarrativesCallback?: StartOptions['requestNarrativesCallback'];
    #requestContinueCallback?: StartOptions['requestContinueCallback'];
    #requestAchievementImages?: StartOptions['requestAchievementImages'];
    #requestNextTimer: ReturnType<typeof setTimeout> | null = null;

    readonly #ctx: Context = this.#getCtx();

    readonly #requestContinue = TaskUtils.createMutexTask(
        async (narrativeId: string, value: string) => {
            if (this.#ctx.allowRequestContinue && this.#requestContinueCallback) {
                await this.#requestContinueCallback({ narrativeId, value });
            }
        },
    );

    #watch() {
        this.watch(
            () => this.internal.narrative,
            (narrative, prev) => {
                if (narrative) {
                    this.#listenNarrative();
                    this.interactStandby(true);
                    narrative.dramatize(prev == null);
                    this.#pushNewNarrative();
                }
            },
        );

        this.watch(
            () =>
                this.internal.isActive &&
                this.internal.narrative?.state.isFinished &&
                this.internal.nextNarrative?.state.isReady,
            async value => {
                if (value) {
                    await this.internal.narrative?.beforeNextDramatize();
                    this.internal.currentPointer++;
                    console.log('[DramatizeEngine] advance to next narrative, pointer=', this.internal.currentPointer);
                }
            },
        );

        this.watch(
            () =>
                this.internal.narrative?.state.isFinished &&
                this.internal.nextNarrative,
            nextNarrative => {
                if (typeof nextNarrative === 'object' && nextNarrative) {
                    setTimeout(() => {
                        nextNarrative.forceReady();
                    }, NextNarrativeReadyTimeoutMS);
                }
            },
        );

        this.watch(
            () => this.internal.narrative?.state.isFinished,
            isFinished => {
                if (isFinished) {
                    this.#requestNarratives();
                }
            },
        );

        this.watch(
            () => this.internal.play,
            play => this.internal.narrative?.play(play),
        );

        this.watch(
            () => this.internal.speed,
            speed => this.internal.narrative?.setSpeed(speed),
        );

        // Log isLoading changes for debugging
        this.watch(
            () => this.internal.isLoading,
            isLoading => {
                console.log('[DramatizeEngine] isLoading changed', {
                    isLoading,
                    isWaitFirst: this.internal.isWaitFirst,
                    isWaitReady: this.internal.isWaitReady,
                    isWaitRequestContinue: this.internal.isWaitRequestContinue,
                });
            },
        );
    }

    async #requestNarratives() {
        this.#clearRequestNextTimer();
        if (this.#ctx.allowRequestNarratives && this.#requestNarrativesCallback) {
            console.log('[DramatizeEngine] #requestNarratives, allowRequestNarratives=true');
            try {
                const res = await this.#requestNarrativesCallback();
                console.log('[DramatizeEngine] #requestNarratives result', {
                    narrativesCount: res.narratives.length,
                    hasMore: res.hasMore,
                    rawListLength: this.#ctx.rawNarrativeList.length,
                });

                this.#pushRawNarratives(res);
                if (this.#ctx.rawNarrativeList.length > 0) {
                    this.#pushNewNarrative();
                }

                this.#requestNextNarratives(
                    res.narratives.length > 0
                        ? RequestNawNarrativePollingDelayMS
                        : RequestNawNarrativePollingIfEmptyDelayMS,
                );
            } catch (e) {
                console.error('[DramatizeEngine] #requestNarratives failed', e);
                this.#requestNextNarratives(RequestNawNarrativePollingIfFailDelayMS);
            }
        } else {
            console.log('[DramatizeEngine] #requestNarratives skipped', {
                allowRequestNarratives: this.#ctx.allowRequestNarratives,
                hasCallback: !!this.#requestNarrativesCallback,
            });
        }
    }

    #listenNarrative() {
        this.internal.prevNarrative?.removeAllEventListeners('breakSceneAnimations');
        this.internal.prevNarrative?.removeAllEventListeners('removeSceneSpecialEffects');
        this.internal.prevNarrative?.removeAllEventListeners('runSceneAnimation');
        this.internal.prevNarrative?.removeAllEventListeners('runSceneSpecialEffect');

        this.internal.narrative?.addEventListener('breakSceneAnimations', async (...args) =>
            this.emitEvent('breakSceneAnimations', ...args).race);
        this.internal.narrative?.addEventListener('removeSceneSpecialEffects', (...args) => {
            this.emitEvent('removeSceneSpecialEffects', ...args);
        });
        this.internal.narrative?.addEventListener('runSceneAnimation', (...args) => {
            this.emitEvent('runSceneAnimation', ...args);
        });
        this.internal.narrative?.addEventListener('runSceneSpecialEffect', (...args) => {
            this.emitEvent('runSceneSpecialEffect', ...args);
        });
    }

    #getCtx(): Context {
        const $this = this;
        return {
            playId: null,
            narrativeList: [],
            currentNarrativeMaxIndex: -1,
            currentRawNarrativeMaxIndex: -1n,
            rawNarrativeList: [],
            currentRawNarrative: null,

            get allowRequestContinue() {
                return (
                    !$this.internal.isLock &&
                    !$this.internal.isWorldLineEnd &&
                    this.needWaitRequestContinue
                );
            },
            get needWaitRequestContinue() {
                return (
                    !$this.internal.isReplay &&
                    $this.internal.narrative?.state.director.interaction?.lastValue == null
                );
            },
            get allowRequestNarratives() {
                if ($this.internal.isLock) return false;

                if ($this.internal.narrative?.state.director) {
                    if ($this.internal.narrative.state.isLastOne) return false;
                    if (
                        this.needWaitRequestContinue &&
                        $this.internal.narrative.state.isLastOneInCurrentStage
                    ) {
                        return $this.internal.narrative.state.isFinished;
                    }
                }

                const currentLastOne = this.narrativeList.at(-1);
                if (
                    currentLastOne &&
                    currentLastOne.state.narrativeId !== $this.internal.narrative?.state.narrativeId
                ) {
                    if (currentLastOne.state.isLastOne) return false;
                    if (this.needWaitRequestContinue && currentLastOne.state.isLastOneInCurrentStage) return false;
                }

                const currentLastRawOne = this.rawNarrativeList.at(-1);
                if (currentLastRawOne?.narrative_id !== $this.internal.narrative?.state.narrativeId) {
                    if (currentLastRawOne?.isLastOne) return false;
                    if (this.needWaitRequestContinue && currentLastRawOne?.is_last_one_in_scene) return false;
                }

                return this.rawNarrativeList.length < RawNarrativeMinCount;
            },

            disableProfile: false,
            roleMap: {},
            resourceRecord: createEmptyResourceRecord(),
        };
    }

    #clear() {
        this.#ctx.narrativeList.forEach(item => item.dispose());
        this.#lock(true);
        this.#clearRequestNextTimer();
    }

    #reset() {
        this.#clear();
        this.resetInternalState({ _narrativeTrigger: this.internal._narrativeTrigger });
        ObjectUtils.safeAssign(this.#ctx, this.#getCtx());
        this.#requestContinueCallback = undefined;
        this.#requestNarrativesCallback = undefined;
        this.#sendNarrativeTrigger();
        this.emitEvent('reset');
        console.log('[DramatizeEngine] #reset');
    }

    #pushRawNarratives(options: PushNarrativesOptions) {
        const { narratives, resource, hasMore } = options;

        for (const item of narratives) {
            const bigIndex = BigInt(item.index);
            if (bigIndex > this.#ctx.currentRawNarrativeMaxIndex) {
                this.#ctx.currentRawNarrativeMaxIndex = bigIndex;
                const isLastOne = item.achievement?.event_type === 'ending';
                this.#ctx.rawNarrativeList.push({ ...item, isLastOne, index: bigIndex });
                if (isLastOne) break;
            } else {
                break;
            }
        }

        if (!hasMore) {
            const currentRawLastOne = this.#ctx.rawNarrativeList.at(-1);
            if (currentRawLastOne) {
                currentRawLastOne.isLastOne = true;
            } else {
                const currentLastOne = this.#ctx.narrativeList.at(-1);
                currentLastOne?.isLastOne();
            }
        }

        insertResourceRecord(resource, this.#ctx.resourceRecord, this.#fileService);
    }

    #clearRequestNextTimer() {
        if (this.#requestNextTimer != null) {
            clearTimeout(this.#requestNextTimer);
            this.#requestNextTimer = null;
        }
    }

    #requestNextNarratives(delayMS: number) {
        this.#clearRequestNextTimer();
        this.#requestNextTimer = setTimeout(() => this.#requestNarratives(), delayMS);
    }

    #sendNarrativeTrigger() {
        this.internal._narrativeTrigger++;
        if (this.internal._narrativeTrigger > MaxNarrativeTrigger) {
            this.internal._narrativeTrigger = 0;
        }
    }

    #shrinkNarratives() {
        if (this.#ctx.narrativeList.length > NarrativeCount.max) {
            const currentList = [...this.#ctx.narrativeList];
            const currentNarrativeId = this.internal.narrative?.state.narrativeId;
            while (currentList.length > NarrativeCount.min) {
                const narrative = currentList.shift();
                narrative?.dispose();
            }
            this.#ctx.narrativeList = currentList;
            this.internal.currentPointer = this.#ctx.narrativeList.findIndex(
                item => item.state.narrativeId === currentNarrativeId,
            );
            if (this.internal.currentPointer < 0) this.internal.currentPointer = 0;
            this.#sendNarrativeTrigger();
        }
    }

    #pushNewNarrative() {
        console.log('[DramatizeEngine] #pushNewNarrative, rawNarrativeList.length=', this.#ctx.rawNarrativeList.length);

        while (this.#ctx.narrativeList[this.internal.currentPointer + 2] == null) {
            const rawNarrative = this.#ctx.rawNarrativeList.shift();
            if (!rawNarrative) break;

            if (this.#ctx.currentRawNarrative) {
                if (rawNarrative.index <= this.#ctx.currentRawNarrative.index) continue;
            }

            try {
                this.#ctx.currentNarrativeMaxIndex++;
                const prevDirector = this.#ctx.narrativeList.at(-1)?.state.director ?? null;
                const domain = this.getDomain(DramatizeNarrativeDomain, {
                    index: this.#ctx.currentNarrativeMaxIndex,
                    prevDirector: prevDirector ?? null,
                    prevNarrative: this.#ctx.currentRawNarrative,
                    narrative: rawNarrative,
                    resourceRecord: this.#ctx.resourceRecord,
                    roleMap: this.#ctx.roleMap,
                    disableProfile: this.#ctx.disableProfile,
                    speed: this.internal.speed,
                    play: this.internal.play,
                    isReplay: this.internal.isReplay,
                });
                this.#ctx.narrativeList.push(domain);
                this.#sendNarrativeTrigger();
                this.#ctx.currentRawNarrative = rawNarrative;

                console.log('[DramatizeEngine] narrative domain created', {
                    index: domain.state.index,
                    narrativeId: domain.state.narrativeId,
                    chapterIndex: domain.state.chapterIndex,
                });
            } catch (e) {
                console.error('[DramatizeEngine] narrative domain create failed', e, rawNarrative);
            }
        }

        this.#shrinkNarratives();
        this.#requestNarratives();
    }

    #interactHandling() {
        this.internal.interactStatus = 'handling';
    }

    #lock(value: boolean) {
        this.internal.isLock = value;
    }

    #start(options: StartOptions = {}) {
        const { requestContinueCallback, requestNarrativesCallback, requestAchievementImages } = options;
        this.#lock(false);
        this.play(true);
        this.#requestContinueCallback = requestContinueCallback;
        this.#requestNarrativesCallback = requestNarrativesCallback;
        this.#requestAchievementImages = requestAchievementImages;
        console.log('[DramatizeEngine] #start, play=', this.internal.controlPlay);
        this.#pushNewNarrative();
    }

    protected override onMount() {
        return () => this.#clear();
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            isDry: false,
            currentPointer: 0,
            isBlur: false,
            get play() { return this.controlPlay && !this.isDry && !this.isBlur; },
            controlPlay: true,
            muted: false,
            speed: 1,
            interactStatus: 'standby',
            get isInteractStandby() { return this.interactStatus === 'standby'; },
            get isInteracting() { return this.interactStatus === 'interacting'; },
            get isInteractHandling() { return this.interactStatus === 'handling'; },
            _narrativeTrigger: 0,
            get prevNarrative() {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this._narrativeTrigger;
                return $this.#ctx.narrativeList[this.currentPointer - 1] ?? null;
            },
            get narrative() {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this._narrativeTrigger;
                return $this.#ctx.narrativeList[this.currentPointer] ?? null;
            },
            get nextNarrative() {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                this._narrativeTrigger;
                return $this.#ctx.narrativeList[this.currentPointer + 1] ?? null;
            },
            get isWaitReady() {
                return (
                    this.isActive &&
                    (!this.narrative?.state.isReady ||
                        (this.narrative.state.isFinished && !this.nextNarrative?.state.isReady))
                );
            },
            get isWaitFirst() { return this.narrative == null; },
            get isLoading() {
                return this.isWaitReady || this.isWaitFirst || this.isWaitRequestContinue;
            },
            isWaitRequestContinue: false,
            isLock: false,
            get chapterIndex() { return this.narrative?.state.chapterIndex ?? 0; },
            get isWorldLineEnd() { return !!this.narrative?.state.isWorldLineEnd; },
            get isActive() { return this.play && !this.isWorldLineEnd && !this.isLock; },
            get isInteractionShow() { return !!this.narrative?.state.showInteraction; },
            isReplay: false,
        };
    }

    public readonly startPlay = (
        options: LibTypes.SetRequired<StartOptions, 'requestNarrativesCallback'>,
    ) => {
        console.log('[DramatizeEngine] startPlay called');
        this.#reset();
        this.#start(options);
    };

    public readonly startReplay = (options: any) => {
        this.#reset();
        this.internal.isReplay = true;
        this.#ctx.disableProfile = true;
        this.#pushRawNarratives(options);
        this.#start(options);
    };

    public readonly play = (value: boolean) => {
        this.internal.controlPlay = value;
    };

    public readonly pressCanvas = () => {
        this.emitEvent('pressCanvas');
    };

    public readonly blur = (value: boolean) => {
        this.internal.isBlur = value;
    };

    public readonly setSpeed = (value: number) => {
        this.internal.speed = value;
    };

    public readonly textCaptionsFinish = (force = false) => {
        this.internal.narrative?.captionsFinish(
            force
                ? 0
                : this.internal.narrative.state.director.interaction
                  ? NarrativeFinishDelayMSWhenHasInteraction
                  : NarrativeFinishDelayMS,
        );
    };

    public readonly ttsCaptionsFinish = () => {
        this.internal.narrative?.captionsFinish(
            this.internal.narrative.state.director.interaction
                ? NarrativeFinishDelayMSWhenHasInteraction
                : NarrativeFinishDelayMSWhenTTS,
        );
    };

    public readonly elementReady = (id: string) => {
        this.internal.narrative?.elementReady(id);
        this.internal.nextNarrative?.elementReady(id);
    };

    public readonly setCurrentAnimationStyle = (id: string, style: any) => {
        this.internal.prevNarrative?.setCurrentAnimationStyle(id, style);
        this.internal.narrative?.setCurrentAnimationStyle(id, style);
    };

    public readonly interact = async (narrativeId: string, value: string) => {
        console.log('[DramatizeEngine] interact', { narrativeId, value });
        if (!this.internal.isInteractHandling) {
            this.#interactHandling();
            const currentValue = this.internal.narrative?.state.interactionValue ?? value;

            if (
                this.internal.narrative?.state.director.interaction?.lastValue != null &&
                currentValue === this.internal.narrative.state.director.interaction.lastValue
            ) {
                this.internal.narrative.setInteractionValue(value);
                await new Promise(r => setTimeout(r, ShowInteractResultWhenNoNeedRequestContinueTimeMS));
                this.internal.narrative.finish();
            } else if (this.internal.isReplay) {
                try {
                    if (await this.emitEvent('rechoice', narrativeId, value).race) {
                        // handled
                    } else {
                        this.interactStandby(true);
                    }
                } catch {
                    this.interactStandby(true);
                }
            } else {
                this.internal.narrative?.setInteractionValue(value);
                try {
                    this.internal.isWaitRequestContinue = true;
                    await this.#requestContinue(narrativeId, value);
                    this.internal.narrative?.finish();
                } catch (e) {
                    console.error('[DramatizeEngine] interact failed', e);
                    this.interactStandby(true);
                    this.internal.narrative?.setInteractionValue(null);
                    return;
                } finally {
                    this.internal.isWaitRequestContinue = false;
                }
            }
        }
    };

    public readonly end = () => {
        this.internal.narrative?.finish();
    };

    public readonly interactStandby = (force = false) => {
        if (this.internal.isInteracting || force) {
            this.internal.interactStatus = 'standby';
        }
    };

    public readonly interacting = () => {
        if (this.internal.isInteractStandby) {
            this.internal.interactStatus = 'interacting';
        }
    };

    public readonly requestAchievementImages = async (id: string) =>
        (await this.#requestAchievementImages?.(id)) ?? [];

    public readonly createTimedTask = (handler: () => void, delayMS: number) =>
        this.internal.narrative?.createTimedTask(handler, delayMS) ?? null;

    public readonly createLoopTimedTask = (handler: () => void, delayMS: number) =>
        this.internal.narrative?.createLoopTimedTask(handler, delayMS) ?? null;

    public readonly sleep = async (delayMS: number) =>
        this.internal.narrative?.sleep(delayMS);
}
