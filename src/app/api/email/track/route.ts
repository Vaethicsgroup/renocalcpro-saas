// app/api/email/track/route.ts — Pixel 1×1 transparent pour tracking opens.
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/security/auditLog";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (t) {
    await logAudit({
      action: "EMAIL_OPENED",
      payloadJson: {
        trackingId: t,
        ua: req.headers.get("user-agent"),
        ip: req.headers.get("x-real-ip") ?? null,
      },
    });
  }
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Length": String(PIXEL.length),
    },
  });
}
