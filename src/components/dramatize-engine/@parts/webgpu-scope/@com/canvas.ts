export class ReactNativeCanvas {
    readonly #canvas: HTMLCanvasElement;

    // eslint-disable-next-line @typescript-eslint/member-ordering
    public constructor(canvas: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.#canvas = canvas as HTMLCanvasElement;
    }

    public get width() { return this.#canvas.width; }
    public set width(v: number) { this.#canvas.width = v; }
    public get height() { return this.#canvas.height; }
    public set height(v: number) { this.#canvas.height = v; }
    public get clientWidth() { return this.#canvas.clientWidth; }
    public set clientWidth(_v: number) {}
    public get clientHeight() { return this.#canvas.clientHeight; }
    public set clientHeight(_v: number) {}
    public get style() { return this.#canvas.style; }

    public getContext(contextName: string, options?: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access
        return (this.#canvas as any).getContext(contextName, options);
    }

    public getBoundingClientRect() {
        return this.#canvas.getBoundingClientRect();
    }

    public addEventListener(type: string, listener: EventListener) {
        this.#canvas.addEventListener(type, listener);
    }

    public removeEventListener(type: string, listener: EventListener) {
        this.#canvas.removeEventListener(type, listener);
    }

    public dispatchEvent(event: Event) {
        return this.#canvas.dispatchEvent(event);
    }

    public setPointerCapture() {}
    public releasePointerCapture() {}
}
