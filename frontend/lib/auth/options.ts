import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { applyNextAuthEnv, assertGoogleOAuthEnv } from "./env";
import { createGoogleOAuthHttpsAgent } from "./google-http";

applyNextAuthEnv();
assertGoogleOAuthEnv();

const prod = process.env.NODE_ENV === "production";

function authSecret(): string | undefined {
  const s = process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (!prod) {
    console.warn(
      "[auth] NEXTAUTH_SECRET unset — using insecure dev default. Set it in .env.local for production.",
    );
    return "dev-insecure-nextauth-secret";
  }
  console.error("[auth] NEXTAUTH_SECRET is required in production.");
  return undefined;
}

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

const oauthAgent = createGoogleOAuthHttpsAgent();

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      idToken: true,
      authorization: {
        params: {
          scope: googleScopes,
          access_type: "offline",
          prompt: "consent",
        },
      },
      httpOptions: {
        timeout: Number(process.env.OAUTH_HTTP_TIMEOUT_MS) || 30_000,
        ...(oauthAgent ? { agent: oauthAgent } : {}),
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.id_token || account?.access_token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_token: account.id_token,
              access_token: account.access_token,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            user.role = data.role ?? null;
            user.systemToken = data.access_token;
          } else {
            // Do not block OAuth login when backend sync is temporarily failing.
            // User can still reach onboarding and retry role/session sync.
            const errText = await res.text();
            console.error("Backend Auth Sync Failed:", res.status, errText);
            user.role = null;
          }
          return true;
        } catch (error) {
          console.error("Backend Auth Sync Error:", error);
          // Preserve login availability even if backend is down/transient.
          user.role = null;
          return true;
        }
      }
      // No token payload from provider should not hard-fail sign-in.
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      if (user) {
        token.role = user.role;
        token.systemToken = user.systemToken;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string | null;
      session.systemToken = token.systemToken as string | undefined;
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
};
