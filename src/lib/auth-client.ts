import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL, // Optional: Better Auth auto-detects this in Next.js
});
