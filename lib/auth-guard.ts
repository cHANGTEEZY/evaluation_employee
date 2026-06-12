import { authClient } from "./auth-client";
export class AuthenticationError extends Error {
    constructor(message = "You must be logged in to perform this action") {
        super(message);
        this.name = "AuthenticationError";
    }
}
export async function isAuthenticated(): Promise<boolean> {
    try {
        const sessionValue: any = authClient.useSession.get();
        const session = sessionValue?.data;
        return !!session?.user;
    }
    catch {
        return false;
    }
}
export async function requireAuth(): Promise<void> {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        throw new AuthenticationError();
    }
}
