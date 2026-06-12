export async function redirectSystemPath(intent: {
    path: string;
    initial: boolean;
}): Promise<string> {
    return intent.path;
}
