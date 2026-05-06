// web版：CSS env() 替代 RN SafeAreaInsets，返回零值（桌面端）
export const useSafeLayoutInsets = () => ({
    top:    0,
    bottom: 0,
    left:   0,
    right:  0,
    originalSafeInsets: { top: 0, bottom: 0, left: 0, right: 0 },
});
