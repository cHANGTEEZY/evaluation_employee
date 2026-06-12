import * as Crypto from "expo-crypto";
export async function sha256Hex(input: string): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
        encoding: Crypto.CryptoEncoding.HEX,
    });
}
export type SyncedImageHashes = {
    propertyImages: string[];
    sitePlan: string | null;
    documentPhotos: string[];
};
export function parseSyncedImageHashes(json: string | null): SyncedImageHashes | null {
    if (!json || typeof json !== "string")
        return null;
    try {
        const o = JSON.parse(json) as unknown;
        if (o &&
            typeof o === "object" &&
            Array.isArray((o as SyncedImageHashes).propertyImages) &&
            Array.isArray((o as SyncedImageHashes).documentPhotos)) {
            return o as SyncedImageHashes;
        }
    }
    catch {
    }
    return null;
}
export function imageHashesMatch(stored: SyncedImageHashes | null, current: SyncedImageHashes): boolean {
    if (!stored)
        return false;
    if (stored.propertyImages.length !== current.propertyImages.length ||
        stored.documentPhotos.length !== current.documentPhotos.length)
        return false;
    for (let i = 0; i < current.propertyImages.length; i++) {
        if (stored.propertyImages[i] !== current.propertyImages[i])
            return false;
    }
    for (let i = 0; i < current.documentPhotos.length; i++) {
        if (stored.documentPhotos[i] !== current.documentPhotos[i])
            return false;
    }
    if (stored.sitePlan !== current.sitePlan)
        return false;
    return true;
}
