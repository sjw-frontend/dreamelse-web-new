// Stub for @react-navigation/native — implements CommonActions and StackActions
// so RouterController can generate proper action objects

export const CommonActions = {
    navigate: (name: string, params?: Record<string, unknown>) => ({
        type: 'NAVIGATE' as const,
        payload: { name, params },
    }),
    reset: (state: { routes: Array<{ name: string; params?: Record<string, unknown> }> }) => ({
        type: 'RESET' as const,
        payload: state,
    }),
    goBack: () => ({
        type: 'GO_BACK' as const,
        payload: undefined,
    }),
    preload: (name: string, params?: Record<string, unknown>) => ({
        type: 'PRELOAD' as const,
        payload: { name, params },
    }),
    setParams: (params: Record<string, unknown>) => ({
        type: 'SET_PARAMS' as const,
        payload: { params },
    }),
};

export const StackActions = {
    push: (name: string, params?: Record<string, unknown>) => ({
        type: 'NAVIGATE' as const,
        payload: { name, params },
    }),
    replace: (name: string, params?: Record<string, unknown>) => ({
        type: 'REPLACE' as const,
        payload: { name, params },
    }),
    pop: (_count?: number) => ({
        type: 'GO_BACK' as const,
        payload: undefined,
    }),
    popTo: (name: string, params?: Record<string, unknown>) => ({
        type: 'NAVIGATE' as const,
        payload: { name, params },
    }),
    popToTop: () => ({
        type: 'RESET' as const,
        payload: { routes: [] },
    }),
};

export const createNavigationContainerRef = () => ({
    isReady: () => false,
    dispatch: () => {},
    navigate: () => {},
    reset: () => {},
    goBack: () => {},
    addListener: () => () => {},
    removeListener: () => {},
    canGoBack: () => false,
    getCurrentRoute: () => null,
    getCurrentOptions: () => ({}),
    getRootState: () => ({ routes: [], index: 0, key: '', type: 'stack' }),
});

export default {};
