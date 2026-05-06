import * as Sentry from '@sentry/react';
import { useRouterState } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { RouterController } from '$/controllers';
import { RouterEnums } from '$/enums';
import { LoginError } from '$/errors';
import { useZoneController } from '$/hooks';
import { RouteFocusedHookContext, RouteHookContext } from '../contexts';
import { pathToRouteName } from '$/services/router-name-map';

const FallbackComponent = ({ error }: FallbackProps) => {
    const routerCtrl = useZoneController(RouterController);
    if (error instanceof LoginError) {
        routerCtrl.replace(RouterEnums.RouteName.Login);
    }
    return null;
};

const useWebRouteFocused = () => true;

const useWebRoute = () => {
    const state = useRouterState();
    const match = state.matches.at(-1);
    if (!match) return null;
    const name = pathToRouteName(state.location.pathname);
    if (!name) return null;
    return { name, key: match.id, params: match.params as Record<string, string> };
};

export const ScreenView = ({ children }: { children: ReactNode }) => (
    <RouteFocusedHookContext value={useWebRouteFocused}>
        <RouteHookContext value={useWebRoute}>
            <ErrorBoundary
                FallbackComponent={FallbackComponent}
                onError={(error, info) => {
                    Sentry.withScope(scope => {
                        scope.setContext('react_error_boundary', { componentStack: info.componentStack });
                        Sentry.captureException(error);
                    });
                }}
            >
                <div className="flex flex-col flex-1 h-full bg-bg-page overflow-hidden">
                    {children}
                </div>
            </ErrorBoundary>
        </RouteHookContext>
    </RouteFocusedHookContext>
);
