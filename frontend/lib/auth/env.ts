/**
 * NextAuth v4 origin resolution (see next-auth/utils/detect-origin.js):
 * - If VERCEL or AUTH_TRUST_HOST → uses Host / X-Forwarded-* (can be undefined under Turbopack → "https://undefined").
 * - Else → uses NEXTAUTH_URL only.
 *
 * Development: always prefer NEXTAUTH_URL by clearing AUTH_TRUST_HOST.
 * Production: set NEXTAUTH_URL to your public URL; use AUTH_TRUST_HOST only behind a trusted reverse proxy with correct forwarded headers.
 */
export function applyNextAuthEnv(): void {
  const prod = process.env.NODE_ENV === "production";

  if (!prod) {
    if (!process.env.NEXTAUTH_URL?.trim()) {
      process.env.NEXTAUTH_URL = "http://localhost:3000";
      console.warn(
        "[auth] NEXTAUTH_URL missing — using http://localhost:3000. Match this to the URL you open in the browser.",
      );
    }
    delete process.env.AUTH_TRUST_HOST;
  } else if (!process.env.NEXTAUTH_URL?.trim()) {
    console.error("[auth] NEXTAUTH_URL is required in production.");
  }
}

export function assertGoogleOAuthEnv(): void {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    console.error(
      "[auth] Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in frontend .env.local",
    );
  }
}
