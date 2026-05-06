// @ts-nocheck
// Wrapper for reflect-metadata that patches Reflect.metadata to work with
// both legacy and new TC39 decorator spec
import 'reflect-metadata';

const originalMetadata = Reflect.metadata.bind(Reflect);

// @ts-ignore
Reflect.metadata = (metadataKey: string, metadataValue: unknown) => {
    const legacyDecorator = originalMetadata(metadataKey, metadataValue);
    return (target: unknown, contextOrPropertyKey?: unknown) => {
        // New TC39 spec: context is an object with 'kind' property
        if (
            contextOrPropertyKey !== null &&
            typeof contextOrPropertyKey === 'object' &&
            'kind' in (contextOrPropertyKey as object)
        ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any
            Reflect.defineMetadata(metadataKey, metadataValue, target as Function);
            return;
        }
        // Legacy spec
        return legacyDecorator(target, contextOrPropertyKey as string | symbol | undefined);
    };
};
