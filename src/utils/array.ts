// @ts-nocheck
export const randomPickArray = <T>(
    array: LibTypes.Arr<T>,
    pick: number,
): LibTypes.VarArr<T | undefined> => {
    // 1. 应用过滤函数（如果提供）
    const innerArr = [...array];

    // 2. 检查边界情况
    if (pick <= 0 || innerArr.length === 0) {
        return [];
    }

    // 3. 如果要选取的数量大于等于数组长度，直接返回打乱后的整个数组
    if (pick >= innerArr.length) {
        return [...innerArr].sort(() => Math.random() - 0.5);
    }

    // 4. 随机选取指定数量的元素（不重复）
    const result: LibTypes.VarArr<T | undefined> = [];
    const copiedArr = [...innerArr];

    for (let i = 0; i < pick; i++) {
        const randomIndex = Math.floor(Math.random() * copiedArr.length);
        const randomPickItem = copiedArr[randomIndex];
        result.push(randomPickItem);
        copiedArr.splice(randomIndex, 1);
    }

    return result;
};

export const toDeleteItem = <T>(list: LibTypes.Arr<T>, index: number) => {
    if (index >= 0) {
        return list.toSpliced(index, 1);
    }
    return [...list];
};

export const deleteItem = <T>(list: LibTypes.VarArr<T>, index: number) => {
    if (index >= 0) {
        list.splice(index, 1);
    }
    return list;
};

export const toDeduplicate = <T>(arr: LibTypes.Arr<T>) => [...new Set(arr)];
