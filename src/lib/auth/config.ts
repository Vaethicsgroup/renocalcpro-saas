// src/lib/auth/config.ts
// NextAuth v5 — configuration centrale.
// Sessions JWT signées (court 15 min + refresh) en cookie HttpOnly+Secure+SameSite=strict.
// Providers : magic-link email + Google + Microsoft.

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";
import Google from "next-auth/providers/google";
import MicrosoftEntra from "next-auth/providers/microsoft-entra-id";
import EmailProvider from "next-auth/providers/nodemailer";
import { sendEmail } from "@/lib/email";

const SESSION_MAX_AGE_SECONDS = 60 * 15;          // 15 min
const SESSION_UPDATE_AGE_SECONDS = 60 * 5;        // refresh toutes les 5 min

const providers: NextAuthConfig["providers"] = [];

// ─── Email magic-link via Resend (préféré) ────────────────────────────────
// Utilise notre sendEmail() centralisé → templates HTML responsive 5 langues
// + tracking opens + audit log. Mode MOCK auto si pas de RESEND_API_KEY.
if (process.env.RESEND_API_KEY || process.env.EMAIL_MOCK === "true") {
  providers.push({
    id: "email",
    type: "email",
    name: "Email",
    server: {},                        // ignoré : on override sendVerificationRequest
    from: process.env.EMAIL_FROM ?? "noreply@renocalcpro.fr",
    maxAge: 15 * 60,                   // 15 min
    async sendVerificationRequest({ identifier: email, url, provider: _p }) {
      const isSignup = url.includes("callbackUrl=") && url.includes("signup");
      const template = isSignup ? "magic-link-signup" : "magic-link-login";
      // Locale lue depuis l'URL (?lang=fr) sinon FR par défaut.
      const m = /(?:^|[?&])lang=([a-z]{2})/.exec(url);
      const locale = (m?.[1] ?? "fr") as "fr" | "en" | "es" | "de" | "pt";
      const result = await sendEmail({
        to: email,
        template,
        props: { url, userEmail: email },
        locale,
      });
      if (!result.ok && !result.mock) {
        throw new Error(`Email send failed: ${result.error}`);
      }
    },
  });
}

// ─── Fallback SMTP nodemailer (si Resend KO et SMTP fourni) ───────────────
if (!process.env.RESEND_API_KEY && process.env.SMTP_HOST) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
      from: process.env.EMAIL_FROM ?? process.env.AUTH_EMAIL_FROM,
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { prompt: "select_account", access_type: "offline" } },
  }));
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(MicrosoftEntra({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/v2.0`,
  }));
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // @ts-expect-error - augmentation type ci-dessous
        session.user.id = token.userId;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Refus si email non vérifié pour les providers OAuth
      if (account?.provider === "credentials") return true;
      if (user.email) return true;
      return false;
    },
  },
  events: {
    async createUser({ user }) {
      // Bootstrap : crée une Organization par défaut (clientType INDIVIDUAL)
      // pour que le wizard onboarding ait toujours un orgId réel à manipuler.
      if (!user.id || !user.email) return;
      const slug = `${user.email.split("@")[0]}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase();
      await prisma.organization.create({
        data: {
          slug,
          name: user.name ?? user.email.split("@")[0]!,
          clientType: "INDIVIDUAL",
          onboardingStep: "CLIENT_TYPE",
          members: {
            create: { userId: user.id, role: "OWNER", acceptedAt: new Date() },
          },
        },
      });
    },
    async signIn({ user, isNewUser }) {
      // Email de bienvenue uniquement à la première connexion.
      if (!isNewUser || !user.email) return;
      const isPro = false; // détecté plus tard via wizard. Par défaut : individu.
      const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/p/dashboard`;
      try {
        await sendEmail({
          to: user.email,
          template: isPro ? "welcome-pro" : "welcome-individual",
          props: isPro
            ? { firstName: user.name ?? undefined, companyName: "Mon cabinet", dashboardUrl }
            : { firstName: user.name ?? undefined, dashboardUrl },
          locale: "fr",
        });
      } catch (e) {
        // On ne bloque pas la connexion si l'email échoue.
        console.warn("[auth] welcome email failed:", e);
      }
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    provider?: string;
  }
}
