// @ts-nocheck
/**
 * DramatizeNarrativeDomain — web stub
 * 简化版：isReady 立即为 true，让加载流程跑通。
 * 完整渲染逻辑（WebGPU/ECS/音频）后续迭代实现。
 */
import { BaseDomain, domain } from '$/core';
import type { WorldLineTypes } from '$/types';

type Props = {
    index: number;
    narrative: WorldLineTypes.Api.Narrative;
    prevNarrative: WorldLineTypes.Api.Narrative | null;
    prevDirector: any | null;
    resourceRecord: WorldLineTypes.Api.ResourceRecord;
    roleMap: Record<string, boolean>;
    disableProfile: boolean;
    speed: number;
    play: boolean;
    isReplay: boolean;
};

type InternalState = {
    index: number;
    narrativeId: string;
    chapterIndex: number;
    isLastOne: boolean;
    isLastOneInCurrentStage: boolean;
    isForceReady: boolean;
    isReady: boolean;
    isCaptionsFinished: boolean;
    isFinished: boolean;
    showInteraction: boolean;
    showCaptions: boolean;
    showNewPlaceProfile: boolean;
    showNewRoleProfile: boolean;
    interactionValue: string | null;
    play: boolean;
    speed: number;
    roleName: string;
    text: string;
    isNarrator: boolean;
    // minimal director shape needed by DramatizeEngineController
    director: {
        interaction: { lastValue: string | null; options?: { label: string; value: string }[] } | null;
    };
    get isWorldLineEnd(): boolean;
};

type State = InternalState;

@domain()
export class DramatizeNarrativeDomain extends BaseDomain<State, InternalState, never, Props> {
    public constructor() {
        super();
        this.#init();
    }

    #finishTimer: ReturnType<typeof setTimeout> | null = null;

    #init() {
        const props = this.props as Props;
        const n = props.narrative as any;

        this.internal.index = props.index;
        this.internal.narrativeId = n.narrative_id ?? '';
        this.internal.chapterIndex = n.act_count ?? 0;
        this.internal.isLastOne = !!n.isLastOne;
        this.internal.isLastOneInCurrentStage = !!n.is_last_one_in_scene;
        this.internal.isForceReady = false;
        this.internal.isReady = true; // stub: ready immediately
        this.internal.isCaptionsFinished = false;
        this.internal.isFinished = false;
        this.internal.showInteraction = !!n.interaction;
        this.internal.showCaptions = false;
        this.internal.showNewPlaceProfile = false;
        this.internal.showNewRoleProfile = false;
        this.internal.interactionValue = n.interaction_choice ?? null;
        this.internal.play = props.play;
        this.internal.speed = props.speed;
        this.internal.roleName = n.role ?? '';
        this.internal.text = n.text ?? n.content ?? '';
        this.internal.isNarrator = !n.role || n.role === 'narrator' || n.role === '旁白';
        this.internal.director = {
            interaction: n.interaction
                ? {
                    lastValue: n.interaction_choice ?? null,
                    options: n.interaction?.options ?? [],
                }
                : null,
        };
    }

    protected override getInitialInternalState(): InternalState {
        const $this = this;
        return {
            index: 0,
            narrativeId: '',
            chapterIndex: 0,
            isLastOne: false,
            isLastOneInCurrentStage: false,
            isForceReady: false,
            isReady: true,
            isCaptionsFinished: false,
            isFinished: false,
            showInteraction: false,
            showCaptions: false,
            showNewPlaceProfile: false,
            showNewRoleProfile: false,
            interactionValue: null,
            play: true,
            speed: 1,
            roleName: '',
            text: '',
            isNarrator: false,
            director: { interaction: null },
            get isWorldLineEnd() {
                return $this.internal.isFinished && $this.internal.isLastOne;
            },
        };
    }

    public readonly dramatize = (isFirst: boolean) => {
        console.log('[Narrative] dramatize', {
            narrativeId: this.state.narrativeId,
            isFirst,
            text: this.state.text?.slice(0, 20),
            hasInteraction: !!this.state.director.interaction,
        });

        this.internal.showCaptions = true;

        if (!this.state.director.interaction) {
            // auto-finish after reading time
            const readingTime = Math.max(2000, (this.state.text?.length ?? 0) * 80) / (this.state.speed || 1);
            this.#finishTimer = setTimeout(() => {
                if (!this.internal.isFinished) {
                    this.internal.isCaptionsFinished = true;
                    this.internal.isFinished = true;
                    console.log('[Narrative] auto-finished', { narrativeId: this.state.narrativeId });
                }
            }, readingTime);
        }
    };

    public readonly beforeNextDramatize = async () => {
        await new Promise<void>(r => setTimeout(r, 100));
    };

    public readonly forceReady = () => {
        this.internal.isForceReady = true;
        this.internal.isReady = true;
        console.log('[Narrative] forceReady', { narrativeId: this.state.narrativeId });
    };

    public readonly elementReady = (_id: string) => { /* stub */ };

    public readonly captionsFinish = (delayMS: number) => {
        this.internal.isCaptionsFinished = true;
        setTimeout(() => { this.internal.isFinished = true; }, delayMS);
    };

    public readonly finish = () => {
        if (this.#finishTimer) { clearTimeout(this.#finishTimer); this.#finishTimer = null; }
        this.internal.isCaptionsFinished = true;
        this.internal.isFinished = true;
        console.log('[Narrative] finish', { narrativeId: this.state.narrativeId });
    };

    public readonly isLastOne = () => {
        this.internal.isLastOne = true;
    };

    public readonly setInteractionValue = (value: string | null) => {
        this.internal.interactionValue = value;
    };

    public readonly setCurrentAnimationStyle = (_id: string, _style: any) => { /* stub */ };

    public readonly play = (value: boolean) => { this.internal.play = value; };

    public readonly setSpeed = (value: number) => { this.internal.speed = value; };

    public readonly createTimedTask = (handler: () => void, delayMS: number) =>
        setTimeout(handler, delayMS);

    public readonly createLoopTimedTask = (handler: () => void, delayMS: number) =>
        setInterval(handler, delayMS);

    public readonly sleep = (delayMS: number) =>
        new Promise<void>(r => setTimeout(r, delayMS));

    public override readonly dispose = () => {
        if (this.#finishTimer) { clearTimeout(this.#finishTimer); this.#finishTimer = null; }
        this.destroy();
    };
}
