// web版：替换 react-native useWindowDimensions → window
export const useWaterfallContentWidth = (marginHorizontal = 8) => {
    const width = window.innerWidth;
    // 两列瀑布流，每列宽度 = (总宽 - 左右margin - 列间距) / 2
    return Math.floor((width - marginHorizontal * 2 - 8) / 2);
};
