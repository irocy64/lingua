import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserById, verifyCredentials } from "@/server/account";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await verifyCredentials(email, password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        const dbUser = await findUserById(user.id);
        token.status = dbUser?.status ?? "pending";
        token.role = dbUser?.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.status = token.status as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});
