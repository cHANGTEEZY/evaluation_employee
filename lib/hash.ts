import * as Crypto from "expo-crypto";

// Compute SHA-256 hash of a string (e.g. base64 image content) and return hex.
// Used to compare current images with last-synced hashes and skip upload when unchanged.
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

export function parseSyncedImageHashes(
  json: string | null,
): SyncedImageHashes | null {
  if (!json || typeof json !== "string") return null;
  try {
    const o = JSON.parse(json) as unknown;
    if (
      o &&
      typeof o === "object" &&
      Array.isArray((o as SyncedImageHashes).propertyImages) &&
      Array.isArray((o as SyncedImageHashes).documentPhotos)
    ) {
      return o as SyncedImageHashes;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Compare current hashes with stored; returns true only if all three segments match. */
export function imageHashesMatch(
  stored: SyncedImageHashes | null,
  current: SyncedImageHashes,
): boolean {
  if (!stored) return false;
  if (
    stored.propertyImages.length !== current.propertyImages.length ||
    stored.documentPhotos.length !== current.documentPhotos.length
  )
    return false;
  for (let i = 0; i < current.propertyImages.length; i++) {
    if (stored.propertyImages[i] !== current.propertyImages[i]) return false;
  }
  for (let i = 0; i < current.documentPhotos.length; i++) {
    if (stored.documentPhotos[i] !== current.documentPhotos[i]) return false;
  }
  if (stored.sitePlan !== current.sitePlan) return false;
  return true;
}
