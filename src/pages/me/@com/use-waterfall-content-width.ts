// @ts-nocheck
import { useWindowDimensions } from 'react-native';

export const useWaterfallContentWidth = (marginHorizontal = 8) => {
    const dimensions = useWindowDimensions();

    return (dimensions.width - marginHorizontal * 2 - 8) / 2;
};
