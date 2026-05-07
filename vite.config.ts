import { defineConfig, type Plugin } from 'vite';
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
const reflectMetadataPatchPlugin = (): Plugin => ({
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
            const reflectPath = path.resolve(
                __dirname,
                'node_modules/reflect-metadata/Reflect.js',
            );
            const originalCode = fs.readFileSync(reflectPath, 'utf-8');
            return originalCode + METADATA_PATCH;
        }
        return null;
    },
    transform(code, id) {
        // Also patch the metadata function bundled inside inversify
        if (id.includes('inversify') && code.includes('function metadata(metadataKey, metadataValue)')) {
            const patchedCode = code.replace(
                /function metadata\(metadataKey, metadataValue\) \{[\s\S]*?function decorator\(target, propertyKey\) \{[\s\S]*?OrdinaryDefineOwnMetadata\(metadataKey, metadataValue, target, propertyKey\);[\s\S]*?\}[\s\S]*?return decorator;[\s\S]*?\}/,
                `function metadata(metadataKey, metadataValue) {
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
    }`,
            );
            if (patchedCode !== code) {
                return { code: patchedCode, map: null };
            }
        }
        return null;
    },
});
const rnStubPlugin = (): Plugin => {
    const navStubPath = path.resolve(__dirname, 'src/stubs/react-navigation-native-stub.ts');
    const rnStubPath = path.resolve(__dirname, 'src/stubs/react-native-stub.js');
    return {
        name: 'rn-stub',
        enforce: 'pre',
        resolveId(id) {
            if (id === '@react-navigation/native') {
                return navStubPath;
            }
            if (id === 'react-native') {
                return rnStubPath;
            }
            if (rnPackages.includes(id)) {
                return `\0rn-stub:${id}`;
            }
            return null;
        },
        load(id) {
            if (id.startsWith('\0rn-stub:')) {
                return 'export default {}; export const __esModule = true;';
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
            { find: '$/core',          replacement: path.resolve(__dirname, 'src/core') },
            { find: '$/controllers',   replacement: path.resolve(__dirname, 'src/controllers') },
            { find: '$/domains',       replacement: path.resolve(__dirname, 'src/domains') },
            { find: '$/hooks',         replacement: path.resolve(__dirname, 'src/hooks') },
            { find: '$/services',      replacement: path.resolve(__dirname, 'src/services') },
            { find: '$/reactivity',    replacement: path.resolve(__dirname, 'src/reactivity') },
            { find: '$/types',         replacement: path.resolve(__dirname, 'src/types') },
            { find: '$/enums',         replacement: path.resolve(__dirname, 'src/enums') },
            { find: '$/utils',         replacement: path.resolve(__dirname, 'src/utils') },
            { find: '$/consts',        replacement: path.resolve(__dirname, 'src/consts') },
            { find: '$/view',          replacement: path.resolve(__dirname, 'src/view') },
            { find: '$/hocs',          replacement: path.resolve(__dirname, 'src/hocs') },
            { find: '$/effects',       replacement: path.resolve(__dirname, 'src/effects') },
            { find: '$/errors',        replacement: path.resolve(__dirname, 'src/errors') },
            { find: '$/uis',           replacement: path.resolve(__dirname, 'src/uis') },
            { find: '$/component-controllers', replacement: path.resolve(__dirname, 'src/component-controllers/index.ts') },
            { find: '$/components',    replacement: path.resolve(__dirname, 'src/components') },
            { find: '$/pages',         replacement: path.resolve(__dirname, 'src/pages') },
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
                rewrite: (p: string) => p.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        target: 'es2022',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react':      ['react', 'react-dom'],
                    'vendor-reactivity': ['@vue/reactivity'],
                    'vendor-inversify':  ['inversify', 'reflect-metadata'],
                    'vendor-router':     ['@tanstack/react-router'],
                    'vendor-motion':     ['framer-motion'],
                },
            },
        },
    },
});
