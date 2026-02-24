import type { ConfigContext, ExpoConfig } from "@expo/config";
import type { MapLibrePluginProps } from "@maplibre/maplibre-react-native";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Evaluation",
  slug: config.slug ?? "Evaluation",
  plugins: [
    [
      "@maplibre/maplibre-react-native",
      {
        android: { nativeVersion: "12.3.1" },
        ios: { nativeVersion: "6.17.1" },
      } satisfies MapLibrePluginProps,
    ],
  ],
});
