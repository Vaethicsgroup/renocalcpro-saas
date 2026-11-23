# RENOCALCPRO — Stratégie de pricing

> Document de travail. Date de rédaction : 23 novembre 2026.
> Toutes les sources externes citées ont été consultées entre le 20 et le 23 novembre 2026.
> Les chiffres marqués « non public » ou « estimation » ne sont pas fabriqués : ils correspondent à des données réellement indisponibles ou à des hypothèses de modélisation explicitement signalées.

---

## 1. Résumé exécutif

- **Modèle recommandé** : abonnement SaaS par société (pas par siège) avec paliers de volumétrie DPE/audits, assorti d'un **essai gratuit 14 jours** (pas de freemium perpétuel, pour éviter l'érosion de valeur perçue sur un marché où les concurrents dominants pratiquent 100–200 € HT/mois).
- **Trois offres** : **Essentiel 49 € HT/mois** (indépendant, 10 projets/mois), **Professionnel 149 € HT/mois** (cabinet, 50 projets/mois, 5 utilisateurs), **Entreprise 349 € HT/mois** (BE / grand compte, projets illimités, SSO, API).
- **Annuel −17 %** (2 mois offerts) → 490 € / 1 490 € / 3 490 € HT/an. Prix psychologiques terminant en 9 pour l'entrée, arrondis premium (3 490) pour le haut de gamme.
- **Positionnement** : milieu de marché vs Liciel / Pléiades (perpétuel 1 000–3 500 € HT) et vs CAP RENOV+ (132–165 € HT/an entrée de gamme). RENOCALCPRO joue la carte « SaaS moderne, aides intégrées, PDF prêt-client » sans la lourdeur d'un logiciel métier historique.
- **Objectif année 2** : 300–500 comptes payants, MRR 45–75 k€, marge brute ≥ 80 %.

---

## 2. Benchmark concurrentiel

### 2.1 Tableau synthétique

| # | Concurrent | URL | Modèle | Prix public (HT) | Cible | Points forts | Faiblesses |
|---|---|---|---|---|---|---|---|
| 1 | **Liciel Diagnostics** | liciel.fr | Abonnement mensuel + engagement 24 mois, modules à la carte | **Non public** (fourchette tiers : 120–200 €/mois ; 60–180 €/mois selon modules) | Diagnostiqueurs immobiliers | Couverture complète (DPE, amiante, plomb, électricité…), base installée leader | Prix non affichés, engagement long, UX historique |
| 2 | **Pléiades (Izuba Energies)** | izuba.fr | **Licence perpétuelle** + maintenance annuelle | Base 400 € + DPE/audit logement 500 € HT (initial), maintenance 128 € + 160 €/an. Module RT Existant + 3CL 600 € HT initial / 192 €/an | BE thermiques, bureaux techniques | Validé CSTB, STD, RE2020, ACV | Pas SaaS, courbe d'apprentissage, monoposte |
| 3 | **Perrenoud (DPEWIN / BAO Evolution)** | logicielsperrenoud.com | Licence perpétuelle multiposte | DPEWIN V5 : 1 190 € HT / 5 postes. BAO Evolution : 590 € HT (MI) à 1 690 € HT (MI+collectif+tertiaire) | Diagnostiqueurs, auditeurs | Référence historique du métier | Pas SaaS, UI datée |
| 4 | **ClimaWin (BBS Slama)** | bbs-logiciels.com | Mixte : abonnement ou achat définitif | Abonnement ~108 € HT/an ou achat ~300 € HT (1 utilisateur) — à confirmer, extraction peu fiable | BE, auditeurs | Audit réglementaire 3CL, RE2020, SED | Tarifs peu lisibles publiquement |
| 5 | **CAP RENOV+ (PIA Production / CAPEB)** | cap-renov.fr | Abonnement annuel | **90 € HT/an** (base utilisateur), **module audit réglementaire 290 € HT/an** (réservé RGE Études). Tarif CAPEB : **132 € HT/an** adhérent / **165 € HT/an** non adhérent | Artisans RGE, EcoArtisan | Très bon marché, essai 30 jours, offline | Audit non réglementaire sur l'entrée de gamme, UI simple |
| 6 | **DiagPilote** | diag-pilote.com | SaaS mensuel modulaire | À partir de **29,99 € TTC/mois** (base administrative) | Diagnostiqueurs TPE | Entry price agressif, SaaS natif | Modules terrain / DPE en add-on |
| 7 | **Diagnostix** | btpintelligent.fr/outils/diagnostix | SaaS mensuel | **29–79 €/mois** (une source) ou **80–150 €/mois** (autre source) — contradictoire | Diagnostiqueurs | Positionnement low cost | Tarifs incohérents selon sources |
| 8 | **IZYBAT DPE** | via comparatifs | SaaS mensuel | **39–59 €/mois** | Diagnostiqueurs MI | Prix bas | Fonctionnalités limitées |
| 9 | **DS8** | éditeur spécialisé | **Pay-per-report** + abonnement optionnel | **95 € HT / 100 crédits** (1 licence incluse) ; abonnement à partir de 89 € HT/mois (2 postes) | Diagnostiqueurs volumétrie variable | Modèle à la conso | Peu connu, moins intégré |
| 10 | **EasyC2E** | easyc2e.com | SaaS / simulateur CEE | **Simulateur gratuit** + espace pro (devis) | Installateurs RGE, collectivités | Catalogue 174 fiches CEE à jour (vA82.5) | Pas un outil d'audit DPE |
| 11 | **Hemea (ex-Travauxlib)** | hemea.com/fr/pro | SaaS devis/facturation BTP (pas audit) | **59 / 99 / 199 € HT/mois** (Essentiel / Pro / Expert), −25 % en annuel | Artisans BTP | UX moderne, licences illimitées | **Pas un outil d'audit** : concurrent indirect |
| 12 | **ScanReno** | lespepitestech.com/node/34587 | CRM rénovation | Non public | Artisans RGE, courtiers, syndics | CRM dédié RGE | Pas de moteur DPE/audit |
| 13 | **MaRenoGlobale** | — | **Aucune information publique trouvée** lors de la recherche du 23/11/2026 | — | — | — | — |
| 14 | **Simul'Aides** | — | Terme générique utilisé par plusieurs simulateurs ; **pas d'éditeur unique identifié** | — | — | — | — |
| 15 | **OSER / Enertech / DOCpro / Reznov / Perl / Climaxion / CalcDPE** | — | **Aucune page tarifaire identifiée** lors des recherches. Noms non confirmés comme éditeurs SaaS actifs en France à cette date | — | — | — | Signalé honnêtement : à re-vérifier (orthographe, marque, pivot) |

### 2.2 Lecture stratégique

- **Les éditeurs historiques (Liciel, Pléiades, Perrenoud, ClimaWin) ne publient pas leurs tarifs**, ou les publient partiellement. C'est une faiblesse exploitable par un SaaS moderne qui affiche ses prix.
- **Deux segments de prix** existent clairement : (a) low cost pur diagnostiqueur (30–80 € HT/mois : DiagPilote, Diagnostix, IZYBAT), (b) métier complet 100–200 € HT/mois (Liciel, Pléiades annualisé).
- **Zone blanche** sur le milieu : pas d'acteur SaaS pur affichant 49 / 149 / 349 avec intégration aides (MaPrimeRénov' + CEE) + PDF client + scénarios de rénovation. CAP RENOV+ en entrée de gamme est très agressif à 90–165 € HT/an mais limite l'audit réglementaire à un module payant RGE Études.
- **Changements récents** : pivot de méthode 3CL-DPE 2021 → moteur DPE 2025.11.1.0 au 1er janvier 2026 (coefficient EP électricité 1,9 vs 2,3) ; cycle de renouvellement logiciel probablement élevé.

### 2.3 Sources concurrents

- Liciel : <https://www.liciel.fr/abonnement.html> et comparatif DiagFrance 2026 — tarifs non affichés.
- Pléiades/Izuba : <https://www.izuba.fr/logiciels/tarifs-2/>
- Perrenoud : <https://logicielsperrenoud.com/product/dpewin-v5-dpe-audits-energetiques-reglementaires/> et PDF BAO Evolution.
- ClimaWin : <https://www.bbs-logiciels.com/tarifs/climawin/>
- CAP RENOV+ : <https://www.cap-renov.fr/tarifs.html> et <https://www.capeb.fr/service/cap-renov-outil-d-audit-reglementaire-rge>
- DiagPilote : <https://www.diag-pilote.com/>
- Diagnostix : <https://btpintelligent.fr/outils/diagnostix/>
- Comparatif Argile : <https://www.argile.ai/blog/logiciels-de-calcul-dpe-comparatif-des-solutions-du-marche>
- Hellio (contexte éditorial) : <https://pro.hellio.com/blog/conseils/logiciel-dpe>
- Comparatif DiagFrance : <https://www.diagfrance.com/logiciel-dpe-comparatif>
- fraimenbon : <https://www.fraimenbon.fr/actualite/logiciel-dpe/>
- Hemea : <https://www.hemea.com/fr/pro/services/logiciel-devis>

---

## 3. Analyse du marché français

### 3.1 Taille et volumétrie

| Indicateur | Valeur | Source / date |
|---|---|---|
| DPE réalisés / trimestre | **763 939 DPE au T2 2024** (dont 8,7 % neuf) | Baromètre FNAIM/RAPPEL T2 2024 |
| DPE cumulés depuis juillet 2021 | ~**16 M** (au 11 nov. 2026, source tiers MonsieurDPE) ou ~14,8 M (Argile) | Observatoire DPE-Audit ADEME |
| Audits énergétiques / mois | **~10 000** (ordre de grandeur) | IRILUS Formation (source secondaire) |
| Diagnostiqueurs immobiliers certifiés | **~11 500** (rapport Causse, juillet 2025) | Rapport parlementaire L. Causse |
| Diagnostiqueurs habilités audits énergétiques | **3 462 au 16/12/2024 → 2 924 au 07/01/2025** (-15 % en 3 semaines) | Rapport Causse |
| Bureaux d'études qualifiés OPQIBI 1911 (MI) | ~**1 000 structures** (2024) | smartformation.eu (source tiers) |
| Bureaux d'études qualifiés OPQIBI 1905 (tertiaire/collectif) | ~**800 structures** | cee.fr (source tiers) |
| Transactions immobilières anciennes | **780 000 (sept. 2023–sept. 2024) → 921 000 (2025)** | Rapport Causse |

> **Honnêteté** : je n'ai pas trouvé de total annuel officiel 2024 des DPE sur une source ADEME unique. Les chiffres cumulés divergent selon les agrégateurs (14,8 M vs 16 M). L'open data DPE-Audit de l'ADEME permet un recomptage exact, non effectué ici.

### 3.2 Cadre réglementaire (impact demande)

- **Audit énergétique obligatoire à la vente** : maisons individuelles et immeubles en monopropriété classés F/G depuis avril 2023, extension E au 1er janvier 2025 (décret n° 2022-780 du 4 mai 2022).
- **Interdictions location** : G interdits à la location depuis 2025 ; F prévus 2028 ; E prévus 2034 (loi Climat et Résilience 2021).
- **DPE opposable** depuis juillet 2021 : alourdit la responsabilité des diagnostiqueurs → pression qualité et outils.
- **Moteur DPE 2025.11.1.0** (coefficient EP électricité 1,9 vs 2,3) au 1er janvier 2026 → cycle de refonte logicielle qui crée une fenêtre d'acquisition.
- **RE2020** : neuf, étendue en 2026 à 13 typologies tertiaires/industrielles (décret n° 2026-16 du 15 janvier 2026, cité par vendeur — à confirmer sur Légifrance).
- **Décret tertiaire** : réduction progressive des conso tertiaire → demande d'audits et de plans d'action.

### 3.3 Budget outils des auditeurs

- Fourchette observée : **600 € à 3 500 € HT/an** tous modèles confondus (perpétuel annualisé + maintenance, ou abonnement SaaS).
- 73 % des diagnostiqueurs ont subi une chute de CA 2023-2024 (rapport Causse) → **sensibilité prix élevée** sur les indépendants.
- Taux de pénétration des outils numériques métier : **de facto 100 %** sur diagnostiqueurs certifiés (logiciel validé DHUP obligatoire pour éditer un DPE). Le combat se joue sur le choix, pas sur la pénétration.

### 3.4 Sources marché

- Rapport Causse : <https://infodiag.fr/wp-content/uploads/2025/07/Diagnostiqueur-Immobilier-Rapport-Causse.pdf>
- Baromètre DPE FNAIM T2 2024 : <https://www.precarite-energie.org/wp-content/uploads/2024/08/fnaim-barometre-des-dpe-juillet-2024.pdf>
- Statistiques parc : <https://www.statistiques.developpement-durable.gouv.fr/le-parc-de-logements-par-classe-de-performance-energetique-au-1er-janvier-2024>
- IRILUS 10 000 audits/mois : <https://www.irilus-formation.fr/10-000-audits-energetiques-par-mois-les-statistiques-de-lademe/>
- OPQIBI : <https://www.opqibi.com/page/les-dispositifs-de-qualification-opqibi-relatifs-aux-audits-energetiques>
- Audit obligatoire : <https://francedpe.com/audit-energetique-obligatoire-2026-differences-dpe/>

---

## 4. Personae et willingness-to-pay

### 4.1 Persona A — Auditeur indépendant (1-5 projets/mois)

- **Profil** : artisan RGE ou diagnostiqueur solo, CA 40-80 k€/an, pas d'équipe tech.
- **Besoins** : DPE conforme, audit réglementaire simple, calcul MaPrimeRénov' + CEE, PDF propre à remettre au client.
- **Douleurs** : Liciel/Pléiades perçus comme chers et lourds ; calcul manuel des aides chronophage ; peur de l'obsolescence réglementaire.
- **Prix psychologique max** : **~60 € HT/mois** (720 €/an) — au-dessus, bascule sur CAP RENOV+ à 132–165 €/an ou renonce.
- **Objection principale** : « je fais 2 audits/mois, ça me revient à 30 €/audit juste pour l'outil ».

### 4.2 Persona B — Cabinet (10-30 projets/mois)

- **Profil** : TPE de 2-5 auditeurs ou diagnostiqueurs, CA 150-400 k€/an.
- **Besoins** : multi-utilisateur, suivi projets, PDF cobrandé, templates de scénarios, export devis artisan.
- **Douleurs** : Excel partagés, cohérence des rapports entre collaborateurs, suivi commercial faible.
- **Prix psychologique max** : **~200 € HT/mois** par société (2 400 €/an) tous utilisateurs inclus.
- **Objection principale** : « chaque siège supplémentaire me coûte ».

### 4.3 Persona C — Bureau d'études (50+ projets/mois)

- **Profil** : BE OPQIBI 1911 ou 1905, 5-20 ETP, CA 500 k€-3 M€.
- **Besoins** : volumétrie élevée, API / import en masse, audit tertiaire décret tertiaire, STD partielle, intégration SI interne, support dédié.
- **Douleurs** : licences monopostes Pléiades/Perrenoud, pas de cloud, pas d'API, pas de collaboration.
- **Prix psychologique max** : **~400–500 € HT/mois** par société (5-6 k€/an), si l'API et le SSO sont là.
- **Objection principale** : « je dois pouvoir intégrer à mon SI et exporter en masse ».

### 4.4 Persona D — Grand compte / collectivité multi-utilisateurs

- **Profil** : syndic national, bailleur social, DSP de collectivité, groupement artisan régional (CAPEB/FFB).
- **Besoins** : SSO, multi-agence, reporting consolidé, hébergement France/souverain, marque blanche éventuelle, conformité RGPD renforcée.
- **Douleurs** : aucun outil SaaS n'adresse clairement la collectivité ; marchés publics exigeants.
- **Prix psychologique max** : **sur devis, ordre de grandeur 10–30 k€ HT/an** selon volumétrie, avec formation incluse.
- **Objection principale** : « gestion des accès, sécurité et hébergement souverain ».

---

## 5. Modèles économiques possibles

| Modèle | Avantages | Inconvénients | Ajusté à RENOCALCPRO ? |
|---|---|---|---|
| **Freemium + pay-per-report** | Acquisition virale, barrière zéro | Dévalue la perception, cannibalise le payant, support coûteux sur gratuits | Non (sauf simulateur public d'aides en lead magnet) |
| **Abonnement mensuel/annuel par siège** | Scalabilité, standard SaaS B2B | Freine les cabinets, complexe à facturer | Partiellement — réservé à l'offre Entreprise |
| **Abonnement illimité par société** | Simple à vendre, pas de friction interne | Risque d'usage très élevé sans revenu marginal | Oui en haut de gamme |
| **Hybride (seats + consommation)** | Capte la valeur réelle, flexible | Imprévisible pour le client | Non (complexité commerciale) |
| **Facturation volumétrie DPE / rapport** | Aligne coût et valeur | Instable, cannibalise l'abonnement | Oui comme add-on overage uniquement |

### Recommandation

**Abonnement par société avec paliers de volumétrie et d'utilisateurs**, trial 14 jours, pas de freemium perpétuel. Overage au rapport uniquement sur Essentiel et Professionnel si dépassement, pour éviter le downgrade abusif.

---

## 6. Grille tarifaire recommandée

### 6.1 Tableau

| Caractéristique | **Essentiel** | **Professionnel** | **Entreprise** |
|---|---|---|---|
| **Prix mensuel HT** | **49 €** | **149 €** | **349 €** |
| **Prix annuel HT (−17 %)** | **490 €** | **1 490 €** | **3 490 €** |
| **Prix mensuel équivalent annuel** | 40,83 € | 124,16 € | 290,83 € |
| **Utilisateurs** | 1 | 5 | Illimité |
| **Projets/mois** | 10 (puis 5 €/rapport overage) | 50 (puis 3 €/rapport overage) | Illimité |
| **DPE 3CL moteur 2025** | ✅ | ✅ | ✅ |
| **Audit énergétique réglementaire** | — | ✅ | ✅ |
| **Scénarios de rénovation** | 1 par projet | 3 par projet | Illimités |
| **Aides MaPrimeRénov' + CEE** | ✅ | ✅ | ✅ |
| **PDF client cobrandé** | Logo | Logo + couleurs | Marque blanche |
| **Export devis artisan** | — | ✅ | ✅ |
| **API** | — | — | ✅ |
| **SSO** | — | — | ✅ |
| **Support** | Email J+2 | Email J+1 + chat | Prioritaire + CSM dédié |
| **Formation** | Centre d'aide | Onboarding 1h offert | 1 journée sur site |
| **Engagement** | Mensuel résiliable | Mensuel ou annuel | Annuel |

### 6.2 Add-ons (hors forfait)

- **Rapport supplémentaire** : 5 € (Essentiel) / 3 € (Pro)
- **API seule (sans upgrade Entreprise)** : 99 € HT/mois
- **Marque blanche totale (domaine custom)** : 199 € HT/mois
- **Formation sur site** : 1 490 € HT/journée
- **Collectivité / grand compte** : sur devis à partir de 10 000 € HT/an

### 6.3 Justification des prix

- **49 € HT/mois** : sous le seuil psychologique des 50 €, se compare favorablement aux 59 € d'Hemea et aux 60 € plancher des logiciels diagnostic. Au-dessus de CAP RENOV+ (≈11–14 €/mois) mais avec aides intégrées, SaaS cloud, PDF client → écart justifié.
- **149 € HT/mois** : milieu des 120–200 € HT/mois Liciel estimés par les comparateurs. Prix d'ancrage usuel SaaS B2B français (99 € = Hemea Pro, 149–199 € = milieu de marché).
- **349 € HT/mois** : rond premium, 2,3× le Pro (ratio standard SaaS). Reste sous la barrière des 500 € qui déclenche un cycle d'achat budgétisé/marchés publics.
- **CAC cible** : SEO 80-150 € par compte, SEA 250-400 €, LinkedIn 400-700 €, salons 600-1 500 €. **LTV cible ≥ 3× CAC** → avec 149 € × 24 mois × 80 % marge ≈ 2 860 € LTV, CAC max 950 €. Marge confortable.

---

## 7. Analyse financière — projections 12/24 mois

### 7.1 Hypothèses de conversion

| Étape | Prudent | Médian | Optimiste |
|---|---|---|---|
| Visites uniques / mois (steady M12) | 3 000 | 8 000 | 20 000 |
| Taux inscription trial | 3 % | 5 % | 7 % |
| Taux conversion trial → payant | 15 % | 25 % | 35 % |
| **Nouveaux clients / mois M12** | **~14** | **~100** | **~490** |
| Churn mensuel | 5 % | 3 % | 2 % |

### 7.2 Répartition tarifaire supposée

- Essentiel 60 % · Professionnel 30 % · Entreprise 10 %
- ARPU moyen pondéré = 0,6·49 + 0,3·149 + 0,1·349 = **~109 € HT/mois**

### 7.3 Projections MRR / ARR

| Scénario | Clients fin M12 | MRR fin M12 | ARR fin M12 | Clients fin M24 | MRR fin M24 | ARR fin M24 |
|---|---|---|---|---|---|---|
| Prudent | ~130 | ~14 k€ | ~170 k€ | ~280 | ~30 k€ | ~370 k€ |
| **Médian** | **~750** | **~82 k€** | **~980 k€** | **~1 900** | **~207 k€** | **~2,5 M€** |
| Optimiste | ~2 800 | ~305 k€ | ~3,7 M€ | ~7 500 | ~820 k€ | ~9,8 M€ |

> Ces chiffres sont des **projections de modélisation**, pas des engagements. Elles dépendent entièrement de l'efficacité du canal d'acquisition et du churn réel.

### 7.4 CAC estimé par canal (hypothèses de modélisation)

| Canal | CAC estimé | Volume plausible (M12) |
|---|---|---|
| SEO (contenu + comparatifs) | 80–150 € | 30–40 % du mix |
| SEA Google (mots-clés DPE, audit) | 250–400 € | 20–25 % |
| LinkedIn Ads (BE, syndics) | 400–700 € | 10–15 % |
| Salons (Be Positive, Interclima, SIDO) | 600–1 500 € | 10–15 % |
| Partenariats (CAPEB, FFB, OPQIBI) | 50–200 € | 15–20 % |

### 7.5 Point mort opérationnel

Hypothèses de coûts variables par compte payant (ordre de grandeur) :

- Vercel : ~1 €/mois (fonctions serverless, modéré)
- Prisma/Postgres : ~1,5 €/mois
- Stripe : 1,4 % + 0,25 € par transaction ≈ 2 €/mois à 109 € ARPU
- Support email : ~5 €/mois mélangé tiers
- **Coût variable total ≈ 9,5 €/mois/compte** → marge brute ≈ 91 %

Coûts fixes mensuels cibles (année 1) : hébergement base + monitoring + outils (~300 €) + fondateur temps plein + 1 dev + 1 marketing (~15–20 k€ chargé).

**Point mort opérationnel ~165 clients payants** (ARPU 109 €, coûts fixes 18 k€/mois) — atteignable fin M9–M12 en scénario médian.

### 7.6 Marge brute cible année 2

- **≥ 85 % de marge brute** (standard SaaS B2B)
- Objectif ratio « Rule of 40 » : croissance ARR + marge opérationnelle ≥ 40 %.

---

## 8. Prix psychologique et justification

- **Ancre haute** : un audit énergétique facturé au client final 800–1 500 € HT (empruntis.com, 2026). **Un seul audit par mois rentabilise l'offre Professionnel (149 €)** — ROI < 1 mois.
- **Ancre basse** : CAP RENOV+ à 132–165 €/an. On est 3× plus cher mais on inclut aides + SaaS + PDF client + multi-utilisateurs.
- **Ancre concurrentielle milieu** : Liciel/Pléiades 120–200 €/mois non publics → on est **dans la fourchette, mais transparent**. La transparence tarifaire est un argument de vente en soi dans ce marché.
- **Finitions psychologiques** :
  - 49 € et 149 € : « charm pricing » en 9, perçu −10 % du palier supérieur.
  - 349 € : arrondi premium (ni 299 agressif, ni 399 qui casse le ratio x7 vs Essentiel).
  - Annuel −17 % = « 2 mois offerts » : narration plus puissante que « −17 % ».

---

## 9. Roadmap de pricing

### Phase 1 — Launch (M0–M6)

- Offres Essentiel + Professionnel uniquement.
- **Early adopter** : −50 % à vie sur les 100 premiers Essentiel (24,50 € HT/mois) → effet FOMO.
- Pas d'Entreprise commercialisé, mais devis manuel au cas par cas.

### Phase 2 — Scale (M6–M18)

- Introduction officielle de l'**offre Entreprise** avec SSO + API.
- Lancement add-ons : marque blanche, API seule.
- Augmentation progressive tarif Essentiel 49 → 59 € HT/mois pour nouveaux clients (grandfathering des anciens).
- Partenariats CAPEB / FFB / OPQIBI (code promo 10 %).

### Phase 3 — Maturité (M18+)

- **Add-on Formation** (1 490 €/jour) et **pack audit tertiaire** dédié décret tertiaire.
- **Offre Collectivités** (10–30 k€ HT/an) avec marché public type UGAP.
- Hausse coordonnée des 3 offres (+10 à +15 %) lors d'un cycle réglementaire majeur (bascule moteur DPE ou nouveau décret).
- Évaluation d'une offre « Perpétuelle hybride » pour concurrencer Pléiades sur BE historiques.

---

## 10. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| **Élasticité prix forte sur indépendants** (73 % en baisse de CA 2023-2024) | Churn Essentiel élevé | Palier mensuel résiliable, overage plafonné, pause compte 3 mois |
| **Concurrence low cost** (DiagPilote 30 €, IZYBAT 39 €) | Pression sur Essentiel | Différenciation sur aides intégrées + PDF, pas sur prix brut |
| **Concurrence historique agressive sur prix** (Pléiades remises, Liciel promo) | Perte deals BE | Mettre en avant SaaS, API, hébergement France, pas de licence à acheter |
| **Saisonnalité rénovation** (creux hivernal décembre-janvier et été) | Churn saisonnier | Pousser l'annuel, offres gelées fin d'année |
| **Chocs politiques MaPrimeRénov'/CEE** (coups de rabot budgétaires) | Baisse demande audits incitatifs | Diversifier vers audit réglementaire obligatoire (vente) + décret tertiaire |
| **Évolution méthode DPE / moteur** | Refonte coûteuse | Budget R&D 20 % du CA année 1-2 |
| **Dépendance à une plateforme d'acquisition** (SEA Google) | Coût CAC qui dérape | Diversifier : SEO durable, partenariats CAPEB/FFB, événements |
| **Risque DPE opposable / responsabilité** | Risque juridique indirect | CGU claires, journalisation des calculs, export preuve |
| **Nouveau cadre tarifaire réglementaire des diagnostics** (rapport Causse 2025 ouvre la voie) | Compression de la valeur client | Positionner RENOCALCPRO comme outil d'économie de temps, pas comme coût réglementaire |

---

## Annexe — Sources consultées (23 novembre 2026)

**Concurrents / éditeurs** :
- <https://www.liciel.fr/abonnement.html>
- <https://www.izuba.fr/logiciels/tarifs-2/>
- <https://logicielsperrenoud.com/product/dpewin-v5-dpe-audits-energetiques-reglementaires/>
- <https://www.bbs-logiciels.com/tarifs/climawin/>
- <https://www.cap-renov.fr/tarifs.html>
- <https://www.capeb.fr/service/cap-renov-outil-d-audit-reglementaire-rge>
- <https://www.diag-pilote.com/>
- <https://btpintelligent.fr/outils/diagnostix/>
- <https://www.hemea.com/fr/pro/services/logiciel-devis>
- <https://easyc2e.com/maprimenov>

**Comparatifs** :
- <https://www.argile.ai/blog/logiciels-de-calcul-dpe-comparatif-des-solutions-du-marche>
- <https://www.diagfrance.com/logiciel-dpe-comparatif>
- <https://pro.hellio.com/blog/conseils/logiciel-dpe>
- <https://www.fraimenbon.fr/actualite/logiciel-dpe/>
- <https://formation-diagnostiqueur-immobilier.net/logiciel-diagnostic-immobilier-comparatif-des-solutions-2026/>

**Marché et réglementation** :
- <https://infodiag.fr/wp-content/uploads/2025/07/Diagnostiqueur-Immobilier-Rapport-Causse.pdf>
- <https://www.precarite-energie.org/wp-content/uploads/2024/08/fnaim-barometre-des-dpe-juillet-2024.pdf>
- <https://www.statistiques.developpement-durable.gouv.fr/le-parc-de-logements-par-classe-de-performance-energetique-au-1er-janvier-2024>
- <https://www.irilus-formation.fr/10-000-audits-energetiques-par-mois-les-statistiques-de-lademe/>
- <https://www.opqibi.com/page/les-dispositifs-de-qualification-opqibi-relatifs-aux-audits-energetiques>
- <https://francedpe.com/audit-energetique-obligatoire-2026-differences-dpe/>
- <https://www.ecologie.gouv.fr/politiques-publiques/diagnostiqueur-immobilier-profession-reglementee>

**Éléments non trouvés / à investiguer** :
- MaRenoGlobale, Simul'Aides en tant qu'éditeurs SaaS distincts : aucune page tarifaire publique identifiée.
- CalcDPE, Reznov, DOCpro, OSER, Enertech, Perl, Climaxion : absence de résultats pertinents sur recherche directe. À re-vérifier avec orthographe exacte ou pivot éventuel.
- Nombre annuel exact 2024 des DPE et audits (recomptage open data ADEME nécessaire).
