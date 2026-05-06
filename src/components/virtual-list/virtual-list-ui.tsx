// VirtualList — 基于 FlatList 原语的业务虚拟列表组件
import { FlatList } from '$/uis/primitives';
import type { FlatListProps } from '$/uis/primitives/flat-list';
import { optimize } from '$/view/optimize';

export type { FlatListProps as VirtualListProps };

export const VirtualList = optimize(
    <T,>(props: FlatListProps<T>) => <FlatList {...props} />,
) as typeof FlatList;
