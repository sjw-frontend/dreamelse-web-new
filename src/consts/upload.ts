export const GenerateStandard = {
    imageCompressWidth: 1024,
    videoCompressArea: 1280 * 720,
    limit: {
        minPX: 360,
        maxSize: 100 * 1024 * 1024,
        /** ms */
        minDuration: 1000,
        /** ms */
        maxDuration: 100 * 1000,
    },
} as const;
