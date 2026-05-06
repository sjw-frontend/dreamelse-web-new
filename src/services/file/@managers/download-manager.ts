// @ts-nocheck
import { File } from 'expo-file-system';

type ResultFile = Awaited<ReturnType<typeof File.downloadFileAsync>>;

// 定义下载任务的结构
type DownloadTask = LibTypes.FrozenDefine<
    {
        id: string,
        remoteUri: string,
        file: File,
        retries: number,
        task: Promise<ResultFile>,
        resolve?: (file: ResultFile) => void,
        reject?: (error: unknown) => void,
    },
    'file'
>;

class AssetDownloadManager {
    public constructor(concurrency = 20) {
        this.#concurrency = concurrency;
    }

    readonly #concurrency: number;
    readonly #resultRecord: LibTypes.VarGeneralObj<Promise<ResultFile>> = {};
    readonly #queue: LibTypes.VarArr<DownloadTask> = [];
    #activeCount = 0;

    async #processNext() {
        // 检查并发限制和队列状态
        if (
            this.#activeCount >= this.#concurrency ||
            this.#queue.length === 0
        ) {
            return;
        }

        const task = this.#queue.shift();
        if (!task) return;

        const { id, remoteUri, file, retries, resolve, reject } = task;
        if (file.exists) {
            resolve?.(file);
            return;
        }

        if (resolve && reject) {
            this.#activeCount++;
            try {
                const result = await File.downloadFileAsync(remoteUri, file);
                resolve(result);
            } catch (error) {
                console.log(
                    '[DownloadManager] error',
                    id,
                    error,
                    remoteUri,
                    file,
                );

                if (retries > 0) {
                    console.warn(
                        `[DownloadManager] 下载失败，正在重试 (${retries}): ${remoteUri}`,
                    );
                    // 重新入队，减少重试次数
                    this.#queue.push({ ...task, retries: retries - 1 });
                } else {
                    console.error(
                        `[DownloadManager] 任务最终失败: ${remoteUri}`,
                        error,
                    );
                    reject(error);
                }
            } finally {
                this.#activeCount--;
                // 递归触发下一个任务
                this.#processNext();
            }
        }
    }

    public readonly download = async (
        id: string,
        file: File,
        remoteUri: string,
        retries = 2,
    ) => {
        if (file.exists) {
            return file;
        }

        if (!file.parentDirectory.exists) {
            try {
                file.parentDirectory.create({
                    intermediates: true,
                    overwrite: true,
                });
            } catch (e) {
                const oldDirectory = file.parentDirectory.parentDirectory
                    .list()
                    .find(
                        item =>
                            item.name.toLowerCase() ===
                            file.parentDirectory.name.toLowerCase(),
                    );
                if (oldDirectory) {
                    oldDirectory.delete();
                }
                file.parentDirectory.create({
                    intermediates: true,
                    overwrite: true,
                });
            }
        }

        let task = this.#resultRecord[id];

        if (!task) {
            let resolve;
            let reject;
            task = new Promise<ResultFile>((resolve0, reject0) => {
                resolve = resolve0;
                reject = reject0;
            });

            this.#queue.push({
                id,
                task,
                file,
                remoteUri,
                retries,
                resolve,
                reject,
            });
            this.#processNext();
        }

        this.#resultRecord[id] = task;

        return task;
    };
}

// 导出单例，方便全 App 复用同一个限流队列
export const downloadManager = new AssetDownloadManager();
