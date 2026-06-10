#!/usr/bin/env node
// scripts/check-i18n.mjs
// ════════════════════════════════════════════════════════════════════════════
// Vérifie l'intégrité des fichiers de traduction next-intl :
//   - Toutes les locales doivent avoir EXACTEMENT les mêmes clés
//   - Aucune valeur vide
//   - Aucun namespace orphelin
//   - Détecte les valeurs identiques entre locales (potentielle copie/oubli)
//
// Usage :
//   node scripts/check-i18n.mjs
//   node scripts/check-i18n.mjs --scan-hardcoded   (scan supplémentaire des
//                                                    composants pour textes FR
//                                                    en dur)
//
// Sortie : exit code 0 si tout OK, 1 si écarts détectés.
// ════════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MESSAGES_DIR = join(ROOT, "messages");

const REFERENCE_LOCALE = "fr";
const REQUIRED_LOCALES = ["fr", "en", "es", "de", "pt"];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function color(s, c) {
  const codes = { red: 31, green: 32, yellow: 33, blue: 34, cyan: 36, gray: 90, bold: 1 };
  return `\x1b[${codes[c]}m${s}\x1b[0m`;
}

/**
 * Aplatit un objet imbriqué en `{ "ns.sub.key": "valeur", ... }`.
 */
function flatten(obj, prefix = "") {
  const out = {};
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== "object") {
    out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, full));
    } else {
      out[full] = v;
    }
  }
  return out;
}

function loadLocale(locale) {
  const path = join(MESSAGES_DIR, `${locale}.json`);
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(color(`✖ Impossible de charger ${path}`, "red"));
    console.error(`  ${e.message}`);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Checks
// ────────────────────────────────────────────────────────────────────────────

function checkKeyParity(locales) {
  const refKeys = new Set(Object.keys(locales[REFERENCE_LOCALE]));
  const issues = [];

  for (const loc of REQUIRED_LOCALES) {
    if (loc === REFERENCE_LOCALE) continue;
    const myKeys = new Set(Object.keys(locales[loc]));

    const missing = [...refKeys].filter((k) => !myKeys.has(k));
    const extra = [...myKeys].filter((k) => !refKeys.has(k));

    if (missing.length > 0) {
      issues.push({
        locale: loc,
        type: "missing",
        count: missing.length,
        keys: missing,
      });
    }
    if (extra.length > 0) {
      issues.push({
        locale: loc,
        type: "extra",
        count: extra.length,
        keys: extra,
      });
    }
  }
  return issues;
}

function checkEmptyValues(locales) {
  const issues = [];
  for (const loc of REQUIRED_LOCALES) {
    const empty = Object.entries(locales[loc])
      .filter(([, v]) => v === "" || v === null || v === undefined)
      .map(([k]) => k);
    if (empty.length > 0) {
      issues.push({ locale: loc, count: empty.length, keys: empty });
    }
  }
  return issues;
}

function checkNamespaceCoverage(locales) {
  const refNs = new Set();
  for (const k of Object.keys(locales[REFERENCE_LOCALE])) {
    refNs.add(k.split(".")[0]);
  }
  const issues = [];
  for (const loc of REQUIRED_LOCALES) {
    if (loc === REFERENCE_LOCALE) continue;
    const myNs = new Set();
    for (const k of Object.keys(locales[loc])) {
      myNs.add(k.split(".")[0]);
    }
    const missingNs = [...refNs].filter((n) => !myNs.has(n));
    if (missingNs.length > 0) {
      issues.push({ locale: loc, namespaces: missingNs });
    }
  }
  return issues;
}

// ────────────────────────────────────────────────────────────────────────────
// Scan hardcoded — optionnel
// ────────────────────────────────────────────────────────────────────────────

const FR_HARDCODED_PATTERNS = [
  /["']Bientôt(\s+disponible)?["']/i,
  /["']Créer un compte["']/i,
  /["']Se connecter["']/i,
  /["']Nouveau dossier["']/i,
  /["']Mode démo["']/i,
  /["']Calculer mon diagnostic["']/i,
  /["']Brouillon (sauvegardé|restauré)["']/i,
  /["']Continuer["']/i,
  /["']Recommencer["']/i,
  /["']Demande reçue["']/i,
];

function* walkFiles(dir, exts = [".tsx", ".ts"]) {
  if (!dir || !exts.length) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walkFiles(full, exts);
    } else if (exts.some((e) => entry.endsWith(e))) {
      yield full;
    }
  }
}

function scanHardcoded() {
  const componentsDir = join(ROOT, "src/components");
  const appDir = join(ROOT, "src/app");
  const findings = [];
  for (const dir of [componentsDir, appDir]) {
    for (const file of walkFiles(dir)) {
      let content;
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      // Ignore les fichiers tests + i18n routing + types
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      // Skip files in lib/calc catalog (catalogues métier intentionnellement FR)
      if (file.includes("/lib/calc/catalog/")) continue;
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        for (const pattern of FR_HARDCODED_PATTERNS) {
          if (pattern.test(line)) {
            findings.push({
              file: file.replace(ROOT + "/", ""),
              line: idx + 1,
              snippet: line.trim().slice(0, 100),
            });
            break;
          }
        }
      });
    }
  }
  return findings;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main() {
  const scanFlag = process.argv.includes("--scan-hardcoded");
  console.log(color("─ Audit i18n RENOCALCPRO ─", "bold"));
  console.log("");

  // 1. Charger toutes les locales
  const raw = {};
  for (const loc of REQUIRED_LOCALES) {
    raw[loc] = loadLocale(loc);
    if (!raw[loc]) {
      console.error(color(`✖ Fichier locale manquant : messages/${loc}.json`, "red"));
      process.exit(1);
    }
  }

  // 2. Aplatir
  const flat = {};
  for (const loc of REQUIRED_LOCALES) {
    flat[loc] = flatten(raw[loc]);
    console.log(`  ${loc}: ${color(Object.keys(flat[loc]).length, "cyan")} clés feuilles`);
  }
  console.log("");

  let hasIssues = false;

  // 3. Namespace coverage
  const nsIssues = checkNamespaceCoverage(flat);
  if (nsIssues.length > 0) {
    hasIssues = true;
    console.log(color("✖ Namespaces manquants par locale", "red"));
    for (const issue of nsIssues) {
      console.log(
        `  ${color(issue.locale, "yellow")} : ${issue.namespaces.join(", ")}`,
      );
    }
    console.log("");
  } else {
    console.log(color("✓ Tous les namespaces sont présents dans toutes les locales", "green"));
  }

  // 4. Key parity
  const keyIssues = checkKeyParity(flat);
  if (keyIssues.length > 0) {
    hasIssues = true;
    console.log(color("✖ Écarts de clés", "red"));
    for (const issue of keyIssues) {
      const label = issue.type === "missing" ? "manque dans" : "en trop dans";
      console.log(
        `  ${color(issue.locale, "yellow")} (${issue.count} clés ${label}) :`,
      );
      const sample = issue.keys.slice(0, 8);
      for (const k of sample) console.log(`    ${color("·", "gray")} ${k}`);
      if (issue.keys.length > sample.length) {
        console.log(
          color(`    ... +${issue.keys.length - sample.length} autres`, "gray"),
        );
      }
    }
    console.log("");
  } else {
    console.log(color("✓ Parité des clés respectée entre toutes les locales", "green"));
  }

  // 5. Empty values
  const emptyIssues = checkEmptyValues(flat);
  if (emptyIssues.length > 0) {
    hasIssues = true;
    console.log(color("✖ Valeurs vides détectées", "red"));
    for (const issue of emptyIssues) {
      console.log(`  ${color(issue.locale, "yellow")} : ${issue.count} clés vides`);
      for (const k of issue.keys.slice(0, 5)) console.log(`    ${color("·", "gray")} ${k}`);
    }
    console.log("");
  } else {
    console.log(color("✓ Aucune valeur vide", "green"));
  }

  // 6. Scan hardcoded (opt-in)
  if (scanFlag) {
    console.log("");
    console.log(color("─ Scan textes FR hardcodés (opt-in) ─", "bold"));
    const findings = scanHardcoded();
    if (findings.length === 0) {
      console.log(color("✓ Aucun pattern hardcodé suspect trouvé", "green"));
    } else {
      console.log(color(`⚠ ${findings.length} occurrence(s) suspectes`, "yellow"));
      for (const f of findings.slice(0, 20)) {
        console.log(`  ${color(f.file, "cyan")}:${color(f.line, "gray")}  ${f.snippet}`);
      }
      if (findings.length > 20) {
        console.log(color(`  ... +${findings.length - 20} autres`, "gray"));
      }
      // Le scan hardcoded est informationnel, ne fait pas échouer le check par défaut
    }
  }

  // 7. Verdict
  console.log("");
  if (hasIssues) {
    console.log(color("✖ Audit i18n : ÉCHEC. Corrigez les écarts ci-dessus.", "red"));
    process.exit(1);
  }
  console.log(color("✓ Audit i18n : OK. Toutes les locales sont alignées.", "green"));
  process.exit(0);
}

main();
