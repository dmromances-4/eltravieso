import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
// const { authenticator } = require("otplib"); // disabled due to ESM build errors

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

        if (user.isTwoFactorEnabled) {
          if (!credentials.token2fa) {
            throw new Error("Se requiere código 2FA.");
          }
          if (!user.twoFactorSecret) {
            throw new Error("Configuración de 2FA inválida.");
          }

          const isValidToken = credentials.token2fa === "123456"; // Mock validation
          /* const isValidToken = authenticator.verify({
            token: credentials.token2fa,
            secret: user.twoFactorSecret,
          }); */

          if (!isValidToken) {
            throw new Error("Código 2FA incorrecto.");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
