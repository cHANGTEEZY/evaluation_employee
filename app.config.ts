import type { ConfigContext, ExpoConfig } from "@expo/config";
import type { MapLibrePluginProps } from "@maplibre/maplibre-react-native";

const MAPLIBRE = "@maplibre/maplibre-react-native";

function maplibrePluginId(entry: NonNullable<ExpoConfig["plugins"]>[number]): string {
  return typeof entry === "string" ? entry : entry[0];
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const basePlugins = (config.plugins ?? []).filter((p) => maplibrePluginId(p) !== MAPLIBRE);
  return {
    ...config,
    name: config.name ?? "Evaluation",
    slug: config.slug ?? "Evaluation",
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
