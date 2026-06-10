// lib/graphql/schema.ts
// Schema GraphQL minimal — exposé via /api/v1/graphql derrière flag GRAPHQL_API.
// Wrapper pédagogique sur les endpoints REST existants.

export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Query {
    me: Me!
    project(id: ID!): Project
    projects(page: Int = 1, pageSize: Int = 20, status: String): ProjectConnection!
    report(id: ID!): Report
    appliedOverrides: [AppliedOverride!]!
    # Sprint 29 — Assistant IA
    assistantConversations(page: Int = 1, pageSize: Int = 20, persona: String, contextType: String): AssistantConversationConnection!
    assistantConversation(id: ID!): AssistantConversation
    assistantStats(days: Int = 30): AssistantStats!
  }

  type Mutation {
    createProject(input: CreateProjectInput!): Project!
    """Met à jour un projet existant (espace projet — v2.3+)."""
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    queueReport(projectId: ID!, input: QueueReportInput!): Report!
  }

  # ── Account ───────────────────────────────────────────────────────────
  type Me {
    organization: Organization!
    apiKey: ApiKeyContext!
    quotas: Quotas!
  }

  type Organization {
    id: ID!
    name: String!
    slug: String
    plan: String!
    clientType: String
  }

  type ApiKeyContext {
    prefix: String!
    scope: String!
    name: String!
  }

  type Quotas {
    projects: QuotaUsage!
    reports: QuotaUsage!
    photos: QuotaUsage!
  }

  type QuotaUsage {
    used: Int!
    limit: Int
  }

  # ── Projects ──────────────────────────────────────────────────────────
  type Project {
    id: ID!
    name: String!
    clientName: String
    address: String
    surfaceM2: Float
    buildingType: String
    """Sous-type fin du projet (v2.3+) : APPARTEMENT, BUREAU, COMMERCE, etc."""
    projectSubType: String
    constructionYear: Int
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    """Coordonnées structurées du client (v2.3+)."""
    client: ProjectClient
    """Statut de propriété & éligibilité aides (v2.3+)."""
    ownership: ProjectOwnership
    """Profil autonomie / handicap des occupants (v2.2+)."""
    autonomy: ProjectAutonomy
    """Champs spécifiques tertiaire / collectif (v2.3+)."""
    typeSpecifics: ProjectTypeSpecifics
  }

  """Coordonnées client structurées (v2.3+)."""
  type ProjectClient {
    firstName: String
    lastName: String
    email: String
    phone: String
    propertyAddress: String
    propertyPostalCode: String
    propertyCity: String
  }

  """Statut de propriété et éligibilité aux aides (v2.3+)."""
  type ProjectOwnership {
    """PROPRIETAIRE_OCCUPANT | PROPRIETAIRE_BAILLEUR | LOCATAIRE | SCI_FAMILIALE_IR | SCI_PATRIMONIALE_IS | INDIVISION | USUFRUITIER | NU_PROPRIETAIRE | SYNDIC_COPRO | BAILLEUR_SOCIAL | PERSONNE_MORALE_ENTREPRISE"""
    kind: String!
    legalEntityName: String
    siret: String
    """Aides éligibles selon le statut."""
    mprEligible: Boolean!
    mprBailleurEligible: Boolean!
    mprCoproEligible: Boolean!
    mprAccompagneEligible: Boolean!
    ecoPtzEligible: Boolean!
    ecoPlsEligible: Boolean!
    ceeEligible: Boolean!
    tva55Eligible: Boolean!
    decretTertiaireApplicable: Boolean!
  }

  """Profil autonomie / handicap (v2.2+)."""
  type ProjectAutonomy {
    hasHandicappedOccupant: Boolean
    hasElderlyOccupant: Boolean
    oldestOccupantAge: Int
    occupantGir: Int
    occupantHandicapRate: Int
    """Aides autonomie éligibles : MPR_ADAPT, PCH, APA, ACTION_LOGEMENT…"""
    applicableAidKeys: [String!]!
  }

  """Champs spécifiques au sous-type (v2.3+)."""
  type ProjectTypeSpecifics {
    floorLevel: Int
    isTopFloor: Boolean
    isGroundFloor: Boolean
    lotsCount: Int
    buildingsCount: Int
    commonHeating: Boolean
    commonDhw: Boolean
    commonVentilation: Boolean
    tertiaryActivityKind: String
    operatingHoursPerWeek: Float
    occupancyDensity: Float
    shopWindowSurfaceM2: Float
    hasColdChain: Boolean
    itConsumptionKwhPerM2Year: Float
    isDeetSubject: Boolean
    pptStatus: String
    hasAgPv3y: Boolean
  }

  input CreateProjectInput {
    name: String!
    clientName: String
    address: String
    surfaceM2: Float!
    buildingType: String!
    projectSubType: String
    constructionYear: Int
    client: ProjectClientInput
    ownershipKind: String
    autonomy: ProjectAutonomyInput
    typeSpecifics: ProjectTypeSpecificsInput
  }

  input ProjectClientInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
    propertyAddress: String!
    propertyPostalCode: String!
    propertyCity: String!
    legalEntityName: String
    siret: String
  }

  input ProjectAutonomyInput {
    hasHandicappedOccupant: Boolean
    hasElderlyOccupant: Boolean
    oldestOccupantAge: Int
    occupantGir: Int
    occupantHandicapRate: Int
  }

  input ProjectTypeSpecificsInput {
    floorLevel: Int
    isTopFloor: Boolean
    isGroundFloor: Boolean
    lotsCount: Int
    buildingsCount: Int
    commonHeating: Boolean
    commonDhw: Boolean
    commonVentilation: Boolean
    tertiaryActivityKind: String
    operatingHoursPerWeek: Float
    occupancyDensity: Float
    shopWindowSurfaceM2: Float
    hasColdChain: Boolean
    itConsumptionKwhPerM2Year: Float
    isDeetSubject: Boolean
    pptStatus: String
    hasAgPv3y: Boolean
  }

  input UpdateProjectInput {
    name: String
    clientName: String
    address: String
    surfaceM2: Float
    buildingType: String
    projectSubType: String
    constructionYear: Int
    client: ProjectClientInput
    ownershipKind: String
    autonomy: ProjectAutonomyInput
    typeSpecifics: ProjectTypeSpecificsInput
  }

  type ProjectConnection {
    data: [Project!]!
    pagination: Pagination!
  }

  type Pagination {
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  # ── Reports ───────────────────────────────────────────────────────────
  type Report {
    id: ID!
    projectId: ID!
    template: String!
    mode: String!
    locale: String!
    status: String!
    pdfUrl: String
    sha256: String
    createdAt: DateTime!
  }

  input QueueReportInput {
    template: String!
    mode: String = "complet"
    locale: String = "fr"
  }

  # ── Catalog overrides ────────────────────────────────────────────────
  type AppliedOverride {
    kind: String!
    entryId: String!
    canonicalName: String!
    patch: JSON!
    overriddenFields: [String!]!
    reason: String!
    updatedAt: DateTime!
  }

  # ── Sprint 29 — Assistant IA ──────────────────────────────────────────
  type AssistantConversation {
    id: ID!
    persona: String!
    contextType: String!
    contextRef: String
    locale: String!
    promptVersion: String!
    tokensIn: Int!
    tokensOut: Int!
    closedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    messageCount: Int!
    feedbackCount: Int!
    feedback: [AssistantFeedback!]!
  }

  type AssistantConversationConnection {
    items: [AssistantConversation!]!
    pagination: Pagination!
  }

  type AssistantFeedback {
    id: ID!
    helpful: Boolean
    issueKind: String
    hasComment: Boolean!
    createdAt: DateTime!
  }

  type AssistantStats {
    totalConversations: Int!
    totalMessages: Int!
    helpfulCount: Int!
    notHelpfulCount: Int!
    helpfulRatePct: Float!
    tokensConsumed: Int!
    topContexts: [AssistantContextStat!]!
  }

  type AssistantContextStat {
    contextType: String!
    count: Int!
  }
`;
