import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [],
    note: "Route temporairement neutralisée en local (build unblock)."
  });
}
