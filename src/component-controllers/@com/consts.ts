export const RawNarrativeMinCount = 10;

export const NarrativeCount = {
    min: 10,
    max: 20,
} as const;

export const MaxNarrativeTrigger = 1000000;

export const NarrativeFinishDelayMSWhenHasInteraction = 1000;
export const NarrativeFinishDelayMS = 4000;
export const NarrativeFinishDelayMSWhenTTS = 1000;

export const NextNarrativeReadyTimeoutMS = 10000;
export const BeforeNextDramatizeTimeoutMS = 1500;
export const NarrativeFinishTimeoutMS = 20000;

export const RequestNawNarrativePollingDelayMS = 500;
export const RequestNawNarrativePollingIfEmptyDelayMS = 2500;
export const RequestNawNarrativePollingIfFailDelayMS = 2500;

export const ShowInteractResultWhenNoNeedRequestContinueTimeMS = 1500;
