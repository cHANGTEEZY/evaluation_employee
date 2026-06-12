import { toast } from "burnt";
import * as LocalAuthentication from "expo-local-authentication";
export async function isBiometricsAvailable(): Promise<boolean> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware)
            return false;
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return isEnrolled;
    }
    catch (error) {
        console.error("Biometrics availability check error:", error);
        return false;
    }
}
export async function authenticateWithBiometrics(): Promise<boolean> {
    try {
        const available = await isBiometricsAvailable();
        if (!available) {
            toast({
                title: "Biometrics not available",
                preset: "error",
            });
            return false;
        }
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Log in to EvaluationApp",
            cancelLabel: "Cancel",
            fallbackLabel: "Use passcode",
            disableDeviceFallback: false,
        });
        if (!result.success) {
            const silentErrors = [
                "user_cancel",
                "system_cancel",
                "app_cancel",
                "user_fallback",
            ];
            if (result.error && !silentErrors.includes(result.error)) {
                toast({
                    title: "Biometric authentication failed",
                    preset: "error",
                });
            }
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("Biometrics error:", error);
        toast({
            title: "Biometrics error",
            preset: "error",
        });
        return false;
    }
}
