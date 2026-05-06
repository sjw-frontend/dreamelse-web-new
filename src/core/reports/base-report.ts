// @ts-nocheck
import type { CoreTypes } from '$/types';

import { BaseReactive } from '../@com';

const BaseReportSymbol = Symbol('BaseReport');

export abstract class BaseReport<
    TModelInstance extends CoreTypes.Model,
    TEventName extends string = never,
> extends BaseReactive<
    never,
    CoreTypes.ReportProps<TModelInstance, TEventName>
> {
    public static readonly [BaseReportSymbol]: typeof BaseReportSymbol =
        BaseReportSymbol;

    #onCall?: LibTypes.CallListener<TModelInstance, TEventName>;

    public readonly [BaseReportSymbol]: typeof BaseReportSymbol =
        BaseReportSymbol;

    protected get target() {
        return this.props.target;
    }

    protected get onCall() {
        this.#onCall ??= {
            before: (evtName, cb) => {
                this.props.originalCallEvents.addEventListener(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                    evtName as any,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion
                    ((evt: unknown) => {
                        const data =
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            evt as LibTypes.OriginalCallEventCallbackInfo<LibTypes.Func>;

                        if (data.kind === 'preCall') {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                            cb({ params: data.value } as any); // TODO 类型不安全
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    }) as any,
                );
            },
            after: (evtName, cb) => {
                this.props.originalCallEvents.addEventListener(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                    evtName as any,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion
                    ((evt: unknown) => {
                        const data =
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            evt as LibTypes.OriginalCallEventCallbackInfo<LibTypes.Func>;

                        if (data.kind === 'postCall') {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
                            cb({ result: data.value } as any); // TODO 类型不安全
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    }) as any,
                );
            },
        };

        return this.#onCall;
    }
}
