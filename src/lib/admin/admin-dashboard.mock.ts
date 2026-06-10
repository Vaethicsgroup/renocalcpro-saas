// src/lib/admin/admin-dashboard.mock.ts
// ════════════════════════════════════════════════════════════════════════════
// DONNÉES MOCKÉES — Dashboard admin global.
//
// Alimente le composant `AdminGlobalDashboard` côté `/admin/page.tsx`. Aucune
// requête Prisma — les valeurs sont figées pour la démo MVP. Le `mockNotice`
// affiché dans l'UI le rappelle explicitement.
//
// Pour brancher des données réelles, créer un fetcher serveur qui retourne
// le même `AdminGlobalData`. L'UI restera identique.
// ════════════════════════════════════════════════════════════════════════════

export interface AdminKpi {
  key: string;
  /** Clé i18n du label (namespace `adminDashboardMock`). */
  labelKey: string;
  value: string;
  delta?: string;
  positive?: boolean;
  /** Clé i18n optionnelle du caption. */
  captionKey?: string;
  /** Icône lucide-react mappée côté composant. */
  icon:
    | "Users"
    | "Building2"
    | "Briefcase"
    | "ClipboardCheck"
    | "FileText"
    | "Activity"
    | "Crown"
    | "Sparkles"
    | "AlertTriangle"
    | "Gauge"
    | "CreditCard"
    | "Coins";
  tone: "forest" | "info" | "amber" | "terracotta" | "success" | "stone";
}

export interface AdminListItem {
  key: string;
  /** Clé i18n du label principal. */
  labelKey: string;
  /** Clé i18n optionnelle du sous-libellé (date, type, statut). */
  metaKey?: string;
  /** Compteur ou valeur affichée à droite (code/numérique, non traduit). */
  value?: string;
  /** Clé i18n optionnelle pour les valeurs textuelles (e.g. "Risque 2028"). */
  valueKey?: string;
  /** Lien interne — null si non disponible (bouton désactivé). */
  href?: string | null;
}

export interface AdminAlert {
  key: string;
  level: "info" | "warning" | "danger" | "success";
  /** Clé i18n du titre. */
  titleKey: string;
  /** Clé i18n de la description. */
  descriptionKey: string;
  href?: string | null;
}

export interface AdminQuickAction {
  key: string;
  /** Clé i18n du label. */
  labelKey: string;
  href: string | null;
  icon:
    | "Users"
    | "Building2"
    | "Briefcase"
    | "ClipboardCheck"
    | "FileText"
    | "CreditCard"
    | "FolderOpen"
    | "Download"
    | "Settings"
    | "Activity";
  available: boolean;
}

/** Bundle complet de données admin. */
export interface AdminGlobalData {
  /** Clé i18n du bandeau « démo / mocké ». */
  mockNoticeKey: string;
  /** A. KPIs Vue globale plateforme. */
  globalKpis: AdminKpi[];
  /** B. Particuliers. */
  particuliers: {
    kpis: AdminKpi[];
    latestSignups: AdminListItem[];
  };
  /** C. Professionnels par type. */
  professionnels: {
    kpis: AdminKpi[];
    byType: AdminListItem[];
    toVerify: AdminListItem[];
  };
  /** D. Supervision projets / diagnostics. */
  supervision: {
    kpis: AdminKpi[];
    recentProjects: AdminListItem[];
    recentDiagnostics: AdminListItem[];
  };
  /** E. Billing & quotas. */
  billing: {
    distribution: AdminListItem[];
    nearLimit: AdminListItem[];
    upgrades: AdminListItem[];
  };
  /** F. Alertes système / opérationnelles. */
  alerts: AdminAlert[];
  /** G. Actions rapides. */
  quickActions: AdminQuickAction[];
}

export const ADMIN_GLOBAL_MOCK: AdminGlobalData = {
  mockNoticeKey: "mockNotice",

  // A. Vue globale plateforme ─────────────────────────────────────────────
  globalKpis: [
    { key: "users_total", labelKey: "gk_users_total_label", value: "8 124", delta: "+12 %", positive: true, captionKey: "gk_users_total_caption", icon: "Users", tone: "forest" },
    { key: "users_part", labelKey: "gk_users_part_label", value: "4 820", delta: "+9 %", positive: true, captionKey: "gk_users_part_caption", icon: "Users", tone: "info" },
    { key: "users_pro", labelKey: "gk_users_pro_label", value: "3 304", delta: "+16 %", positive: true, captionKey: "gk_users_pro_caption", icon: "Briefcase", tone: "forest" },
    { key: "orgs", labelKey: "gk_orgs_label", value: "612", delta: "+8", positive: true, captionKey: "gk_orgs_caption", icon: "Building2", tone: "amber" },
    { key: "projects", labelKey: "gk_projects_label", value: "12 847", delta: "+342", positive: true, captionKey: "gk_projects_caption", icon: "ClipboardCheck", tone: "forest" },
    { key: "diagnostics", labelKey: "gk_diagnostics_label", value: "9 211", delta: "+218", positive: true, captionKey: "gk_diagnostics_caption", icon: "Gauge", tone: "info" },
    { key: "reports", labelKey: "gk_reports_label", value: "4 086", delta: "+89", positive: true, captionKey: "gk_reports_caption", icon: "FileText", tone: "stone" },
    { key: "active_subs", labelKey: "gk_active_subs_label", value: "612", captionKey: "gk_active_subs_caption", icon: "Crown", tone: "success" },
  ],

  // B. Gestion particuliers ──────────────────────────────────────────────
  particuliers: {
    kpis: [
      { key: "p_total", labelKey: "pk_p_total_label", value: "4 820", icon: "Users", tone: "info" },
      { key: "p_actifs", labelKey: "pk_p_actifs_label", value: "1 240", captionKey: "pk_p_actifs_caption", icon: "ClipboardCheck", tone: "forest" },
      { key: "p_quota", labelKey: "pk_p_quota_label", value: "47", captionKey: "pk_p_quota_caption", icon: "AlertTriangle", tone: "amber" },
      { key: "p_no_diag", labelKey: "pk_p_no_diag_label", value: "318", captionKey: "pk_p_no_diag_caption", icon: "Gauge", tone: "stone" },
      { key: "p_docs", labelKey: "pk_p_docs_label", value: "6 412", captionKey: "pk_p_docs_caption", icon: "FileText", tone: "stone" },
    ],
    latestSignups: [
      { key: "s1", labelKey: "ls_s1_label", metaKey: "ls_s1_meta", value: "FREE", href: null },
      { key: "s2", labelKey: "ls_s2_label", metaKey: "ls_s2_meta", value: "FREE", href: null },
      { key: "s3", labelKey: "ls_s3_label", metaKey: "ls_s3_meta", valueKey: "ls_s3_value_pro_trial", href: null },
      { key: "s4", labelKey: "ls_s4_label", metaKey: "ls_s4_meta", value: "FREE", href: null },
      { key: "s5", labelKey: "ls_s5_label", metaKey: "ls_s5_meta", value: "FREE", href: null },
    ],
  },

  // C. Gestion professionnels ────────────────────────────────────────────
  professionnels: {
    kpis: [
      { key: "pro_total", labelKey: "prk_pro_total_label", value: "3 304", delta: "+218", positive: true, captionKey: "prk_pro_total_caption", icon: "Briefcase", tone: "forest" },
      { key: "pro_orgs", labelKey: "prk_pro_orgs_label", value: "612", captionKey: "prk_pro_orgs_caption", icon: "Building2", tone: "amber" },
      { key: "pro_pending", labelKey: "prk_pro_pending_label", value: "23", captionKey: "prk_pro_pending_caption", icon: "AlertTriangle", tone: "terracotta" },
      { key: "pro_dossiers", labelKey: "prk_pro_dossiers_label", value: "1 042", icon: "ClipboardCheck", tone: "info" },
    ],
    byType: [
      { key: "auditeurs", labelKey: "bt_auditeurs_label", value: "1 890", metaKey: "bt_auditeurs_meta" },
      { key: "diagnostiqueurs", labelKey: "bt_diagnostiqueurs_label", value: "720", metaKey: "bt_diagnostiqueurs_meta" },
      { key: "bureaux_etudes", labelKey: "bt_bureaux_etudes_label", value: "284", metaKey: "bt_bureaux_etudes_meta" },
      { key: "agences", labelKey: "bt_agences_label", value: "238", metaKey: "bt_agences_meta" },
      { key: "syndics", labelKey: "bt_syndics_label", value: "172", metaKey: "bt_syndics_meta" },
    ],
    toVerify: [
      { key: "v1", labelKey: "tv_v1_label", value: "12", metaKey: "tv_v1_meta" },
      { key: "v2", labelKey: "tv_v2_label", value: "7", metaKey: "tv_v2_meta" },
      { key: "v3", labelKey: "tv_v3_label", value: "4", metaKey: "tv_v3_meta" },
    ],
  },

  // D. Supervision projets / diagnostics ────────────────────────────────
  supervision: {
    kpis: [
      { key: "dpe_moy", labelKey: "sk_dpe_moy_label", value: "D", captionKey: "sk_dpe_moy_caption", icon: "Gauge", tone: "amber" },
      { key: "passoires_fg", labelKey: "sk_passoires_fg_label", value: "1 824", captionKey: "sk_passoires_fg_caption", icon: "AlertTriangle", tone: "terracotta" },
      { key: "scenarios_recos", labelKey: "sk_scenarios_recos_label", value: "8 411", captionKey: "sk_scenarios_recos_caption", icon: "Sparkles", tone: "forest" },
      { key: "projects_incomplets", labelKey: "sk_projects_incomplets_label", value: "612", captionKey: "sk_projects_incomplets_caption", icon: "Activity", tone: "stone" },
    ],
    recentProjects: [
      { key: "rp1", labelKey: "rp_rp1_label", metaKey: "rp_rp1_meta", value: "DPE G → B" },
      { key: "rp2", labelKey: "rp_rp2_label", metaKey: "rp_rp2_meta", valueKey: "rp_rp2_value_pppt" },
      { key: "rp3", labelKey: "rp_rp3_label", metaKey: "rp_rp3_meta", value: "DPE F" },
      { key: "rp4", labelKey: "rp_rp4_label", metaKey: "rp_rp4_meta", value: "DEET" },
      { key: "rp5", labelKey: "rp_rp5_label", metaKey: "rp_rp5_meta", valueKey: "rp_rp5_value_risk_2028" },
    ],
    recentDiagnostics: [
      { key: "rd1", labelKey: "rd_rd1_label", metaKey: "rd_rd1_meta", value: "G → B" },
      { key: "rd2", labelKey: "rd_rd2_label", metaKey: "rd_rd2_meta", value: "F → C" },
      { key: "rd3", labelKey: "rd_rd3_label", metaKey: "rd_rd3_meta", value: "E → A" },
    ],
  },

  // E. Billing & quotas ─────────────────────────────────────────────────
  billing: {
    distribution: [
      { key: "free", labelKey: "bd_free_label", value: "7 218", metaKey: "bd_free_meta" },
      { key: "trial", labelKey: "bd_trial_label", value: "94", metaKey: "bd_trial_meta" },
      { key: "pro", labelKey: "bd_pro_label", value: "598", metaKey: "bd_pro_meta" },
      { key: "team", labelKey: "bd_team_label", value: "182", metaKey: "bd_team_meta" },
      { key: "enterprise", labelKey: "bd_enterprise_label", value: "32", metaKey: "bd_enterprise_meta" },
    ],
    nearLimit: [
      { key: "nl1", labelKey: "nl_nl1_label", metaKey: "nl_nl1_meta", valueKey: "nl_nl1_value_upgrade", href: null },
      { key: "nl2", labelKey: "nl_nl2_label", metaKey: "nl_nl2_meta", valueKey: "nl_nl2_value_upgrade", href: null },
      { key: "nl3", labelKey: "nl_nl3_label", metaKey: "nl_nl3_meta", valueKey: "nl_nl3_value_upgrade", href: null },
    ],
    upgrades: [
      { key: "up1", labelKey: "up_up1_label", metaKey: "up_up1_meta" },
      { key: "up2", labelKey: "up_up2_label", metaKey: "up_up2_meta" },
    ],
  },

  // F. Alertes système ─────────────────────────────────────────────────
  alerts: [
    { key: "pdf_off", level: "warning", titleKey: "al_pdf_off_title", descriptionKey: "al_pdf_off_description", href: null },
    { key: "prisma_mig", level: "info", titleKey: "al_prisma_mig_title", descriptionKey: "al_prisma_mig_description", href: null },
    { key: "stripe", level: "info", titleKey: "al_stripe_title", descriptionKey: "al_stripe_description", href: null },
    { key: "tsc", level: "warning", titleKey: "al_tsc_title", descriptionKey: "al_tsc_description", href: null },
    { key: "storage", level: "success", titleKey: "al_storage_title", descriptionKey: "al_storage_description", href: null },
    { key: "mocked", level: "info", titleKey: "al_mocked_title", descriptionKey: "al_mocked_description", href: null },
  ],

  // G. Actions rapides ─────────────────────────────────────────────────
  quickActions: [
    { key: "qa_users", labelKey: "qa_qa_users_label", href: "/admin/users", icon: "Users", available: true },
    { key: "qa_orgs", labelKey: "qa_qa_orgs_label", href: "/admin/organizations", icon: "Building2", available: true },
    { key: "qa_projects", labelKey: "qa_qa_projects_label", href: "/admin/projects", icon: "Briefcase", available: true },
    { key: "qa_subs", labelKey: "qa_qa_subs_label", href: "/admin/subscriptions", icon: "CreditCard", available: true },
    { key: "qa_audit", labelKey: "qa_qa_audit_label", href: "/admin/audit-logs", icon: "Activity", available: true },
    { key: "qa_health", labelKey: "qa_qa_health_label", href: "/admin/health", icon: "Activity", available: true },
    { key: "qa_export", labelKey: "qa_qa_export_label", href: null, icon: "Download", available: false },
    { key: "qa_settings", labelKey: "qa_qa_settings_label", href: "/admin/settings", icon: "Settings", available: true },
  ],
};
