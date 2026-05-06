import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// RN/Expo packages that are replaced by .web.ts overrides at runtime
// but still appear in copied controller/service files with @ts-nocheck
const rnPackages = [
    'react-native',
    'react-native-reanimated',
    'react-native-worklets',
    'react-native-permissions',
    'react-native-volume-manager',
    'react-native-appsflyer',
    '@react-navigation/native',
    '@sentry/react-native',
    'expo-constants',
    'expo-device',
    'expo-linking',
    'expo-network',
    'expo-secure-store',
    'expo-crypto',
    'expo-image-picker',
    'expo-file-system',
    'expo-audio',
    'expo-media-library',
    'expo-modules-core',
    'expo-speech-recognition',
    'expo-haptics',
    'expo-clipboard',
    'expo-apple-authentication',
    'expo/fetch',
    'expo-image',
    'expo-linear-gradient',
    'expo-keep-awake',
    'react-native-wgpu',
    'lottie-react-native',
    'safe-stable-stringify',
    'buffer',
];
import fs from 'fs';
// Plugin that patches reflect-metadata to work with new TC39 decorator spec
const REFLECT_METADATA_PATCHED_ID = '\0reflect-metadata-patched';
const METADATA_PATCH = `
;(function() {
    if (typeof Reflect === 'undefined' || typeof Reflect.metadata !== 'function') return;
    var _orig = Reflect.metadata.bind(Reflect);
    Reflect.metadata = function(key, value) {
        var legacy = _orig(key, value);
        return function(target, contextOrPropKey) {
            if (contextOrPropKey !== null && contextOrPropKey !== undefined &&
                typeof contextOrPropKey === 'object' && 'kind' in contextOrPropKey) {
                Reflect.defineMetadata(key, value, target);
                return;
            }
            return legacy(target, contextOrPropKey);
        };
    };
})();
`;
const reflectMetadataPatchPlugin = () => ({
    name: 'reflect-metadata-patch',
    enforce: 'pre',
    resolveId(id) {
        if (id === 'reflect-metadata') {
            return REFLECT_METADATA_PATCHED_ID;
        }
        return null;
    },
    load(id) {
        if (id === REFLECT_METADATA_PATCHED_ID) {
            const reflectPath = path.resolve(__dirname, 'node_modules/reflect-metadata/Reflect.js');
            const originalCode = fs.readFileSync(reflectPath, 'utf-8');
            return originalCode + METADATA_PATCH;
        }
        return null;
    },
    transform(code, id) {
        // Also patch the metadata function bundled inside inversify
        if (id.includes('inversify') && code.includes('function metadata(metadataKey, metadataValue)')) {
            const patchedCode = code.replace(/function metadata\(metadataKey, metadataValue\) \{[\s\S]*?function decorator\(target, propertyKey\) \{[\s\S]*?OrdinaryDefineOwnMetadata\(metadataKey, metadataValue, target, propertyKey\);[\s\S]*?\}[\s\S]*?return decorator;[\s\S]*?\}/, `function metadata(metadataKey, metadataValue) {
      function decorator(target, propertyKey) {
        if (propertyKey !== null && propertyKey !== undefined && typeof propertyKey === 'object' && 'kind' in propertyKey) {
          OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, undefined);
          return;
        }
        if (!IsObject(target))
          throw new TypeError();
        if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
          throw new TypeError();
        OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
      }
      return decorator;
    }`);
            if (patchedCode !== code) {
                return { code: patchedCode, map: null };
            }
        }
        return null;
    },
});
const rnStubPlugin = () => {
    const navStubPath = path.resolve(__dirname, 'src/stubs/react-navigation-native-stub.ts');
    return {
        name: 'rn-stub',
        enforce: 'pre',
        resolveId(id) {
            if (id === '@react-navigation/native') {
                return navStubPath;
            }
            if (rnPackages.includes(id)) {
                return `\0rn-stub:${id}`;
            }
            return null;
        },
        load(id) {
            if (id.startsWith('\0rn-stub:')) {
                const pkg = id.replace('\0rn-stub:', '');
                // expo-device needs totalMemory
                if (pkg === 'expo-audio') {
                    return `
export default {};
export const __esModule = true;
export const useAudioPlayer = () => ({ play: () => {}, pause: () => {}, stop: () => {}, seekTo: () => {}, setVolume: () => {}, remove: () => {}, playing: false, currentTime: 0, duration: 0 });
export const useAudioPlayerStatus = () => ({});
export const createAudioPlayer = () => ({ play: () => {}, pause: () => {}, stop: () => {}, remove: () => {}, seekTo: () => {}, setVolume: () => {} });
export const AudioStatus = {};
`;
                }
                if (pkg === 'expo-device') {
                    return `
export default {};
export const __esModule = true;
export const totalMemory = null;
export const osName = 'web';
export const osVersion = null;
export const deviceName = null;
export const brand = null;
export const manufacturer = null;
export const modelName = null;
export const isDevice = true;
export const DeviceType = { UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 };
`;
                }
                if (pkg === 'expo-image') {
                    return `
export default {};
export const __esModule = true;
export const Image = () => null;
`;
                }
                if (pkg === 'expo-linear-gradient') {
                    return `
export default {};
export const __esModule = true;
export const LinearGradient = () => null;
`;
                }
                if (pkg === 'lottie-react-native') {
                    return `
export default () => null;
export const __esModule = true;
`;
                }
                // react-native needs many named exports
                return `
export default {};
export const __esModule = true;
export const PixelRatio = { get: () => (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, getFontScale: () => 1, getPixelSizeForLayoutSize: (n) => n * ((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1), roundToNearestPixel: (n) => n };
export const Platform = { OS: 'web', select: (obj) => obj.web ?? obj.default ?? null, Version: 0 };
export const Dimensions = { get: (dim) => typeof window !== 'undefined' ? (dim === 'window' ? { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 } : { width: window.screen.width, height: window.screen.height, scale: 1, fontScale: 1 }) : { width: 375, height: 812, scale: 1, fontScale: 1 }, addEventListener: () => ({ remove: () => {} }), removeEventListener: () => {} };
export const StyleSheet = { create: (s) => s, flatten: (s) => s, hairlineWidth: 1, absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } };
export const Animated = { Value: class { constructor(v) { this._v = v; } setValue(v) { this._v = v; } addListener() {} removeListener() {} interpolate() { return this; } }, timing: () => ({ start: (cb) => cb?.({ finished: true }) }), spring: () => ({ start: (cb) => cb?.({ finished: true }) }), parallel: (a) => ({ start: (cb) => { a.forEach(x => x.start()); cb?.({ finished: true }); } }), sequence: (a) => ({ start: (cb) => { a.forEach(x => x.start()); cb?.({ finished: true }); } }), delay: () => ({ start: (cb) => cb?.({ finished: true }) }), loop: () => ({ start: () => {}, stop: () => {} }), event: () => () => {}, createAnimatedComponent: (C) => C };
export const useWindowDimensions = () => typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 } : { width: 375, height: 812, scale: 1, fontScale: 1 };
export const View = () => null;
export const Text = () => null;
export const Image = () => null;
export const TouchableOpacity = () => null;
export const ScrollView = () => null;
export const FlatList = () => null;
export const TextInput = () => null;
export const Modal = () => null;
export const ActivityIndicator = () => null;
export const Pressable = () => null;
export const SafeAreaView = () => null;
export const TouchableWithoutFeedback = () => null;
export const TouchableHighlight = () => null;
export const KeyboardAvoidingView = () => null;
export const StatusBar = () => null;
export const Switch = () => null;
export const Slider = () => null;
export const RefreshControl = () => null;
export const SectionList = () => null;
export const VirtualizedList = () => null;
export const DrawerLayoutAndroid = () => null;
export const Alert = { alert: () => {} };
export const Keyboard = { dismiss: () => {}, addListener: () => ({ remove: () => {} }), removeListener: () => {} };
export const AppState = { currentState: 'active', addEventListener: () => ({ remove: () => {} }) };
export const Linking = { openURL: () => Promise.resolve(), canOpenURL: () => Promise.resolve(false), getInitialURL: () => Promise.resolve(null), addEventListener: () => ({ remove: () => {} }) };
export const Vibration = { vibrate: () => {}, cancel: () => {} };
export const Share = { share: () => Promise.resolve({ action: 'dismissedAction' }) };
export const Clipboard = { getString: () => Promise.resolve(''), setString: () => {} };
export const NativeModules = {};
export const NativeEventEmitter = class { constructor() {} addListener() { return { remove: () => {} }; } removeAllListeners() {} };
export const DeviceEventEmitter = { addListener: () => ({ remove: () => {} }), emit: () => {}, removeAllListeners: () => {} };
export const InteractionManager = { runAfterInteractions: (cb) => { setTimeout(cb, 0); return { cancel: () => {} }; } };
export const BackHandler = { addEventListener: () => ({ remove: () => {} }), removeEventListener: () => {}, exitApp: () => {} };
export const Easing = { linear: (t) => t, ease: (t) => t, quad: (t) => t * t, cubic: (t) => t * t * t, in: (e) => e, out: (e) => (t) => 1 - e(1 - t), inOut: (e) => (t) => t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2, bezier: () => (t) => t };
`;
            }
            return null;
        },
    };
};
export default defineConfig({
    plugins: [
        reflectMetadataPatchPlugin(),
        rnStubPlugin(),
        react({
            include: /\.(tsx?|jsx?)$/,
            babel: {
                plugins: [
                    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
                    'babel-plugin-transform-typescript-metadata',
                ],
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        extensions: [
            '.web.tsx', '.web.ts',
            '.tsx', '.ts',
            '.jsx', '.js',
            '.json',
        ],
        alias: [
            { find: '$/core', replacement: path.resolve(__dirname, 'src/core') },
            { find: '$/controllers', replacement: path.resolve(__dirname, 'src/controllers') },
            { find: '$/domains', replacement: path.resolve(__dirname, 'src/domains') },
            { find: '$/hooks', replacement: path.resolve(__dirname, 'src/hooks') },
            { find: '$/services', replacement: path.resolve(__dirname, 'src/services') },
            { find: '$/reactivity', replacement: path.resolve(__dirname, 'src/reactivity') },
            { find: '$/types', replacement: path.resolve(__dirname, 'src/types') },
            { find: '$/enums', replacement: path.resolve(__dirname, 'src/enums') },
            { find: '$/utils', replacement: path.resolve(__dirname, 'src/utils') },
            { find: '$/consts', replacement: path.resolve(__dirname, 'src/consts') },
            { find: '$/view', replacement: path.resolve(__dirname, 'src/view') },
            { find: '$/hocs', replacement: path.resolve(__dirname, 'src/hocs') },
            { find: '$/effects', replacement: path.resolve(__dirname, 'src/effects') },
            { find: '$/errors', replacement: path.resolve(__dirname, 'src/errors') },
            { find: '$/uis', replacement: path.resolve(__dirname, 'src/uis') },
            { find: '$/component-controllers', replacement: path.resolve(__dirname, 'src/component-controllers') },
            { find: '$/components', replacement: path.resolve(__dirname, 'src/components') },
            { find: '$/pages', replacement: path.resolve(__dirname, 'src/pages') },
            { find: '$/global-symbol', replacement: path.resolve(__dirname, 'src/types/@global-symbol') },
        ],
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
        '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
    optimizeDeps: {
        // Exclude from pre-bundling so our patch plugin can transform them
        exclude: ['reflect-metadata', 'inversify'],
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: process.env.VITE_API_ORIGIN ?? 'https://dev-02.imaginewithu.com',
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        target: 'es2022',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-reactivity': ['@vue/reactivity'],
                    'vendor-inversify': ['inversify', 'reflect-metadata'],
                    'vendor-router': ['@tanstack/react-router'],
                    'vendor-motion': ['framer-motion'],
                },
            },
        },
    },
});
