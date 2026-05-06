import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';

import { PermissionDeniedController } from './permission-denied-controller';

const TITLES: Record<string, string> = {
    Media: '需要相机/麦克风权限',
    AudioRecording: '需要录音权限',
    SpeechRecognition: '需要语音识别权限',
};

const CONTENTS: Record<string, string> = {
    Media: '请前往系统设置，允许应用访问相机和麦克风，以便正常使用相关功能。',
    AudioRecording: '请前往系统设置，允许应用访问麦克风，以便正常录音。',
    SpeechRecognition: '请前往系统设置，允许应用使用语音识别，以便正常使用语音功能。',
};

export const PermissionDeniedPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PermissionDeniedController);
    const state = useReactive(() => ({
        kind: ctrl.state.kind,
        isMedia: ctrl.state.isMedia,
        isAudioRecording: ctrl.state.isAudioRecording,
    }));

    const kindKey = state.isMedia
        ? 'Media'
        : state.isAudioRecording
          ? 'AudioRecording'
          : 'SpeechRecognition';

    const title = TITLES[kindKey] ?? '权限被拒绝';
    const content = CONTENTS[kindKey] ?? '请前往系统设置开启相关权限。';

    if (state.kind == null) {
        return null;
    }

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 15l-5-5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-text"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col items-center px-4 mt-[177px]">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path
                                d="M16 10v6M16 22h.01M28 16c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"
                                stroke="#ABFF1A"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <h2 className="text-text text-[17px] font-semibold text-center">{title}</h2>
                    <p className="mt-5 text-text/60 text-[15px] text-center leading-relaxed">
                        {content}
                    </p>

                    <button
                        type="button"
                        onClick={ctrl.openDeviceSettings}
                        className="mt-5 text-[#726BF5] text-base font-medium active:opacity-70 transition-opacity"
                    >
                        前往设置
                    </button>
                </div>
            </div>
        </RenderParentProvider>
    );
});
