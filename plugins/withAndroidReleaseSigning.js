const { withAppBuildGradle } = require("expo/config-plugins");

const INJECT_MARKER = "// @generated begin withAndroidReleaseSigning";
const LEGACY_KEY_PROPERTIES =
  "def keystorePropertiesFile = rootProject.file('key.properties')";

const KEYSTORE_BLOCK = `
${INJECT_MARKER} — android-release-key.properties at repo root
def releaseKeystoreProps = new Properties()
def releaseKeystorePropertiesFile = rootProject.file('../android-release-key.properties')
if (releaseKeystorePropertiesFile.exists()) {
    releaseKeystoreProps.load(new FileInputStream(releaseKeystorePropertiesFile))
}
// @generated end withAndroidReleaseSigning
`;

const SIGNING_CONFIGS_DEBUG_ONLY = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const SIGNING_CONFIGS_WITH_RELEASE = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (releaseKeystorePropertiesFile.exists()) {
                storeFile file(releaseKeystoreProps['storeFile'])
                storePassword releaseKeystoreProps['storePassword']
                keyAlias releaseKeystoreProps['keyAlias']
                keyPassword releaseKeystoreProps['keyPassword']
            }
        }
    }`;

const RELEASE_SIGNING_PATCHED = `        release {
            signingConfig releaseKeystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`;

const RELEASE_SIGNING_VARIANTS = [
  `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`,
  `        release {
            signingConfig signingConfigs.debug`,
];

function patchReleaseSigning(contents) {
  if (contents.includes(RELEASE_SIGNING_PATCHED)) {
    return contents;
  }

  for (const variant of RELEASE_SIGNING_VARIANTS) {
    if (contents.includes(variant)) {
      return contents.replace(variant, RELEASE_SIGNING_PATCHED);
    }
  }

  throw new Error(
    "withAndroidReleaseSigning: unexpected release buildType signing line; update the plugin.",
  );
}

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      return cfg;
    }

    let contents = cfg.modResults.contents;

    if (contents.includes(INJECT_MARKER)) {
      return cfg;
    }

    if (contents.includes(LEGACY_KEY_PROPERTIES)) {
      cfg.modResults.contents = contents.replace(
        LEGACY_KEY_PROPERTIES,
        "def keystorePropertiesFile = rootProject.file('../android-release-key.properties')",
      );
      return cfg;
    }

    if (!contents.includes("\nandroid {\n")) {
      throw new Error(
        "withAndroidReleaseSigning: could not find android { block in app/build.gradle.",
      );
    }
    contents = contents.replace("\nandroid {\n", `${KEYSTORE_BLOCK}\nandroid {\n`);

    if (!contents.includes(SIGNING_CONFIGS_DEBUG_ONLY)) {
      throw new Error(
        "withAndroidReleaseSigning: unexpected signingConfigs block in app/build.gradle; update the plugin for your Expo/React Native template.",
      );
    }
    contents = contents.replace(
      SIGNING_CONFIGS_DEBUG_ONLY,
      SIGNING_CONFIGS_WITH_RELEASE,
    );

    contents = patchReleaseSigning(contents);

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
