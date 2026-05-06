export const isSubclassOf = (
    subClass: LibTypes.LooseClass,
    superClass: LibTypes.LooseClass,
) => {
    let currentPrototype: unknown = Object.getPrototypeOf(subClass);
    while (currentPrototype != null) {
        if (currentPrototype === superClass) {
            return true;
        }
        currentPrototype = Object.getPrototypeOf(currentPrototype);
    }
    return false;
};
