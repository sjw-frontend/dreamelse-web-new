// web版：替换 react-native Dimensions → window
export const getWindowDimensions = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: window.devicePixelRatio,
    fontScale: 1,
});
