import type { ConfigContext, ExpoConfig } from "@expo/config";
import type { MapLibrePluginProps } from "@maplibre/maplibre-react-native";

const MAPLIBRE = "@maplibre/maplibre-react-native";

const DEFAULT_API_URL =
  "https://evaluation-backend-production-dac9.up.railway.app";

/** Resolved at build time (EAS injects env before config runs). Client reads via expo-constants `extra`. */
function resolveApiUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.API_URL?.trim() ||
    DEFAULT_API_URL
  );
}

function resolveGalliMapsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GALLI_MAPS_API_KEY?.trim() ||
    process.env.GALLI_MAPS_API_KEY?.trim() ||
    ""
  );
}

function maplibrePluginId(entry: NonNullable<ExpoConfig["plugins"]>[number]): string {
  return typeof entry === "string" ? entry : entry[0];
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const basePlugins = (config.plugins ?? []).filter((p) => maplibrePluginId(p) !== MAPLIBRE);
  const existingExtra =
    config.extra && typeof config.extra === "object" && !Array.isArray(config.extra)
      ? (config.extra as Record<string, unknown>)
      : {};
  return {
    ...config,
    name: config.name ?? "Evaluation",
    slug: config.slug ?? "Evaluation",
    extra: {
      ...existingExtra,
      apiUrl: resolveApiUrl(),
      galliMapsApiKey: resolveGalliMapsApiKey(),
    },
    plugins: [
      "./plugins/withAndroidReleaseSigning",
      ...basePlugins,
      [
        MAPLIBRE,
        {
          android: { nativeVersion: "12.3.1" },
          ios: { nativeVersion: "6.17.1" },
        } satisfies MapLibrePluginProps,
      ],
    ],
  };
};
