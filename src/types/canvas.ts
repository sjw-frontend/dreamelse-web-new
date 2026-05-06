export declare namespace CanvasTypes {
    type Point = LibTypes.FrozenDefine<{
        x: number,
        y: number,
        ts: number,
    }>;

    type Line = LibTypes.Arr<Point>;
}
