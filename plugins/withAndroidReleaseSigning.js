const { withAppBuildGradle } = require("expo/config-plugins");
const INJECT_MARKER = "// @generated begin withAndroidReleaseSigning";
const LEGACY_KEY_PROPERTIES = "def keystorePropertiesFile = rootProject.file('key.properties')";
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
            cfg.modResults.contents = contents.replace(LEGACY_KEY_PROPERTIES, "def keystorePropertiesFile = rootProject.file('../android-release-key.properties')");
            return cfg;
        }
        const keystoreBlock = `
${INJECT_MARKER} — android-release-key.properties at repo root
def releaseKeystoreProps = new Properties()
def releaseKeystorePropertiesFile = rootProject.file('../android-release-key.properties')
if (releaseKeystorePropertiesFile.exists()) {
    releaseKeystoreProps.load(new FileInputStream(releaseKeystorePropertiesFile))
}
`;
        if (!contents.includes("\nandroid {\n")) {
            throw new Error("withAndroidReleaseSigning: could not find android { block in app/build.gradle.");
        }
        contents = contents.replace("\nandroid {\n", `${keystoreBlock}\nandroid {\n`);
        const signingConfigsDebugOnly = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;
        const signingConfigsWithRelease = `    signingConfigs {
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
        if (!contents.includes(signingConfigsDebugOnly)) {
            throw new Error("withAndroidReleaseSigning: unexpected signingConfigs block in app/build.gradle; update the plugin for your Expo/React Native template.");
        }
        contents = contents.replace(signingConfigsDebugOnly, signingConfigsWithRelease);
        const releaseSigningLine = `        release {
            signingConfig signingConfigs.debug`;
        const releaseSigningPatched = `        release {
            signingConfig releaseKeystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`;
        if (!contents.includes(releaseSigningLine)) {
            throw new Error("withAndroidReleaseSigning: unexpected release buildType signing line; update the plugin.");
        }
        contents = contents.replace(releaseSigningLine, releaseSigningPatched);
        cfg.modResults.contents = contents;
        return cfg;
    });
}
module.exports = withAndroidReleaseSigning;
