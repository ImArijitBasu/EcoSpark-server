import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../lib/prisma";
import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${env.PORT || 5000}`,
  trustedOrigins: [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "https://eco-spark-hub-sigma.vercel.app"],
  secret: env.BETTER_AUTH_SECRET,
  advanced: {
    // Cookies are proxied through the Next.js rewrite so the browser sees
    // them as first-party. We still need correct sameSite/secure flags.
    cookiePrefix: "ecospark",
    defaultCookieAttributes: {
      // "lax" is safe for the rewrite-proxy pattern and allows the cookie to
      // be sent on same-site navigations (including OAuth redirects).
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      httpOnly: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "MEMBER",
        input: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      }
    }
  }
});
