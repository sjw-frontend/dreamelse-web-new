// web版：升级为 Web MediaRecorder API
import { BaseService, service } from '$/core';

export type RecordingResult = LibTypes.FrozenDefine<{ uri: string; duration: number; size: number }>;
export type RecordingStatus = LibTypes.FrozenDefine<{ isRecording: boolean; durationMillis: number }>;

@service()
export class VoiceService extends BaseService {
    #mediaRecorder: MediaRecorder | null = null;
    #chunks: Blob[] = [];
    #startTime = 0;

    public readonly initRecording = async (): Promise<void> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.#mediaRecorder = new MediaRecorder(stream);
        this.#chunks = [];
        this.#mediaRecorder.ondataavailable = e => this.#chunks.push(e.data);
    };

    public readonly startRecording = (): boolean => {
        if (!this.#mediaRecorder) return false;
        this.#mediaRecorder.start();
        this.#startTime = Date.now();
        return true;
    };

    public readonly finishRecording = (): Promise<RecordingResult | null> => {
        if (!this.#mediaRecorder) return Promise.resolve(null);
        return new Promise(resolve => {
            this.#mediaRecorder!.onstop = () => {
                const blob = new Blob(this.#chunks, { type: 'audio/webm' });
                const uri = URL.createObjectURL(blob);
                resolve({ uri, duration: Date.now() - this.#startTime, size: blob.size });
            };
            this.#mediaRecorder!.stop();
        });
    };

    public readonly cancelRecording = async (): Promise<void> => {
        this.#mediaRecorder?.stop();
        this.#chunks = [];
    };

    public readonly isRecording = () => this.#mediaRecorder?.state === 'recording';

    public readonly transcribeAudioToText = (_audioUri: string, _lang = 'zh-CN'): string | null => null;
}
