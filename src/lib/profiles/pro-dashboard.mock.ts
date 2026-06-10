// src/lib/profiles/pro-dashboard.mock.ts
// ════════════════════════════════════════════════════════════════════════════
// DONNÉES MOCKÉES — Dashboard pro par profil.
//
// Ces données alimentent les KPIs / priorités / actions rapides affichés dans
// `/o/dashboard?profile=…`. Aucune donnée réelle, aucune requête Prisma.
//
// Quand la DB exposera ces métriques (organisation.professionalProfile + tables
// projects/diagnostics/aids/etc.), substituer un fetcher serveur qui retourne
// le même type `ProDashboardData`. L'UI n'aura pas à bouger.
// ════════════════════════════════════════════════════════════════════════════

import type { ProfessionalProfile } from "./professional-profiles";

export interface ProKpi {
  /** Identifiant stable (pour key React). */
  key: string;
  /** Clé i18n du label (namespace `proDashboardMock`). */
  labelKey: string;
  value: string;
  /** Variation affichée à droite ("+12 %" ou "-3"). */
  delta?: string;
  /** Sens de la variation (vert/rouge). Si undefined, neutre. */
  positive?: boolean;
  /** Clé i18n optionnelle du caption sous le delta. */
  captionKey?: string;
  /** Nom d'icône lucide-react. Le composant le mappe. */
  icon:
    | "Briefcase"
    | "FileText"
    | "Layers"
    | "Gauge"
    | "Building2"
    | "Home"
    | "ClipboardCheck"
    | "AlertTriangle"
    | "TrendingUp"
    | "Coins"
    | "Activity"
    | "Calculator"
    | "MapPin"
    | "Wallet"
    | "ShieldCheck"
    | "Cpu"
    | "Library";
  /** Accent visuel : `forest`, `terracotta`, `amber`, `info`, `success`. */
  tone: "forest" | "terracotta" | "amber" | "info" | "success" | "stone";
}

export interface ProPriority {
  key: string;
  /** Clé i18n du libellé d'action concrète. */
  labelKey: string;
  /** Compteur d'éléments à traiter. */
  count: number;
  /** Niveau d'urgence (visuel uniquement). */
  level: "high" | "medium" | "low";
  /** Clé i18n de la description courte. */
  descKey: string;
}

export interface ProQuickAction {
  key: string;
  /** Clé i18n du label de l'action. */
  labelKey: string;
  /** Destination relative au locale prefix (ex: `/o/projects/new`). */
  href: string;
  /** Icône lucide. */
  icon:
    | "Plus"
    | "FolderOpen"
    | "Library"
    | "BarChart3"
    | "FileText"
    | "Building2"
    | "Search"
    | "ClipboardEdit"
    | "Share2"
    | "Calculator"
    | "Cpu"
    | "Layers"
    | "Send"
    | "Coins";
  /** Disponible ou bientôt. */
  available: boolean;
}

export interface ProAlert {
  key: string;
  level: "info" | "warning" | "danger" | "success";
  /** Clé i18n du titre de l'alerte. */
  titleKey: string;
  /** Clé i18n de la description de l'alerte. */
  descKey: string;
}

export interface ProDashboardData {
  profile: ProfessionalProfile;
  kpis: ProKpi[];
  priorities: ProPriority[];
  quickActions: ProQuickAction[];
  alerts: ProAlert[];
  /** Clé i18n du bandeau d'avertissement mock à afficher en démo. */
  mockNoticeKey: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Profil : AUDITEUR ÉNERGÉTIQUE
// ────────────────────────────────────────────────────────────────────────────

const AUDITEUR: ProDashboardData = {
  profile: "AUDITEUR_ENERGETIQUE",
  kpis: [
    { key: "audits_actifs", labelKey: "aud_kpi_audits_actifs_label", value: "18", delta: "+4", positive: true, icon: "Briefcase", captionKey: "aud_kpi_audits_actifs_caption", tone: "forest" },
    { key: "passoires", labelKey: "aud_kpi_passoires_label", value: "11", delta: "+2", positive: true, icon: "AlertTriangle", captionKey: "aud_kpi_passoires_caption", tone: "terracotta" },
    { key: "gain_dpe", labelKey: "aud_kpi_gain_dpe_label", value: "+3,2", icon: "TrendingUp", captionKey: "aud_kpi_gain_dpe_caption", tone: "success" },
    { key: "rapports_attente", labelKey: "aud_kpi_rapports_attente_label", value: "6", delta: "-1", positive: true, icon: "FileText", captionKey: "aud_kpi_rapports_attente_caption", tone: "amber" },
    { key: "aides_estimees", labelKey: "aud_kpi_aides_estimees_label", value: "284 k€", icon: "Coins", captionKey: "aud_kpi_aides_estimees_caption", tone: "forest" },
    { key: "econ_moyennes", labelKey: "aud_kpi_econ_moyennes_label", value: "1 840 €/an", icon: "Wallet", captionKey: "aud_kpi_econ_moyennes_caption", tone: "info" },
  ],
  priorities: [
    { key: "audits_finaliser", labelKey: "aud_pri_audits_finaliser_label", count: 4, level: "high", descKey: "aud_pri_audits_finaliser_desc" },
    { key: "scenarios_valider", labelKey: "aud_pri_scenarios_valider_label", count: 7, level: "medium", descKey: "aud_pri_scenarios_valider_desc" },
    { key: "aides_verifier", labelKey: "aud_pri_aides_verifier_label", count: 3, level: "high", descKey: "aud_pri_aides_verifier_desc" },
    { key: "visites_terrain", labelKey: "aud_pri_visites_terrain_label", count: 5, level: "low", descKey: "aud_pri_visites_terrain_desc" },
    { key: "rapports_relire", labelKey: "aud_pri_rapports_relire_label", count: 2, level: "medium", descKey: "aud_pri_rapports_relire_desc" },
  ],
  quickActions: [
    { key: "creer_audit", labelKey: "aud_qa_creer_audit_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "biblio_materiaux", labelKey: "aud_qa_biblio_materiaux_label", href: "/o/library/materials", icon: "Library", available: true },
    { key: "biblio_systemes", labelKey: "aud_qa_biblio_systemes_label", href: "/o/library/systems", icon: "Cpu", available: true },
    { key: "generer_scenario", labelKey: "aud_qa_generer_scenario_label", href: "/o/tools", icon: "BarChart3", available: true },
    { key: "preparer_rapport", labelKey: "aud_qa_preparer_rapport_label", href: "/o/reports", icon: "FileText", available: false },
  ],
  alerts: [
    { key: "fg_alert", level: "warning", titleKey: "aud_alert_fg_alert_title", descKey: "aud_alert_fg_alert_desc" },
    { key: "deadlines", level: "info", titleKey: "aud_alert_deadlines_title", descKey: "aud_alert_deadlines_desc" },
  ],
  mockNoticeKey: "aud_mockNotice",
};

// ────────────────────────────────────────────────────────────────────────────
// Profil : DIAGNOSTIQUEUR IMMOBILIER
// ────────────────────────────────────────────────────────────────────────────

const DIAGNOSTIQUEUR: ProDashboardData = {
  profile: "DIAGNOSTIQUEUR",
  kpis: [
    { key: "dpe_mois", labelKey: "diag_kpi_dpe_mois_label", value: "47", delta: "+9", positive: true, icon: "ClipboardCheck", captionKey: "diag_kpi_dpe_mois_caption", tone: "info" },
    { key: "ges_mois", labelKey: "diag_kpi_ges_mois_label", value: "47", icon: "Gauge", captionKey: "diag_kpi_ges_mois_caption", tone: "forest" },
    { key: "passoires_locatif", labelKey: "diag_kpi_passoires_locatif_label", value: "14", icon: "AlertTriangle", captionKey: "diag_kpi_passoires_locatif_caption", tone: "terracotta" },
    { key: "biens_conformes", labelKey: "diag_kpi_biens_conformes_label", value: "33", icon: "ShieldCheck", captionKey: "diag_kpi_biens_conformes_caption", tone: "success" },
    { key: "dossiers_incomplets", labelKey: "diag_kpi_dossiers_incomplets_label", value: "5", delta: "-2", positive: true, icon: "FileText", captionKey: "diag_kpi_dossiers_incomplets_caption", tone: "amber" },
    { key: "rdv_semaine", labelKey: "diag_kpi_rdv_semaine_label", value: "12", icon: "MapPin", captionKey: "diag_kpi_rdv_semaine_caption", tone: "info" },
  ],
  priorities: [
    { key: "rapports_livrer", labelKey: "diag_pri_rapports_livrer_label", count: 6, level: "high", descKey: "diag_pri_rapports_livrer_desc" },
    { key: "mesures_saisir", labelKey: "diag_pri_mesures_saisir_label", count: 4, level: "medium", descKey: "diag_pri_mesures_saisir_desc" },
    { key: "renouvellements", labelKey: "diag_pri_renouvellements_label", count: 9, level: "low", descKey: "diag_pri_renouvellements_desc" },
    { key: "biens_classer", labelKey: "diag_pri_biens_classer_label", count: 3, level: "medium", descKey: "diag_pri_biens_classer_desc" },
    { key: "alertes_fg", labelKey: "diag_pri_alertes_fg_label", count: 2, level: "high", descKey: "diag_pri_alertes_fg_desc" },
  ],
  quickActions: [
    { key: "nouveau_diag", labelKey: "diag_qa_nouveau_diag_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "rechercher_bien", labelKey: "diag_qa_rechercher_bien_label", href: "/o/projects", icon: "Search", available: true },
    { key: "saisir_mesures", labelKey: "diag_qa_saisir_mesures_label", href: "/o/tools", icon: "ClipboardEdit", available: true },
    { key: "historique", labelKey: "diag_qa_historique_label", href: "/o/projects", icon: "FolderOpen", available: true },
    { key: "exporter_fiche", labelKey: "diag_qa_exporter_fiche_label", href: "/o/reports", icon: "Send", available: false },
  ],
  alerts: [
    { key: "loi_climat", level: "warning", titleKey: "diag_alert_loi_climat_title", descKey: "diag_alert_loi_climat_desc" },
    { key: "renouv_30j", level: "info", titleKey: "diag_alert_renouv_30j_title", descKey: "diag_alert_renouv_30j_desc" },
  ],
  mockNoticeKey: "diag_mockNotice",
};

// ────────────────────────────────────────────────────────────────────────────
// Profil : SYNDIC
// ────────────────────────────────────────────────────────────────────────────

const SYNDIC: ProDashboardData = {
  profile: "SYNDIC",
  kpis: [
    { key: "copros", labelKey: "syn_kpi_copros_label", value: "12", delta: "+1", positive: true, icon: "Building2", captionKey: "syn_kpi_copros_caption", tone: "terracotta" },
    { key: "lots", labelKey: "syn_kpi_lots_label", value: "842", icon: "Home", captionKey: "syn_kpi_lots_caption", tone: "info" },
    { key: "fg_immeubles", labelKey: "syn_kpi_fg_immeubles_label", value: "4", icon: "AlertTriangle", captionKey: "syn_kpi_fg_immeubles_caption", tone: "terracotta" },
    { key: "ag_preparer", labelKey: "syn_kpi_ag_preparer_label", value: "3", icon: "ClipboardCheck", captionKey: "syn_kpi_ag_preparer_caption", tone: "amber" },
    { key: "scenarios_collectifs", labelKey: "syn_kpi_scenarios_collectifs_label", value: "8", icon: "Layers", captionKey: "syn_kpi_scenarios_collectifs_caption", tone: "forest" },
    { key: "budget_travaux", labelKey: "syn_kpi_budget_travaux_label", value: "1,4 M€", icon: "Wallet", captionKey: "syn_kpi_budget_travaux_caption", tone: "info" },
  ],
  priorities: [
    { key: "pppt_lancer", labelKey: "syn_pri_pppt_lancer_label", count: 4, level: "high", descKey: "syn_pri_pppt_lancer_desc" },
    { key: "ag_documents", labelKey: "syn_pri_ag_documents_label", count: 3, level: "high", descKey: "syn_pri_ag_documents_desc" },
    { key: "aides_copro", labelKey: "syn_pri_aides_copro_label", count: 5, level: "medium", descKey: "syn_pri_aides_copro_desc" },
    { key: "travaux_collectifs", labelKey: "syn_pri_travaux_collectifs_label", count: 7, level: "medium", descKey: "syn_pri_travaux_collectifs_desc" },
    { key: "diag_dpe_collectif", labelKey: "syn_pri_diag_dpe_collectif_label", count: 2, level: "low", descKey: "syn_pri_diag_dpe_collectif_desc" },
  ],
  quickActions: [
    { key: "creer_copro", labelKey: "syn_qa_creer_copro_label", href: "/o/projects/new", icon: "Building2", available: true },
    { key: "ajouter_batiment", labelKey: "syn_qa_ajouter_batiment_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "preparer_ag", labelKey: "syn_qa_preparer_ag_label", href: "/o/tools", icon: "ClipboardEdit", available: false },
    { key: "comparer_scenarios", labelKey: "syn_qa_comparer_scenarios_label", href: "/o/tools", icon: "BarChart3", available: true },
    { key: "aides_collectives", labelKey: "syn_qa_aides_collectives_label", href: "/o/library/systems", icon: "Coins", available: true },
  ],
  alerts: [
    { key: "pppt_obligation", level: "warning", titleKey: "syn_alert_pppt_obligation_title", descKey: "syn_alert_pppt_obligation_desc" },
    { key: "ag_proche", level: "info", titleKey: "syn_alert_ag_proche_title", descKey: "syn_alert_ag_proche_desc" },
  ],
  mockNoticeKey: "syn_mockNotice",
};

// ────────────────────────────────────────────────────────────────────────────
// Profil : BUREAU D'ÉTUDES THERMIQUE
// ────────────────────────────────────────────────────────────────────────────

const BUREAU_ETUDES: ProDashboardData = {
  profile: "BUREAU_ETUDES_THERMIQUE",
  kpis: [
    { key: "etudes_actives", labelKey: "be_kpi_etudes_actives_label", value: "9", delta: "+2", positive: true, icon: "Calculator", captionKey: "be_kpi_etudes_actives_caption", tone: "info" },
    { key: "variantes_calculees", labelKey: "be_kpi_variantes_calculees_label", value: "34", icon: "Layers", captionKey: "be_kpi_variantes_calculees_caption", tone: "forest" },
    { key: "gain_cep", labelKey: "be_kpi_gain_cep_label", value: "-41 %", positive: true, icon: "TrendingUp", captionKey: "be_kpi_gain_cep_caption", tone: "success" },
    { key: "systemes_compares", labelKey: "be_kpi_systemes_compares_label", value: "17", icon: "Cpu", captionKey: "be_kpi_systemes_compares_caption", tone: "info" },
    { key: "materiaux_actifs", labelKey: "be_kpi_materiaux_actifs_label", value: "23", icon: "Library", captionKey: "be_kpi_materiaux_actifs_caption", tone: "stone" },
    { key: "dossiers_valider", labelKey: "be_kpi_dossiers_valider_label", value: "4", icon: "ShieldCheck", captionKey: "be_kpi_dossiers_valider_caption", tone: "amber" },
  ],
  priorities: [
    { key: "nouvelles_etudes", labelKey: "be_pri_nouvelles_etudes_label", count: 3, level: "high", descKey: "be_pri_nouvelles_etudes_desc" },
    { key: "variantes_arbitrage", labelKey: "be_pri_variantes_arbitrage_label", count: 8, level: "medium", descKey: "be_pri_variantes_arbitrage_desc" },
    { key: "conformite_re2020", labelKey: "be_pri_conformite_re2020_label", count: 2, level: "high", descKey: "be_pri_conformite_re2020_desc" },
    { key: "fiches_techniques", labelKey: "be_pri_fiches_techniques_label", count: 5, level: "low", descKey: "be_pri_fiches_techniques_desc" },
    { key: "calculs_avances", labelKey: "be_pri_calculs_avances_label", count: 2, level: "medium", descKey: "be_pri_calculs_avances_desc" },
  ],
  quickActions: [
    { key: "nouvelle_etude", labelKey: "be_qa_nouvelle_etude_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "moteur_expert", labelKey: "be_qa_moteur_expert_label", href: "/o/projects/new", icon: "Calculator", available: true },
    { key: "comparer_variantes", labelKey: "be_qa_comparer_variantes_label", href: "/o/tools", icon: "BarChart3", available: true },
    { key: "biblio_materiaux", labelKey: "be_qa_biblio_materiaux_label", href: "/o/library/materials", icon: "Library", available: true },
    { key: "biblio_systemes", labelKey: "be_qa_biblio_systemes_label", href: "/o/library/systems", icon: "Cpu", available: true },
  ],
  alerts: [
    { key: "re2020_update", level: "info", titleKey: "be_alert_re2020_update_title", descKey: "be_alert_re2020_update_desc" },
    { key: "cep_audit", level: "success", titleKey: "be_alert_cep_audit_title", descKey: "be_alert_cep_audit_desc" },
  ],
  mockNoticeKey: "be_mockNotice",
};

// ────────────────────────────────────────────────────────────────────────────
// Profil : AGENCE IMMOBILIÈRE
// ────────────────────────────────────────────────────────────────────────────

const AGENCE: ProDashboardData = {
  profile: "AGENCE_IMMOBILIERE",
  kpis: [
    { key: "biens_suivis", labelKey: "ag_kpi_biens_suivis_label", value: "186", delta: "+12", positive: true, icon: "Home", captionKey: "ag_kpi_biens_suivis_caption", tone: "amber" },
    { key: "biens_fg", labelKey: "ag_kpi_biens_fg_label", value: "41", delta: "-3", positive: true, icon: "AlertTriangle", captionKey: "ag_kpi_biens_fg_caption", tone: "terracotta" },
    { key: "valeur_verte", labelKey: "ag_kpi_valeur_verte_label", value: "+8,2 %", positive: true, icon: "TrendingUp", captionKey: "ag_kpi_valeur_verte_caption", tone: "success" },
    { key: "travaux_recos", labelKey: "ag_kpi_travaux_recos_label", value: "118", icon: "ClipboardCheck", captionKey: "ag_kpi_travaux_recos_caption", tone: "info" },
    { key: "biens_risque", labelKey: "ag_kpi_biens_risque_label", value: "23", icon: "ShieldCheck", captionKey: "ag_kpi_biens_risque_caption", tone: "terracotta" },
    { key: "fiches_client", labelKey: "ag_kpi_fiches_client_label", value: "94", delta: "+18", positive: true, icon: "FileText", captionKey: "ag_kpi_fiches_client_caption", tone: "forest" },
  ],
  priorities: [
    { key: "biens_loi_climat", labelKey: "ag_pri_biens_loi_climat_label", count: 17, level: "high", descKey: "ag_pri_biens_loi_climat_desc" },
    { key: "biens_classer_g", labelKey: "ag_pri_biens_classer_g_label", count: 6, level: "high", descKey: "ag_pri_biens_classer_g_desc" },
    { key: "estimations_travaux", labelKey: "ag_pri_estimations_travaux_label", count: 11, level: "medium", descKey: "ag_pri_estimations_travaux_desc" },
    { key: "fiches_vendeur", labelKey: "ag_pri_fiches_vendeur_label", count: 8, level: "medium", descKey: "ag_pri_fiches_vendeur_desc" },
    { key: "portefeuille_revoir", labelKey: "ag_pri_portefeuille_revoir_label", count: 4, level: "low", descKey: "ag_pri_portefeuille_revoir_desc" },
  ],
  quickActions: [
    { key: "ajouter_bien", labelKey: "ag_qa_ajouter_bien_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "fiche_vendeur", labelKey: "ag_qa_fiche_vendeur_label", href: "/o/reports", icon: "FileText", available: false },
    { key: "estimer_travaux", labelKey: "ag_qa_estimer_travaux_label", href: "/o/tools", icon: "Calculator", available: true },
    { key: "prioriser_porte", labelKey: "ag_qa_prioriser_porte_label", href: "/o/projects", icon: "BarChart3", available: true },
    { key: "partager_synth", labelKey: "ag_qa_partager_synth_label", href: "/o/portal", icon: "Share2", available: true },
  ],
  alerts: [
    { key: "loi_climat_2028", level: "danger", titleKey: "ag_alert_loi_climat_2028_title", descKey: "ag_alert_loi_climat_2028_desc" },
    { key: "valorisation", level: "success", titleKey: "ag_alert_valorisation_title", descKey: "ag_alert_valorisation_desc" },
  ],
  mockNoticeKey: "ag_mockNotice",
};

// ────────────────────────────────────────────────────────────────────────────
// Profil : PRO_GENERAL (fallback)
// ────────────────────────────────────────────────────────────────────────────

const PRO_GENERAL: ProDashboardData = {
  profile: "PRO_GENERAL",
  kpis: [
    { key: "projets_actifs", labelKey: "gen_kpi_projets_actifs_label", value: "24", delta: "+12 %", positive: true, icon: "Briefcase", captionKey: "gen_kpi_projets_actifs_caption", tone: "forest" },
    { key: "etudes_realisees", labelKey: "gen_kpi_etudes_realisees_label", value: "47", delta: "+16 %", positive: true, icon: "FileText", captionKey: "gen_kpi_etudes_realisees_caption", tone: "info" },
    { key: "scenarios", labelKey: "gen_kpi_scenarios_label", value: "183", icon: "Layers", captionKey: "gen_kpi_scenarios_caption", tone: "forest" },
    { key: "dpe_moyen", labelKey: "gen_kpi_dpe_moyen_label", value: "D", icon: "Gauge", captionKey: "gen_kpi_dpe_moyen_caption", tone: "amber" },
  ],
  priorities: [
    { key: "projets_termines", labelKey: "gen_pri_projets_termines_label", count: 5, level: "high", descKey: "gen_pri_projets_termines_desc" },
    { key: "documents", labelKey: "gen_pri_documents_label", count: 8, level: "low", descKey: "gen_pri_documents_desc" },
  ],
  quickActions: [
    { key: "nouveau", labelKey: "gen_qa_nouveau_label", href: "/o/projects/new", icon: "Plus", available: true },
    { key: "biblio_mat", labelKey: "gen_qa_biblio_mat_label", href: "/o/library/materials", icon: "Library", available: true },
    { key: "outils", labelKey: "gen_qa_outils_label", href: "/o/tools", icon: "Calculator", available: true },
  ],
  alerts: [
    { key: "info_general", level: "info", titleKey: "gen_alert_info_general_title", descKey: "gen_alert_info_general_desc" },
  ],
  mockNoticeKey: "gen_mockNotice",
};

const DASHBOARDS: Record<ProfessionalProfile, ProDashboardData> = {
  AUDITEUR_ENERGETIQUE: AUDITEUR,
  DIAGNOSTIQUEUR: DIAGNOSTIQUEUR,
  SYNDIC: SYNDIC,
  BUREAU_ETUDES_THERMIQUE: BUREAU_ETUDES,
  AGENCE_IMMOBILIERE: AGENCE,
  PRO_GENERAL: PRO_GENERAL,
};

/**
 * Retourne le bundle dashboard mocké pour un profil donné.
 *
 * À substituer par un fetcher serveur quand la DB exposera ces métriques :
 * ```ts
 * async function getProDashboardData(profile, orgId): Promise<ProDashboardData>
 * ```
 */
export function getMockDashboardForProfile(
  profile: ProfessionalProfile,
): ProDashboardData {
  return DASHBOARDS[profile];
}
