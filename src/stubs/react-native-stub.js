import React from 'react';

export default {};
export const __esModule = true;

// Primitives
export const View = ({ children, style, ...props }) => React.createElement('div', { style, ...props }, children);
export const Text = ({ children, style, ...props }) => React.createElement('span', { style, ...props }, children);
export const Image = ({ source, style, ...props }) => {
    const src = typeof source === 'string' ? source : source?.uri ?? source?.default ?? '';
    return React.createElement('img', { src, style, ...props });
};
export const TextInput = ({ style, ...props }) => React.createElement('input', { style, ...props });
export const ScrollView = ({ children, style, ...props }) => React.createElement('div', { style: { overflow: 'auto', ...style }, ...props }, children);
export const TouchableOpacity = ({ children, style, onPress, ...props }) => React.createElement('div', { style: { cursor: 'pointer', ...style }, onClick: onPress, ...props }, children);
export const Pressable = ({ children, style, onPress, ...props }) => React.createElement('div', { style: { cursor: 'pointer', ...(typeof style === 'function' ? style({ pressed: false }) : style) }, onClick: onPress, ...props }, children);
export const FlatList = ({ data, renderItem, style }) => React.createElement('div', { style }, data?.map((item, index) => renderItem({ item, index })));
export const ActivityIndicator = () => React.createElement('div', { style: { width: 20, height: 20, border: '2px solid #ccc', borderTopColor: '#fff', borderRadius: '50%' } });
export const SafeAreaView = ({ children, style, ...props }) => React.createElement('div', { style, ...props }, children);
export const Modal = ({ children, visible, ...props }) => visible ? React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 9999 }, ...props }, children) : null;
export const KeyboardAvoidingView = ({ children, style, ...props }) => React.createElement('div', { style, ...props }, children);
export const TouchableWithoutFeedback = ({ children, onPress, ...props }) => React.createElement('div', { onClick: onPress, ...props }, children);

// APIs
export const StyleSheet = {
    create: (styles) => styles,
    flatten: (style) => Object.assign({}, ...(Array.isArray(style) ? style.filter(Boolean) : [style].filter(Boolean))),
    hairlineWidth: 1,
};
export const Platform = { OS: 'web', select: (obj) => obj.web ?? obj.default, Version: 0 };
export const Dimensions = {
    get: (dim) => dim === 'window'
        ? { width: window.innerWidth, height: window.innerHeight, scale: window.devicePixelRatio, fontScale: 1 }
        : { width: window.screen.width, height: window.screen.height, scale: window.devicePixelRatio, fontScale: 1 },
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
};
export const PixelRatio = {
    get: () => window.devicePixelRatio || 1,
    getFontScale: () => 1,
    getPixelSizeForLayoutSize: (size) => Math.round(size * (window.devicePixelRatio || 1)),
    roundToNearestPixel: (size) => Math.round(size * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1),
};
export const useWindowDimensions = () => ({ width: window.innerWidth, height: window.innerHeight, scale: window.devicePixelRatio, fontScale: 1 });
export const useColorScheme = () => 'dark';
export const Keyboard = {
    dismiss: () => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); },
    addListener: () => ({ remove: () => {} }),
    removeAllListeners: () => {},
};
export const Vibration = { vibrate: () => {}, cancel: () => {} };
export const AppState = {
    currentState: 'active',
    addEventListener: () => ({ remove: () => {} }),
};
export const Linking = {
    openURL: (url) => window.open(url, '_blank'),
    canOpenURL: () => Promise.resolve(true),
    getInitialURL: () => Promise.resolve(window.location.href),
    addEventListener: () => ({ remove: () => {} }),
};
export const Share = { share: (content) => navigator.share ? navigator.share(content) : Promise.resolve() };
export const Clipboard = {
    setString: (text) => navigator.clipboard?.writeText(text),
    getString: () => navigator.clipboard?.readText() ?? Promise.resolve(''),
};
export const Alert = {
    alert: (title, message, buttons) => {
        if (buttons?.length) {
            if (window.confirm(title + (message ? '\n' + message : ''))) {
                buttons.find(b => b.style !== 'cancel')?.onPress?.();
            } else {
                buttons.find(b => b.style === 'cancel')?.onPress?.();
            }
        } else {
            window.alert(title + (message ? '\n' + message : ''));
        }
    },
};
export const Animated = {
    Value: class { constructor(v) { this._value = v; } setValue(v) { this._value = v; } },
    View: ({ children, style, ...props }) => React.createElement('div', { style, ...props }, children),
    Text: ({ children, style, ...props }) => React.createElement('span', { style, ...props }, children),
    Image: ({ source, style, ...props }) => React.createElement('img', { src: typeof source === 'string' ? source : source?.uri, style, ...props }),
    timing: () => ({ start: (cb) => cb?.({ finished: true }), stop: () => {}, reset: () => {} }),
    spring: () => ({ start: (cb) => cb?.({ finished: true }), stop: () => {}, reset: () => {} }),
    parallel: (anims) => ({ start: (cb) => { anims.forEach(a => a.start()); cb?.({ finished: true }); }, stop: () => {} }),
    sequence: (anims) => ({ start: (cb) => { anims.forEach(a => a.start()); cb?.({ finished: true }); }, stop: () => {} }),
    createAnimatedComponent: (C) => C,
    event: () => () => {},
    add: (a) => a,
};
export const PanResponder = { create: () => ({ panHandlers: {} }) };
export const NativeModules = {};
export const NativeEventEmitter = class { addListener() { return { remove: () => {} }; } removeAllListeners() {} };
export const InteractionManager = { runAfterInteractions: (cb) => { setTimeout(cb, 0); return { cancel: () => {} }; } };
export const BackHandler = { addEventListener: () => ({ remove: () => {} }), removeEventListener: () => {} };
export const StatusBar = { setBarStyle: () => {}, setBackgroundColor: () => {}, setHidden: () => {} };
export const LayoutAnimation = { configureNext: () => {}, Presets: {}, Types: {}, Properties: {} };
export const AccessibilityInfo = { isScreenReaderEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => {} }) };
export const I18nManager = { isRTL: false, forceRTL: () => {}, allowRTL: () => {} };
export const DeviceEventEmitter = { addListener: () => ({ remove: () => {} }), emit: () => {}, removeAllListeners: () => {} };
export const findNodeHandle = () => null;
export const requireNativeComponent = () => 'div';
