import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    match: null,
    confidence: 0,
    candidates: [],
    note: "Route temporairement neutralisée en local (build unblock)."
  });
}
