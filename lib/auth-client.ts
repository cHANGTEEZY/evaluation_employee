import { createAuthClient } from 'better-auth/client';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { BASE_API_URL } from '../constants';

// Debug: Log the base URL being used
console.log('[Auth Client] Initializing with BASE_API_URL:', BASE_API_URL);

export const authClient = createAuthClient({
  baseURL: BASE_API_URL,
  basePath: '/api/auth', // Explicitly set the auth path
  fetchOptions: {
    credentials: 'include', // Required for cross-origin cookies
    onRequest: ctx => {
      // Debug: Log outgoing requests
      console.log('[Auth Client] Request URL:', ctx.url);
      console.log('[Auth Client] Request Method:', ctx.options?.method);
      console.log('[Auth Client] Request Headers:', ctx.options?.headers);
    },
    onResponse: ctx => {
      // Debug: Log responses
      console.log('[Auth Client] Response Status:', ctx.response.status);
      console.log('[Auth Client] Response URL:', ctx.response.url);
    },
    onError: ctx => {
      // Debug: Log errors
      console.error('[Auth Client] Fetch Error:', ctx.error);
      console.error('[Auth Client] Request URL:', ctx.url);
    },
  },
  plugins: [
    expoClient({
      scheme: 'evaluationapp',
      storagePrefix: 'evaluationapp',
      storage: SecureStore,
    }),
  ],
});

export type AuthClient = typeof authClient;
