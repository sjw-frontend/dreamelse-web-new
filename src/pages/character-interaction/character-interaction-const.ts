export const I18nTexts = {} as const;

export const Settings = {
    getMsgListInterval: 5000,
    taskMaxDelayMS: 60 * 1000,
    maxSendMsgLength: 10,
    inputInterval: {
        start: 5000,
        end: 8000,
    },
    textMsgDequeueIntervalForWord: 200,
    baseVoiceMsgDequeueInterval: 1000,
    otherMsgDequeueInterval: 1500,
    showWritingProbability: 0.5,
    showWritingDelayMS: {
        start: 500,
        end: 2000,
    },
} as const;
