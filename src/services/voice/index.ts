// @ts-nocheck
import { AudioModule, type AudioRecorder, setAudioModeAsync } from 'expo-audio';
import {
    type ExpoSpeechRecognitionErrorEvent,
    ExpoSpeechRecognitionModule,
    type ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

import { BaseService, service } from '$/core';

import { FileService } from '../file/file-service';
import { PermissionService } from '../permission';

export type RecordingResult = LibTypes.FrozenDefine<{
    uri: string,
    duration: number,
    size: number,
}>;

export type RecordingStatus = LibTypes.FrozenDefine<{
    isRecording: boolean,
    durationMillis: number,
}>;

setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
});

@service()
export class VoiceService extends BaseService {
    public constructor(
        permissionService: PermissionService,
        fileService: FileService,
    ) {
        super();
        this.#permissionService = permissionService;
        this.#fileService = fileService;
    }

    readonly #permissionService;
    readonly #fileService;

    #recording: AudioRecorder | null = null;
    #isRecording = false;

    public readonly initRecording = async () => {
        const permissions =
            await this.#permissionService.getAudioRecordingPermission();
        if (permissions.granted) {
            await this.#permissionService.getSpeechRecognitionPermission();
        }
    };

    /**
     * 开始录音
     * @returns 录音对象或 null（如果权限被拒绝或启动失败）
     */
    public readonly startRecording = async (): Promise<boolean> => {
        try {
            this.#recording?.release();

            // 检查并请求权限
            const permissions =
                await this.#permissionService.getAudioRecordingPermission();

            if (!permissions.granted) {
                return false;
            }

            // 如果已经在录音，先停止
            if (this.#isRecording && this.#recording) {
                await this.cancelRecording();
            }

            // 设置音频模式
            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });

            this.#recording = new AudioModule.AudioRecorder({
                extension: '.caf',
            });

            await this.#recording.prepareToRecordAsync();
            this.#recording.record();

            this.#isRecording = true;

            return true;
        } catch (error) {
            console.error(error);
            this.#recording = null;
            this.#isRecording = false;
            return false;
        }
    };

    /**
     * 停止录音并返回文件路径
     * @returns 录音结果（包含文件路径、时长、大小）或 null
     */
    public readonly finishRecording =
        async (): Promise<RecordingResult | null> => {
            try {
                if (!this.#recording || !this.#isRecording) {
                    return null;
                }
                // 在 stopAndUnloadAsync 之前先获取当前状态和时长
                const statusBeforeStop = this.#recording.getStatus();
                const uriBeforeStop = this.#recording.uri;

                await this.#recording.stop();
                // 获取 URI
                const uri = this.#recording.uri ?? uriBeforeStop;
                // 停止并卸载录音
                const finalStatus = this.#recording.getStatus();

                this.#recording.release();

                this.#isRecording = false;
                this.#recording = null;

                if (uri == null) {
                    return null;
                }

                // 获取文件信息
                const fileInfo = this.#fileService.createFile(uri);

                if (!fileInfo.exists) {
                    return null;
                }

                // 使用 stopAndUnloadAsync 返回的时长，如果为 0 则使用停止前的时长
                const finalDuration =
                    finalStatus.durationMillis > 0
                        ? finalStatus.durationMillis
                        : statusBeforeStop.durationMillis;

                return {
                    uri,
                    duration: finalDuration,
                    size: fileInfo.size,
                };
            } catch (error) {
                console.error(error);
                this.#recording = null;
                this.#isRecording = false;
                return null;
            } finally {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                });
            }
        };

    /**
     * 取消录音（不保存文件）
     */
    public readonly cancelRecording = async (): Promise<void> => {
        try {
            if (!this.#recording) {
                return;
            }

            await this.#recording.stop();
            this.#recording.release();

            this.#recording = null;
            this.#isRecording = false;
        } catch (error) {
            console.error(error);
            this.#recording = null;
            this.#isRecording = false;
        } finally {
            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });
        }
    };

    /**
     * 检查是否正在录音
     */
    public readonly isRecording = () => this.#isRecording;

    /**
     * 将本地音频文件转换为文本
     * @param audioUri 本地音频文件 URI
     * @param lang 语言代码，默认为 'zh-CN'
     * @returns 识别后的文本，如果失败则返回 null
     */
    public readonly transcribeAudioToText = async (
        audioUri: string,
        lang = 'zh-CN',
    ): Promise<string | null> => {
        try {
            // 请求语音识别权限
            const permissionResult =
                await this.#permissionService.getSpeechRecognitionPermission();
            if (!permissionResult.granted) {
                return null;
            }

            // 使用 Promise 来等待识别结果
            return await new Promise<string>((resolve, _reject) => {
                let hasError = false;

                // 监听识别结果事件
                const resultListener = (
                    event: ExpoSpeechRecognitionResultEvent,
                ) => {
                    if (event.isFinal && event.results.length > 0) {
                        // 获取第一个结果（通常是最准确的）
                        const finalText = event.results[0]?.transcript ?? '';
                        // 清理监听器
                        ExpoSpeechRecognitionModule.removeListener(
                            'result',
                            resultListener,
                        );
                        ExpoSpeechRecognitionModule.removeListener(
                            'error',
                            errorListener,
                        );
                        ExpoSpeechRecognitionModule.removeListener(
                            'end',
                            endListener,
                        );
                        // 停止识别
                        try {
                            ExpoSpeechRecognitionModule.stop();
                        } catch {
                            // 忽略停止错误
                        }
                        resolve(finalText);
                    }
                };

                // 监听错误事件
                const errorListener = (
                    _event: ExpoSpeechRecognitionErrorEvent,
                ) => {
                    hasError = true;
                    ExpoSpeechRecognitionModule.removeListener(
                        'result',
                        resultListener,
                    );
                    ExpoSpeechRecognitionModule.removeListener(
                        'error',
                        errorListener,
                    );
                    ExpoSpeechRecognitionModule.removeListener(
                        'end',
                        endListener,
                    );
                    try {
                        ExpoSpeechRecognitionModule.abort();
                    } catch {
                        // 忽略中止错误
                    }
                    resolve(''); // TODO
                };

                // 监听结束事件（作为后备，防止没有最终结果）
                const endListener = () => {
                    if (!hasError) {
                        // 如果没有收到最终结果，尝试停止并返回 null
                        ExpoSpeechRecognitionModule.removeListener(
                            'result',
                            resultListener,
                        );
                        ExpoSpeechRecognitionModule.removeListener(
                            'error',
                            errorListener,
                        );
                        ExpoSpeechRecognitionModule.removeListener(
                            'end',
                            endListener,
                        );
                        resolve('');
                    }
                };

                // 注册事件监听器
                ExpoSpeechRecognitionModule.addListener(
                    'result',
                    resultListener,
                );
                ExpoSpeechRecognitionModule.addListener('error', errorListener);
                ExpoSpeechRecognitionModule.addListener('end', endListener);

                // 开始识别，使用音频文件作为输入源
                ExpoSpeechRecognitionModule.start({
                    lang,
                    audioSource: {
                        uri: audioUri,
                    },
                    interimResults: false, // 只返回最终结果
                });
            });
        } catch (error) {
            // 确保清理资源
            try {
                ExpoSpeechRecognitionModule.abort();
            } catch {
                // 忽略中止错误
            }
            return null;
        }
    };
}
