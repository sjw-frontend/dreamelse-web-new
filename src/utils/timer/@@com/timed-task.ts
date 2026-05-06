export type TimedTaskOptions = LibTypes.FrozenDefine<{
    loop?: boolean,
    speed?: number,
    isSuspended?: boolean,
}>;

export class TimedTask {
    public constructor(
        handler: LibTypes.SimpleFunction,
        delayMS: number,
        options: TimedTaskOptions,
    ) {
        const { loop = false, speed = 1, isSuspended } = options;
        this.#handler = handler;
        this.#originalDelayMS = delayMS;
        this.#remainingMS = delayMS;
        this.#loop = loop;
        this.#speed = speed;
        this.#isSuspended = !!isSuspended;

        if (!this.#isSuspended) {
            this.resume();
        }
    }

    #timerId: LibTypes.TimerHandle | null = null;
    #startTimeMS = 0;
    #isSuspended = false;

    #remainingMS: number;
    #speed: number;

    readonly #loop: boolean;
    readonly #handler: LibTypes.SimpleFunction;
    readonly #originalDelayMS: number;

    public get speed() {
        return this.#speed;
    }

    public set speed(value: number) {
        if (value <= 0) throw new Error('Speed must be greater than 0');

        const wasRunning = !this.#isSuspended && this.#timerId !== null;

        // 关键：修改速度前，必须先结算当前的进度
        this.suspend();
        this.#speed = value;

        // 如果修改前是在运行状态，则立即恢复运行（应用新速度）
        if (wasRunning) {
            this.resume();
        }
    }

    #run() {
        // 物理层执行的等待时间 = 剩余逻辑时间 / 当前倍率
        const physicalTimeout = this.#remainingMS / this.#speed;

        this.#startTimeMS = Date.now();
        this.#timerId = setTimeout(() => {
            this.#handler();

            if (this.#loop) {
                this.#remainingMS = this.#originalDelayMS;
                this.#run();
            } else {
                this.#timerId = null;
            }
        }, physicalTimeout);
    }

    public readonly suspend = () => {
        if (this.#isSuspended || !this.#timerId) return;
        this.#isSuspended = true;
        clearTimeout(this.#timerId);

        // 计算已消耗的逻辑时间：(当前时间 - 物理开始时间) * 当前倍率
        const consumed = (Date.now() - this.#startTimeMS) * this.#speed;
        this.#remainingMS -= consumed;
    };

    public readonly resume = () => {
        if (!this.#isSuspended && this.#timerId !== null) return;
        this.#isSuspended = false;
        if (this.#remainingMS <= 0 && !this.#loop) return;
        this.#run();
    };

    public readonly clear = () => {
        if (this.#timerId) {
            clearTimeout(this.#timerId);
            this.#timerId = null;
        }
    };
}
