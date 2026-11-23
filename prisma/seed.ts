// prisma/seed.ts
// Point d'entrée `npx prisma db seed` (référencé dans package.json → scripts.db:seed).
// Idempotent : peut se relancer sans doubler les données.
//
// Ce que ça fait :
//   1. seed-features → matrice plan × feature (via ./seed-features)
//   2. seed-demo optionnel (activé par DEMO_MODE=true ou --demo)
//
// En Vercel Preview (DEMO_MODE=true) on veut les comptes / projets démo.
// En prod ou dev normal on veut UNIQUEMENT seed-features.

import "./seed-features";

const wantDemo = process.env.DEMO_MODE === "true" || process.argv.includes("--demo");

if (wantDemo) {
  // Import dynamique pour éviter d'exécuter le seed démo par accident en prod.
  // Le fichier n'existe pas encore — sera créé dans une session ultérieure
  // dédiée aux comptes/projets de démo (nécessite de connaître le schéma User
  // + Project + Membership au niveau bcrypt/argon + orgId multi-tenant).
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./seed-demo");
    // eslint-disable-next-line no-console
    console.log("[seed] seed-demo appliqué (DEMO_MODE actif)");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("[seed] seed-demo non trouvé — skip. Créer prisma/seed-demo.ts pour peupler des comptes de démonstration.");
  }
} else {
  // eslint-disable-next-line no-console
  console.log("[seed] Mode standard : seul seed-features a été appliqué. Set DEMO_MODE=true pour peupler les comptes de démo.");
}
