// @ts-nocheck
import {
    type NavigationAction,
    createNavigationContainerRef,
} from '@react-navigation/native';

import { BaseService, service } from '$/core';
import type { RouterTypes } from '$/types';
import { TimerUtils } from '$/utils';

const NavigatorGetterSymbol = Symbol('NavigatorGetter');

@service()
export class RouterService extends BaseService {
    public static readonly NavigatorGetterSymbol: typeof NavigatorGetterSymbol =
        NavigatorGetterSymbol;

    readonly #navigator =
        createNavigationContainerRef<RouterTypes.RouteParamList>();

    public readonly addListener = this.#navigator.addListener.bind(
        this.#navigator,
    );

    public readonly removeListener = this.#navigator.removeListener.bind(
        this.#navigator,
    );

    public get [NavigatorGetterSymbol]() {
        return this.#navigator;
    }

    public readonly callAction = (action: NavigationAction) => {
        if (this.#navigator.isReady()) {
            this.#navigator.dispatch(action);
        } else {
            TimerUtils.nextTick(() => {
                if (this.#navigator.isReady()) {
                    this.#navigator.dispatch(action);
                }
            });
        }
    };

    public readonly canGoBack = () => this.#navigator.canGoBack();
}
