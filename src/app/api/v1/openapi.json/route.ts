// app/api/v1/openapi.json/route.ts — Sert la spec OpenAPI 3.1.
import { OPENAPI_SPEC } from "../openapi";

export const runtime = "edge";

export async function GET() {
  return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
