import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string | null;
      systemToken?: string;
      accessToken?: string;
    } & DefaultSession["user"];
    systemToken?: string;
    accessToken?: string;
  }

  interface User {
    role?: string | null;
    systemToken?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null;
    systemToken?: string;
    accessToken?: string;
  }
}
