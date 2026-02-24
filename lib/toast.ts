import { Platform } from "react-native";
import { toast as burntToast } from "burnt";

const MAX_MESSAGE_LENGTH = 80;

type ToastOptions = {
  title: string;
  message?: string;
  preset?: string;
};

export function toast(options: ToastOptions) {
  const { title, preset } = options;
  let { message } = options;

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    message = `${message.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
  }

  burntToast({
    title,
    message,
    preset,
  } as any);
}

/** "Welcome back" toast with user name and a face icon (Burnt). */
export function welcomeBackToast(userName: string) {
  const displayName =
    userName && userName.trim() ? userName.trim() : "User";
  if (Platform.OS === "ios") {
    burntToast({
      title: "Welcome back",
      message: displayName,
      preset: "custom",
      icon: {
        ios: {
          name: "face.smiling.fill",
          color: "#FFFFFF",
        },
      },
      duration: 4,
    } as any);
  } else {
    burntToast({
      title: "Welcome back",
      message: displayName,
      preset: "done",
      duration: 4,
    });
  }
}

