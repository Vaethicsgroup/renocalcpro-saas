// app/api/v1/schemas/material-patch.json/route.ts
// JSON Schema Draft 2020-12 du shape MaterialPatch (clés autorisées dans
// CatalogOverride.patch quand kind = MATERIAL). Reflète exactement le schéma
// Zod côté server actions.

export const runtime = "edge";

const SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://renocalcpro.fr/api/v1/schemas/material-patch.json",
  title: "MaterialPatch",
  description: "Patch JSON appliqué à un MaterialEntry (override admin). Toutes les clés sont optionnelles.",
  type: "object",
  additionalProperties: false,
  properties: {
    name:        { type: "string", minLength: 2, maxLength: 120 },
    description: { type: "string", maxLength: 500 },
    thermal: {
      type: "object",
      additionalProperties: false,
      properties: {
        lambda:   { type: "number", minimum: 0.005, maximum: 5,
                    description: "Conductivité thermique W/m·K" },
        RDefault: { type: "number", minimum: 0,     maximum: 20,
                    description: "Résistance thermique par défaut m²·K/W" },
        mass:     { type: "integer", enum: [1, 2, 3, 4, 5],
                    description: "Inertie thermique 1=très légère, 5=très lourde" },
      },
    },
    unitPrice:       { type: "number", minimum: 0, maximum: 10000,
                       description: "Prix indicatif (€/m² ou €/u)" },
    sources:         { type: "array",  items: { type: "string", maxLength: 500 }, maxItems: 10,
                       description: "Sources documentaires (DTU, FDES, PEP, URL)" },
    carbonFootprint: { type: "number", minimum: 0, maximum: 10000,
                       description: "Empreinte carbone (kgCO2eq/m² ou /u)" },
  },
  examples: [
    { thermal: { lambda: 0.041 }, unitPrice: 12.5, sources: ["DTU 25.41"] },
    { name: "Pierre patrimoniale Bourgogne", carbonFootprint: 8.2 },
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
