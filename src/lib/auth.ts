import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8時間
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "teacher",
      name: "講師ログイン",
      credentials: {
        name: { label: "氏名", type: "text" },
        birthDate: { label: "生年月日", type: "text" },
      },
      async authorize(credentials) {
        const name = credentials?.name as string | undefined;
        const birthDate = credentials?.birthDate as string | undefined;

        if (!name || !birthDate) return null;

        const user = await prisma.user.findFirst({
          where: {
            name,
            role: "TEACHER",
            isActive: true,
          },
        });

        if (!user || !user.birthDate) return null;

        const storedDate = user.birthDate.toISOString().split("T")[0];
        const inputDate = new Date(birthDate).toISOString().split("T")[0];

        if (storedDate !== inputDate) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
    Credentials({
      id: "admin",
      name: "室長ログイン",
      credentials: {
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password as string | undefined;

        if (!password) return null;

        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminHash) return null;

        const isValid = await bcrypt.compare(password, adminHash);
        if (!isValid) return null;

        const admin = await prisma.user.findFirst({
          where: { role: "ADMIN", isActive: true },
          orderBy: { createdAt: "asc" },
        });

        if (!admin) return null;

        return { id: admin.id, name: admin.name, role: admin.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; name: string; role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      role: Role;
    };
  }
}

