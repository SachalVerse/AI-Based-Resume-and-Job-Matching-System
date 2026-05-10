import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { applyNextAuthEnv, assertGoogleOAuthEnv } from "./env";
import { createGoogleOAuthHttpsAgent } from "./google-http";

import { cookies } from "next/headers";

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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.access_token) {
        try {
          const cookieStore = await cookies();
          const selectedRole = cookieStore.get("selected_role")?.value;

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          const res = await fetch(`${apiUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_token: account.id_token,
              access_token: account.access_token,
              role: selectedRole, // Send selected role to backend
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            user.role = data.role ?? null;
            user.systemToken = data.access_token;
            return true;
          } else {
            const errText = await res.text();
            console.error(`Backend Auth Sync Failed:`, res.status, errText);
            return false; // BLOCK login if backend can't sync/create user
          }
        } catch (error) {
          console.error("Backend Auth Sync Error:", error);
          return false; // BLOCK login if backend is unreachable
        }
      }
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
      if (session.user) {
        session.user.role = token.role as string | null;
        session.user.systemToken = token.systemToken as string | undefined;
        // Ensure accessToken is at the top level or user level
        (session as any).accessToken = token.accessToken;
        session.user.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
