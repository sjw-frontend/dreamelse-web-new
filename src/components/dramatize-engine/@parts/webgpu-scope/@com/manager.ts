// @ts-nocheck
import * as Device from 'expo-device';
import * as THREE from 'three/webgpu';

import { createTexture } from './ecs/render';

export enum TextureRetainPolicy {
    OnDemand = 'on-demand',
    Persist = 'persist',
}

const MB = 1024 * 1024;

/** Total device memory in bytes. Falls back to 1024 MB if unavailable. */
const TotalMemory: number = Device.totalMemory ?? 5120 * MB;
const ALLOW_DEVICE_MEMORY_BYTES = Math.min(TotalMemory, 10240 * MB);

type TextureEntry = LibTypes.VarDefine<{
    texture: THREE.Texture,
    policy: TextureRetainPolicy,
    refCount: number,
    memoryBytes: number,
    createdAt: number,
    resolution: string,
}>;

type TextureGroupEntry = LibTypes.VarDefine<{
    textures: LibTypes.VarArr<THREE.Texture>,
    policy: TextureRetainPolicy,
    refCount: number,
    memoryBytes: number,
    createdAt: number,
    resolution: string,
}>;

export class TextureManager {
    static readonly #ON_DEMAND_MEMORY_LIMIT_BYTES = ALLOW_DEVICE_MEMORY_BYTES * 0.07;
    static readonly #PERSIST_MEMORY_LIMIT_BYTES = ALLOW_DEVICE_MEMORY_BYTES * 0.03;
    static readonly #SINGLE_TEXTURE_MAX_BYTES = 40 * MB;
    static readonly #FRAME_TEXTURE_MAX_BYTES = 10 * MB;
    static #sharedEmptyTexture: THREE.Texture | null = null;

    public static DEBUG = false;

    public static get emptyTexture(): THREE.Texture {
        TextureManager.#sharedEmptyTexture ??= new THREE.Texture();
        return TextureManager.#sharedEmptyTexture;
    }

    public constructor() {
        this.#log(
            `initialized, allow device memory: ${(ALLOW_DEVICE_MEMORY_BYTES / MB).toFixed(0)}MB,`,
            `onDemand limit: ${(TextureManager.#ON_DEMAND_MEMORY_LIMIT_BYTES / MB).toFixed(2)}MB,`,
            `persist limit: ${(TextureManager.#PERSIST_MEMORY_LIMIT_BYTES / MB).toFixed(2)}MB`,
        );
    }

    readonly #textures = new Map<string, TextureEntry>();
    readonly #textureGroups = new Map<string, TextureGroupEntry>();
    readonly #pendingLoads = new Map<string, Promise<THREE.Texture>>();
    readonly #pendingGroupLoads = new Map<
        string,
        Promise<LibTypes.VarArr<THREE.Texture>>
    >();

    #onDemandMemoryBytes = 0;
    #persistMemoryBytes = 0;

    /** Current OnDemand texture memory usage in MB. */
    public get onDemandMemoryUsageMB(): number {
        return this.#onDemandMemoryBytes / MB;
    }

    /** Current Persist texture memory usage in MB. */
    public get persistMemoryUsageMB(): number {
        return this.#persistMemoryBytes / MB;
    }

    /** Current total texture memory usage in MB. */
    public get memoryUsageMB(): number {
        return (this.#onDemandMemoryBytes + this.#persistMemoryBytes) / MB;
    }

    #log(...args: LibTypes.VarArr): void {
        if (TextureManager.DEBUG) {
            console.log('[TextureManager]', ...args);
        }
    }

    #memoryLog(policy: TextureRetainPolicy): string {
        if (policy === TextureRetainPolicy.OnDemand) {
            return `onDemand: ${this.onDemandMemoryUsageMB.toFixed(2)}MB`;
        }
        return `persist: ${this.persistMemoryUsageMB.toFixed(2)}MB`;
    }

    async #fetchTexture(url: string): Promise<
        LibTypes.VarDefine<{
            texture: THREE.Texture,
            memoryBytes: number,
            resolution: string,
        }>
    > {
        const response = await fetch(url);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        const texture = createTexture(imageBitmap);
        // width * height * 4 bytes (RGBA)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const source = texture.image as LibTypes.VarDefine<{
            width: number,
            height: number,
        }>;
        const memoryBytes = source.width * source.height * 4;
        const resolution = `${source.width}x${source.height}`;
        return { texture, memoryBytes, resolution };
    }

    #addMemory(policy: TextureRetainPolicy, bytes: number): void {
        if (policy === TextureRetainPolicy.OnDemand) {
            this.#onDemandMemoryBytes += bytes;
        } else {
            this.#persistMemoryBytes += bytes;
        }
    }

    #subtractMemory(policy: TextureRetainPolicy, bytes: number): void {
        if (policy === TextureRetainPolicy.OnDemand) {
            this.#onDemandMemoryBytes -= bytes;
        } else {
            this.#persistMemoryBytes -= bytes;
        }
    }

    /**
     * For Persist policy: try to evict unreferenced entries (oldest first)
     * to free at least `requiredBytes` of Persist memory.
     * Returns true if enough space is available after eviction.
     */
    #tryEvictPersist(requiredBytes: number): boolean {
        if (
            this.#persistMemoryBytes + requiredBytes <=
            TextureManager.#PERSIST_MEMORY_LIMIT_BYTES
        ) {
            return true;
        }

        // Collect all Persist entries with refCount <= 0, sorted by createdAt (oldest first)
        const evictCandidates: LibTypes.VarArr<
            LibTypes.VarDefine<{
                key: string,
                memoryBytes: number,
                isGroup: boolean,
                createdAt: number,
            }>
        > = [];

        for (const [key, entry] of this.#textures.entries()) {
            if (
                entry.policy === TextureRetainPolicy.Persist &&
                entry.refCount <= 0
            ) {
                evictCandidates.push({
                    key,
                    memoryBytes: entry.memoryBytes,
                    isGroup: false,
                    createdAt: entry.createdAt,
                });
            }
        }

        for (const [key, entry] of this.#textureGroups.entries()) {
            if (
                entry.policy === TextureRetainPolicy.Persist &&
                entry.refCount <= 0
            ) {
                evictCandidates.push({
                    key,
                    memoryBytes: entry.memoryBytes,
                    isGroup: true,
                    createdAt: entry.createdAt,
                });
            }
        }

        // Sort by creation time, oldest first
        evictCandidates.sort((a, b) => a.createdAt - b.createdAt);

        for (const candidate of evictCandidates) {
            if (
                this.#persistMemoryBytes + requiredBytes <=
                TextureManager.#PERSIST_MEMORY_LIMIT_BYTES
            ) {
                return true;
            }

            if (candidate.isGroup) {
                const group = this.#textureGroups.get(candidate.key);
                if (group) {
                    this.#disposeTextureGroup(
                        candidate.key,
                        group,
                        'evicted persist',
                    );
                }
            } else {
                const entry = this.#textures.get(candidate.key);
                if (entry) {
                    this.#disposeTexture(
                        candidate.key,
                        entry,
                        'evicted persist',
                    );
                }
            }
        }

        return (
            this.#persistMemoryBytes + requiredBytes <=
            TextureManager.#PERSIST_MEMORY_LIMIT_BYTES
        );
    }

    #createEmptyTexture(): THREE.Texture {
        return new THREE.Texture();
    }

    #disposeTexture(
        resourceId: string,
        entry: TextureEntry,
        action: string,
    ): void {
        entry.texture.dispose();
        this.#subtractMemory(entry.policy, entry.memoryBytes);
        this.#textures.delete(resourceId);
        this.#log(
            `${action} texture [${resourceId}] (${entry.resolution})`,
            `-${(entry.memoryBytes / MB).toFixed(2)}MB`,
            this.#memoryLog(entry.policy),
        );
    }

    #disposeTextureGroup(
        resourceId: string,
        entry: TextureGroupEntry,
        action: string,
    ): void {
        for (const texture of entry.textures) {
            texture.dispose();
        }
        this.#subtractMemory(entry.policy, entry.memoryBytes);
        this.#textureGroups.delete(resourceId);
        this.#log(
            `${action} texture group [${resourceId}] (${entry.resolution})`,
            `-${(entry.memoryBytes / MB).toFixed(2)}MB`,
            this.#memoryLog(entry.policy),
        );
    }

    /**
     * Load a single texture by resourceId.
     * If the texture is already loaded, increments the reference count and returns it.
     * If a load is in progress for the same resourceId, waits for it and increments the ref count.
     *
     * Returns an empty texture if:
     * - The texture exceeds 40 MB.
     * - OnDemand policy and total OnDemand memory would exceed 768 MB.
     * - Persist policy and total Persist memory would exceed 256 MB after eviction.
     */
    public async loadTexture(
        resourceId: string,
        url: string,
        policy: TextureRetainPolicy = TextureRetainPolicy.OnDemand,
    ): Promise<THREE.Texture> {
        const existing = this.#textures.get(resourceId);
        if (existing) {
            existing.refCount++;
            return existing.texture;
        }

        // Deduplicate concurrent loads for the same resourceId
        const pending = this.#pendingLoads.get(resourceId);
        if (pending) {
            const texture = await pending;
            const entry = this.#textures.get(resourceId);
            if (entry) entry.refCount++;
            return texture;
        }

        const loadPromise = this.#fetchTexture(url);
        this.#pendingLoads.set(
            resourceId,
            loadPromise.then(r => r.texture),
        );

        try {
            const { texture, memoryBytes, resolution } = await loadPromise;

            // Per-texture size guard: 40 MB max for single textures
            if (memoryBytes > TextureManager.#SINGLE_TEXTURE_MAX_BYTES) {
                texture.dispose();
                this.#log(
                    `texture [${resourceId}] (${resolution}) exceeds 40MB limit (${(memoryBytes / MB).toFixed(2)}MB), returning empty`,
                );
                return this.#createEmptyTexture();
            }

            // Policy-level memory guard
            if (policy === TextureRetainPolicy.OnDemand) {
                if (
                    this.#onDemandMemoryBytes + memoryBytes >
                    TextureManager.#ON_DEMAND_MEMORY_LIMIT_BYTES
                ) {
                    texture.dispose();
                    this.#log(
                        `onDemand memory limit exceeded for [${resourceId}] (${(memoryBytes / MB).toFixed(2)}MB), returning empty`,
                        this.#memoryLog(policy),
                    );
                    return this.#createEmptyTexture();
                }
            } else if (!this.#tryEvictPersist(memoryBytes)) {
                texture.dispose();
                this.#log(
                    `persist memory limit exceeded for [${resourceId}] (${(memoryBytes / MB).toFixed(2)}MB), returning empty`,
                    this.#memoryLog(policy),
                );
                return this.#createEmptyTexture();
            }

            this.#addMemory(policy, memoryBytes);
            this.#textures.set(resourceId, {
                texture,
                policy,
                refCount: 1,
                memoryBytes,
                createdAt: performance.now(),
                resolution,
            });
            this.#log(
                `loaded texture [${resourceId}] (${resolution})`,
                `+${(memoryBytes / MB).toFixed(2)}MB`,
                this.#memoryLog(policy),
            );
            return texture;
        } finally {
            this.#pendingLoads.delete(resourceId);
        }
    }

    /**
     * Load a group of textures (e.g. frame sequences) by resourceId.
     * If the group is already loaded, increments the reference count and returns it.
     * If a load is in progress for the same resourceId, waits for it and increments the ref count.
     *
     * Returns empty textures if:
     * - Any single frame exceeds 10 MB.
     * - OnDemand policy and total OnDemand memory would exceed 768 MB.
     * - Persist policy and total Persist memory would exceed 256 MB after eviction.
     */
    public async loadTextureGroup(
        resourceId: string,
        urls: LibTypes.VarArr<string>,
        policy: TextureRetainPolicy = TextureRetainPolicy.OnDemand,
    ): Promise<LibTypes.VarArr<THREE.Texture>> {
        const existing = this.#textureGroups.get(resourceId);
        if (existing) {
            existing.refCount++;
            return existing.textures;
        }

        // Deduplicate concurrent loads for the same resourceId
        const pending = this.#pendingGroupLoads.get(resourceId);
        if (pending) {
            const textures = await pending;
            const entry = this.#textureGroups.get(resourceId);
            if (entry) entry.refCount++;
            return textures;
        }

        const loadPromise = Promise.all(
            urls.map(async url => this.#fetchTexture(url)),
        );
        this.#pendingGroupLoads.set(
            resourceId,
            loadPromise.then(results => results.map(r => r.texture)),
        );

        try {
            const results = await loadPromise;

            // Per-frame size guard: 10 MB max per frame
            const oversized = results.some(
                r => r.memoryBytes > TextureManager.#FRAME_TEXTURE_MAX_BYTES,
            );
            if (oversized) {
                for (const r of results) r.texture.dispose();
                this.#log(
                    `texture group [${resourceId}] has frame exceeding 10MB limit, returning empty`,
                );
                return results.map(() => this.#createEmptyTexture());
            }

            const textures = results.map(r => r.texture);
            const memoryBytes = results.reduce(
                (sum, r) => sum + r.memoryBytes,
                0,
            );
            const resolution = results
                .map(r => r.resolution)
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(',');

            // Policy-level memory guard
            if (policy === TextureRetainPolicy.OnDemand) {
                if (
                    this.#onDemandMemoryBytes + memoryBytes >
                    TextureManager.#ON_DEMAND_MEMORY_LIMIT_BYTES
                ) {
                    for (const t of textures) t.dispose();
                    this.#log(
                        `onDemand memory limit exceeded for group [${resourceId}] (${(memoryBytes / MB).toFixed(2)}MB), returning empty`,
                        this.#memoryLog(policy),
                    );
                    return results.map(() => this.#createEmptyTexture());
                }
            } else if (!this.#tryEvictPersist(memoryBytes)) {
                for (const t of textures) t.dispose();
                this.#log(
                    `persist memory limit exceeded for group [${resourceId}] (${(memoryBytes / MB).toFixed(2)}MB), returning empty`,
                    this.#memoryLog(policy),
                );
                return results.map(() => this.#createEmptyTexture());
            }

            this.#addMemory(policy, memoryBytes);
            this.#textureGroups.set(resourceId, {
                textures,
                policy,
                refCount: 1,
                memoryBytes,
                createdAt: performance.now(),
                resolution,
            });
            this.#log(
                `loaded texture group [${resourceId}] (${textures.length} frames, ${resolution})`,
                `+${(memoryBytes / MB).toFixed(2)}MB`,
                this.#memoryLog(policy),
            );
            return textures;
        } finally {
            this.#pendingGroupLoads.delete(resourceId);
        }
    }

    /** Get an already-loaded single texture by resourceId. */
    public getTexture(resourceId: string): THREE.Texture | undefined {
        return this.#textures.get(resourceId)?.texture;
    }

    /** Get an already-loaded texture group by resourceId. */
    public getTextureGroup(
        resourceId: string,
    ): LibTypes.VarArr<THREE.Texture> | undefined {
        return this.#textureGroups.get(resourceId)?.textures;
    }

    /**
     * Manually increment the reference count for a resourceId.
     * Use when an additional consumer starts using an already-loaded texture
     * without going through loadTexture / loadTextureGroup.
     */
    public retain(resourceId: string): void {
        const single = this.#textures.get(resourceId);
        if (single) {
            single.refCount++;
            return;
        }
        const group = this.#textureGroups.get(resourceId);
        if (group) {
            group.refCount++;
        }
    }

    /**
     * Decrement the reference count for a resourceId.
     * For OnDemand textures, disposes and removes the entry when refCount reaches 0.
     * For Persist textures, the entry is kept (eviction happens lazily when space is needed).
     */
    public release(resourceId: string): void {
        const single = this.#textures.get(resourceId);
        if (single) {
            single.refCount--;
            if (
                single.refCount <= 0 &&
                single.policy === TextureRetainPolicy.OnDemand
            ) {
                this.#disposeTexture(resourceId, single, 'released');
            }
            return;
        }

        const group = this.#textureGroups.get(resourceId);
        if (group) {
            group.refCount--;
            if (
                group.refCount <= 0 &&
                group.policy === TextureRetainPolicy.OnDemand
            ) {
                this.#disposeTextureGroup(resourceId, group, 'released');
            }
        }
    }

    /**
     * Evict a Persist resource from the cache, disposing it immediately when refCount <= 0.
     * Only applies to Persist policy entries — OnDemand entries are already disposed
     * by the normal `release()` path when refCount reaches 0.
     */
    public evict(resourceId: string): void {
        const single = this.#textures.get(resourceId);
        if (single) {
            if (
                single.policy === TextureRetainPolicy.Persist &&
                single.refCount <= 0
            ) {
                this.#disposeTexture(resourceId, single, 'evicted');
            }
            return;
        }

        const group = this.#textureGroups.get(resourceId);
        if (group) {
            if (
                group.policy === TextureRetainPolicy.Persist &&
                group.refCount <= 0
            ) {
                this.#disposeTextureGroup(resourceId, group, 'evicted');
            }
        }
    }

    /** Check whether a resourceId has been loaded (single or group). */
    public has(resourceId: string): boolean {
        return (
            this.#textures.has(resourceId) ||
            this.#textureGroups.has(resourceId)
        );
    }

    /** Dispose all managed textures and clear internal state. */
    public dispose(): void {
        this.#log(
            `disposing all textures, total: ${this.memoryUsageMB.toFixed(2)}MB`,
        );

        for (const entry of this.#textures.values()) {
            entry.texture.dispose();
        }
        this.#textures.clear();
        this.#pendingLoads.clear();

        for (const entry of this.#textureGroups.values()) {
            for (const texture of entry.textures) {
                texture.dispose();
            }
        }
        this.#textureGroups.clear();
        this.#pendingGroupLoads.clear();

        this.#onDemandMemoryBytes = 0;
        this.#persistMemoryBytes = 0;
    }
}
