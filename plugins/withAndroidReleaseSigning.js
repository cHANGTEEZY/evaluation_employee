const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Use android-release-key.properties at the repo root (next to package.json)
 * instead of android/key.properties, so signing config survives prebuild/clean.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      return cfg;
    }
    let contents = cfg.modResults.contents;
    if (contents.includes("android-release-key.properties")) {
      return cfg;
    }
    const from = "def keystorePropertiesFile = rootProject.file('key.properties')";
    const to =
      "def keystorePropertiesFile = rootProject.file('../android-release-key.properties')";
    if (!contents.includes(from)) {
      throw new Error(
        "withAndroidReleaseSigning: expected default key.properties line in app/build.gradle; update the plugin for your Expo/React Native version."
      );
    }
    cfg.modResults.contents = contents.replace(from, to);
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
