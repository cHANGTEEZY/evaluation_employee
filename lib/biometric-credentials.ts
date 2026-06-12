import * as SecureStore from "expo-secure-store";
const KEY_EMAIL = "evaluationapp_bio_email";
const KEY_PASSWORD = "evaluationapp_bio_password";
const KEY_ENABLED = "evaluationapp_bio_enabled";
export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_EMAIL, email);
    await SecureStore.setItemAsync(KEY_PASSWORD, password);
    await SecureStore.setItemAsync(KEY_ENABLED, "true");
}
export async function getBiometricCredentials(): Promise<{
    email: string;
    password: string;
} | null> {
    const email = await SecureStore.getItemAsync(KEY_EMAIL);
    const password = await SecureStore.getItemAsync(KEY_PASSWORD);
    if (!email || !password)
        return null;
    return { email, password };
}
export async function hasBiometricCredentials(): Promise<boolean> {
    const flag = await SecureStore.getItemAsync(KEY_ENABLED);
    return flag === "true";
}
export async function clearBiometricCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_EMAIL);
    await SecureStore.deleteItemAsync(KEY_PASSWORD);
    await SecureStore.deleteItemAsync(KEY_ENABLED);
}
