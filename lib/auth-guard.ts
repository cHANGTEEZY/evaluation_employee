import { authClient } from "./auth-client";

export class AuthenticationError extends Error {
  constructor(message = "You must be logged in to perform this action") {
    super(message);
    this.name = "AuthenticationError";
  }
}

//check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    // Get current session from better-auth client
    const sessionValue: any = authClient.useSession.get();
    const session = sessionValue?.data;

    // Check if we have a valid user in the session
    return !!session?.user;
  } catch {
    return false;
  }
}

//Guard function that throws AuthenticationError if user is not authenticated
export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new AuthenticationError();
  }
}
