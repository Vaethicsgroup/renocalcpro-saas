// app/api/v1/openapi.ts
// Spec OpenAPI 3.1 publique pour l'API REST Réno·Calc Pro v1.
// Servi tel quel par /api/v1/openapi.json — consommé par Swagger UI sur /api-docs.

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Réno·Calc Pro API",
    version: "1.0.0",
    description:
      "API publique REST pour intégrer Réno·Calc Pro à vos workflows : créer des dossiers de rénovation, générer des rapports PDF, récupérer les données structurées d'un audit.\n\n" +
      "Authentification : Bearer token (clé API au format `rnc_live_<prefix>.<secret>`).\n" +
      "Rate-limit : 60 req/min (BASIC), 600 req/min (FULL). Activation : feature flag REST_API (plans Enterprise).",
    contact: { name: "Support Réno·Calc Pro", email: "contact@renocalcpro.fr", url: "https://renocalcpro.fr/help" },
    license: { name: "Proprietary", url: "https://renocalcpro.fr/legal/cgu" },
    termsOfService: "https://renocalcpro.fr/legal/cgu",
  },
  servers: [
    { url: "https://renocalcpro.fr/api/v1", description: "Production" },
    { url: "https://staging.renocalcpro.fr/api/v1", description: "Staging" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "rnc_<env>_<prefix>.<secret>",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string", example: "invalid_api_key" },
          details: { type: "object", additionalProperties: true },
          docs_url: { type: "string", format: "uri" },
        },
      },
      Me: {
        type: "object",
        properties: {
          organization: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              clientType: { type: "string" },
              plan: { type: "string", enum: ["TRIAL", "SOLO", "PRO", "TEAM", "ENTERPRISE"] },
            },
          },
          apiKey: {
            type: "object",
            properties: {
              prefix: { type: "string" },
              scope: { type: "string", enum: ["BASIC", "FULL"] },
              name: { type: "string" },
            },
          },
          quotas: {
            type: "object",
            properties: {
              projects: { type: "object", properties: { used: { type: "integer" }, limit: { type: ["integer", "null"] } } },
              reports:  { type: "object", properties: { used: { type: "integer" }, limit: { type: ["integer", "null"] } } },
              photos:   { type: "object", properties: { used: { type: "integer" }, limit: { type: ["integer", "null"] } } },
            },
          },
        },
      },
      Project: {
        type: "object",
        required: ["id", "name", "createdAt"],
        properties: {
          id: { type: "string", format: "cuid" },
          name: { type: "string", maxLength: 200 },
          clientName: { type: "string" },
          address: { type: "string" },
          surfaceM2: { type: "number", minimum: 1, maximum: 10000 },
          buildingType: { type: "string", enum: ["maison", "appartement", "immeuble", "tertiaire"] },
          constructionYear: { type: "integer", minimum: 1700, maximum: 2030 },
          status: { type: "string", enum: ["draft", "in_review", "completed", "archived"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProjectInput: {
        type: "object",
        required: ["name", "surfaceM2", "buildingType"],
        properties: {
          name: { type: "string", maxLength: 200 },
          clientName: { type: "string" },
          address: { type: "string" },
          surfaceM2: { type: "number", minimum: 1, maximum: 10000 },
          buildingType: { type: "string", enum: ["maison", "appartement", "immeuble", "tertiaire"] },
          constructionYear: { type: "integer", minimum: 1700, maximum: 2030 },
        },
      },
      Report: {
        type: "object",
        required: ["id", "projectId", "template", "status", "createdAt"],
        properties: {
          id: { type: "string", format: "cuid" },
          projectId: { type: "string", format: "cuid" },
          template: { type: "string", enum: ["AUDIT_PARTICULIER", "DPE_COLLECTIF", "AUDIT_COPROPRIETE", "AUDIT_TERTIAIRE"] },
          mode: { type: "string", enum: ["synthese", "complet"] },
          locale: { type: "string", enum: ["fr", "en", "es", "de", "pt"] },
          status: { type: "string", enum: ["pending", "generating", "ready", "failed"] },
          pdfUrl: { type: ["string", "null"], format: "uri" },
          sha256: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ReportInput: {
        type: "object",
        required: ["template"],
        properties: {
          template: { type: "string", enum: ["AUDIT_PARTICULIER", "DPE_COLLECTIF", "AUDIT_COPROPRIETE", "AUDIT_TERTIAIRE"] },
          mode: { type: "string", enum: ["synthese", "complet"], default: "complet" },
          locale: { type: "string", enum: ["fr", "en", "es", "de", "pt"], default: "fr" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          hasMore: { type: "boolean" },
        },
      },
      MaterialSelection: {
        type: "object",
        required: ["id", "materialId", "category", "confidence", "source"],
        properties: {
          id: { type: "string", format: "cuid" },
          materialId: { type: "string", example: "wall-cut-stone" },
          category: { type: "string", enum: ["wall", "floor_low", "floor_high", "opening", "finish"] },
          confidence: { type: "string", enum: ["observed", "estimated", "supposed", "unknown"] },
          source: { type: "string", enum: ["ui", "photo", "api", "import"] },
          note: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/me": {
      get: {
        summary: "Get current API key context (org, plan, quotas)",
        operationId: "getMe",
        tags: ["Account"],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Me" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/me/overrides": {
      get: {
        summary: "List active catalog overrides for current org",
        operationId: "listAppliedOverrides",
        description: "Retourne les overrides catalogue actifs affectant les calculs de votre organisation. Utile pour vérifier conformité.",
        tags: ["Account"],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          kind: { type: "string", enum: ["MATERIAL", "SYSTEM"] },
                          entryId: { type: "string" },
                          canonicalName: { type: "string" },
                          patch: { type: "object", additionalProperties: true },
                          overriddenFields: { type: "array", items: { type: "string" } },
                          reason: { type: "string" },
                          updatedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/projects": {
      get: {
        summary: "List projects",
        operationId: "listProjects",
        tags: ["Projects"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "in_review", "completed", "archived"] } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create project",
        operationId: "createProject",
        description: "Requires FULL scope.",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "402": { description: "Quota reached / scope insufficient", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}": {
      get: {
        summary: "Get project by id",
        operationId: "getProject",
        tags: ["Projects"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}/reports": {
      post: {
        summary: "Generate report for a project",
        operationId: "createReport",
        description: "Requires FULL scope. Génération asynchrone — interroger /reports/{id} pour le statut.",
        tags: ["Reports"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReportInput" } } },
        },
        responses: {
          "202": { description: "Accepted (queued)", content: { "application/json": { schema: { $ref: "#/components/schemas/Report" } } } },
          "402": { description: "Quota reached", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reports/{id}": {
      get: {
        summary: "Get report by id",
        operationId: "getReport",
        tags: ["Reports"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Report" } } } },
        },
      },
    },
    "/projects/{id}/materials": {
      get: {
        summary: "List material selections for a project",
        operationId: "listProjectMaterials",
        tags: ["Materials"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/MaterialSelection" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Add a material selection to a project",
        operationId: "addProjectMaterial",
        description: "Requires FULL scope.",
        tags: ["Materials"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["materialId"],
                properties: {
                  materialId: { type: "string", description: "ID stable du matériau (ex: 'wall-cut-stone')" },
                  confidence: { type: "string", enum: ["observed", "estimated", "supposed", "unknown"], default: "supposed" },
                  note: { type: "string", maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/MaterialSelection" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/projects/{id}/materials/{selectionId}": {
      delete: {
        summary: "Remove a material selection",
        operationId: "removeProjectMaterial",
        description: "Requires FULL scope.",
        tags: ["Materials"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } },
          { name: "selectionId", in: "path", required: true, schema: { type: "string", format: "cuid" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "404": { description: "Selection not found" },
        },
      },
    },
    "/projects/{id}/identify-material": {
      post: {
        summary: "AI material identification from photo",
        operationId: "identifyMaterial",
        description: "Suggests top-3 materials from a photo using Claude Vision. Requires FULL scope and AI_PHOTO_ANALYSIS feature flag.",
        tags: ["AI"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["imageUrl", "category"],
                properties: {
                  imageUrl: { type: "string", format: "uri" },
                  category: { type: "string", enum: ["wall", "floor_low", "floor_high", "opening", "finish"] },
                  yearBuilt: { type: "integer" },
                  region: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projectId: { type: "string" },
                    category: { type: "string" },
                    mode: { type: "string", enum: ["vision", "mock"] },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          materialId: { type: "string" },
                          name: { type: "string" },
                          confidencePct: { type: "number" },
                          confidence: { type: "string", enum: ["observed", "estimated", "supposed", "unknown"] },
                          rationale: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "402": { description: "AI_PHOTO_ANALYSIS not enabled", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reports/{id}/pdf": {
      get: {
        summary: "Download report PDF",
        operationId: "getReportPdf",
        tags: ["Reports"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "cuid" } }],
        responses: {
          "200": { description: "Binary PDF", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } },
          "404": { description: "Not ready or not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
  tags: [
    { name: "Account", description: "Contexte de la clé API" },
    { name: "Projects", description: "Dossiers de rénovation" },
    { name: "Reports", description: "Rapports PDF générés" },
    { name: "AI", description: "Endpoints intelligence artificielle (Claude Vision, identification matériau)" },
    { name: "Materials", description: "Sélections matériau du bâti initial (CRUD)" },
  ],
} as const;
