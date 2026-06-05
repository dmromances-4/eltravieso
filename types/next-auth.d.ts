import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    isTwoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
    membershipStatus?: string;
    isVip?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      image?: string | null;
      isTwoFactorEnabled?: boolean;
      twoFactorVerified?: boolean;
      membershipStatus?: string;
      isVip?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    picture?: string | null;
    isTwoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
    membershipStatus?: string;
    isVip?: boolean;
  }
}
