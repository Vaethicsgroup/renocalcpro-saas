// app/api/v1/schemas/system-patch.json/route.ts
// JSON Schema Draft 2020-12 du shape SystemPatch.

export const runtime = "edge";

const SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://renocalcpro.fr/api/v1/schemas/system-patch.json",
  title: "SystemPatch",
  description: "Patch JSON appliqué à un SystemEntry (override admin). Toutes les clés sont optionnelles.",
  type: "object",
  additionalProperties: false,
  properties: {
    name:               { type: "string", minLength: 2, maxLength: 120 },
    definition:         { type: "string", maxLength: 500 },
    typicalPerformance: { type: "string", maxLength: 120,
                          description: "Ex: 'SCOP 4.0 / EER 3.5'" },
    unitPrice:          { type: "number", minimum: 0, maximum: 100000,
                          description: "Prix indicatif d'installation (€)" },
    carbonFootprint:    { type: "number", minimum: 0, maximum: 100000,
                          description: "Empreinte carbone fabrication + 30 ans usage (kgCO2eq)" },
    sources:            { type: "array", items: { type: "string", maxLength: 500 }, maxItems: 10 },
  },
  examples: [
    { typicalPerformance: "SCOP 4.5 (modèle 2026)", unitPrice: 14500 },
    { name: "PAC air/eau Daikin Altherma 3 R" },
  ],
} as const;

export async function GET() {
  return new Response(JSON.stringify(SCHEMA, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/schema+json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
