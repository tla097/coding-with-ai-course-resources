import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [
    GitHub,
    Credentials({ authorize: () => null }),
  ],
  pages: {
    signIn: '/devstash/sign-in',
  },
} satisfies NextAuthConfig
