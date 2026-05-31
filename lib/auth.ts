import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Contraseña", type: "password" },
        token2fa: { label: "Código 2FA (opcional)", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error("Email o contraseña incorrectos.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Email o contraseña incorrectos.");
        }

        let twoFactorVerified = false;

        if (user.isTwoFactorEnabled) {
          if (!credentials.token2fa) {
            throw new Error("Se requiere código 2FA.");
          }
          if (!user.twoFactorSecret) {
            throw new Error("Configuración de 2FA inválida.");
          }

          const isValidToken = await verifyTwoFactorToken(user.twoFactorSecret, credentials.token2fa);
          if (!isValidToken) {
            throw new Error("Código 2FA incorrecto.");
          }
          twoFactorVerified = true;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.imageUrl ?? undefined,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          twoFactorVerified,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.name = (user as any).name ?? token.name;
        token.email = (user as any).email ?? token.email;
        token.picture = (user as any).image ?? token.picture;
        token.isTwoFactorEnabled = Boolean((user as any).isTwoFactorEnabled);
        token.twoFactorVerified = Boolean((user as any).twoFactorVerified);
      }

      if (trigger === "update" && updateSession?.user) {
        if (updateSession.user.name) token.name = updateSession.user.name;
        if (updateSession.user.email) token.email = updateSession.user.email;
        if (updateSession.user.image !== undefined) token.picture = updateSession.user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "USER";
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.image = (token.picture as string) ?? session.user.image ?? null;
        session.user.isTwoFactorEnabled = Boolean(token.isTwoFactorEnabled);
        session.user.twoFactorVerified = Boolean(token.twoFactorVerified);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
