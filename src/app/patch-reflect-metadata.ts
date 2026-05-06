// @ts-nocheck
// Patch Reflect.metadata to work with both legacy and new TC39 decorator spec
// The new spec calls class decorators as (value, context) where context is an object
// The legacy spec calls them as (target, propertyKey) where propertyKey is undefined for class decorators
const originalMetadata = Reflect.metadata.bind(Reflect);
Reflect.metadata = (metadataKey: string, metadataValue: unknown) => {
    const decorator = originalMetadata(metadataKey, metadataValue);
    return (target: unknown, contextOrPropertyKey?: unknown) => {
        // New TC39 spec: context is an object with 'kind' property
        if (contextOrPropertyKey !== null && typeof contextOrPropertyKey === 'object' && 'kind' in (contextOrPropertyKey as object)) {
            // Apply metadata to the class directly
            Reflect.defineMetadata(metadataKey, metadataValue, target as Function);
            return;
        }
        // Legacy spec: call original decorator
        return decorator(target, contextOrPropertyKey as string | symbol | undefined);
    };
};
