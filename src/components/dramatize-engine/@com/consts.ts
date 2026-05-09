import { DRAMATIZE } from '$/consts';

export const NarratorRoles = DRAMATIZE.NarratorRoles;

export const DefaultBlurRoleBrightness = 0.6;

export const DefaultBackgroundBrightnessWhenHasRole = 0.6;

export const DefaultFramesSpeed = 0.2;

export const DefaultDimensionsScale = 1;

export const DefaultMusicVolume = 0.4;

export const DefaultAmbientVolume = 0.2;

export const DefaultVoiceFXVolume = 0.2;

export const DefaultTTSSpeed = 1;

export const ShowNewPlaceProfileDurationMS = 1500;

export const BlurEffectCodeRatio = 100;

export const QuickoptionTimeoutMS = 5000;

export const ReplaySelectTimeoutMS = QuickoptionTimeoutMS;

export const ShowInteractResultWhenNoNeedRequestContinueTimeMS = 1500;

export const VoiceFxDelayMSWhenHasAmbient = 2000;

export const FramesNormalSpeedFPS = 60;

export const FramesNormalSpeedInterval = 1000 / 60;

export const RawNarrativeMinCount = 10;

export const NarrativeCount = {
    min: 10,
    max: 20,
} as const;

export const MaxNarrativeTrigger = 1000000;

export const NarrativeFinishDelayMSWhenHasInteraction = 1000;

export const NarrativeFinishDelayMS = 4000;

export const NarrativeFinishDelayMSWhenTTS = 1000;

export const MaxAchievementImageCount = 3;

export const NextNarrativeReadyTimeoutMS = 10000;

export const BeforeNextDramatizeTimeoutMS = 1500;

export const NarrativeFinishTimeoutMS = 20000;

export const AudioCacheCount = {
    min: 20,
    max: 30,
} as const;

export const RequestNawNarrativePollingDelayMS = 500;

export const RequestNawNarrativePollingIfEmptyDelayMS = 2500;

export const RequestNawNarrativePollingIfFailDelayMS = 2500;

export const AudioPlayStatusCheckIntervalMS = 50;

export const VolumeFadeDelayMS = 100;

export const VolumeFadeStep = 0.05;
