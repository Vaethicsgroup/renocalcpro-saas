// app/api/test/seed-session/route.ts — endpoint E2E seed sessions
//
// NE FONCTIONNE QU'EN DEV/CI : exige header `x-e2e-token` correspondant à
// l'env `E2E_TEST_TOKEN`. Crée user + organization + session NextAuth + retourne
// les cookies à attacher au context Playwright.
//
// PROTECTION : aussi gated par NODE_ENV !== "production" pour éviter tout
// risque en prod (l'endpoint répond 404 en production même avec le bon token).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import crypto from "node:crypto";

interface Body {
  email: string;
  orgSlug?: string;
  role?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const token = req.headers.get("x-e2e-token");
  if (!token || token !== process.env.E2E_TEST_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json() as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.email) return NextResponse.json({ error: "missing_email" }, { status: 400 });

  // Trouver ou créer organisation
  let org = body.orgSlug
    ? await prisma.organization.findUnique({ where: { slug: body.orgSlug } }).catch(() => null)
    : null;
  if (!org && body.orgSlug) {
    org = await prisma.organization.create({
      data: { slug: body.orgSlug, name: `E2E ${body.orgSlug}`, clientType: "PRO_BUREAU_ETUDES" },
    });
  }

  // Trouver ou créer user
  let user = await prisma.user.findUnique({ where: { email: body.email } }).catch(() => null);
  if (!user) {
    user = await prisma.user.create({
      data: { email: body.email, emailVerified: new Date(), name: body.email.split("@")[0] },
    });
  }

  // Membership si org
  if (org && user) {
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      create: { userId: user.id, organizationId: org.id, role: body.role ?? "MEMBER" },
      update: { role: body.role ?? "MEMBER" },
    }).catch(() => undefined);
  }

  // Créer session NextAuth (JWT-less, table Session)
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 3600 * 1000);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  // Cookies NextAuth (next-auth.session-token cookie)
  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    organization: org ? { id: org.id, slug: org.slug } : null,
    cookies: [
      {
        name: cookieName,
        value: sessionToken,
        domain: "localhost",
        path: "/",
      },
    ],
  });
}
