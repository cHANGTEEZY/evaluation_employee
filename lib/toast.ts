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

