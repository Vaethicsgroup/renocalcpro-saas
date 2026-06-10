// lib/ai/assistant/knowledge/field-help.ts
// Base de connaissance par CHAMP du diagnostic.
// Chaque entrée répond à 3 questions standard :
//   1. "Que dois-je mettre ici ?" (whatToPut)
//   2. "Comment mesurer / reconnaître ?" (howToMeasure)
//   3. "Pourquoi cette information est-elle utile ?" (whyUseful)
// Plus, optionnellement :
//   - commonMistakes : pièges fréquents
//   - whenUnknown   : que faire si on ne sait pas
//   - relatedHelp   : slugs articles centre d'aide
//
// IMPORTANT — l'IA s'appuie d'abord sur cette base FACTUELLE puis enrichit
// avec son raisonnement. Cela évite l'invention pure et garantit traçabilité.

export interface FieldHelp {
  /** Référence du champ : "section.subsection.field" */
  ref: string;
  /** Libellé court (FR) */
  label: string;
  /** Réponse à "que dois-je mettre ici ?" */
  whatToPut: string;
  /** Réponse à "comment mesurer / reconnaître ?" */
  howToMeasure: string;
  /** Réponse à "pourquoi cette information est-elle utile ?" */
  whyUseful: string;
  /** Erreurs fréquentes à éviter */
  commonMistakes?: string[];
  /** Conseil si l'utilisateur ne sait pas */
  whenUnknown?: string;
  /** Slugs d'articles du centre d'aide à proposer */
  relatedHelp?: string[];
  /** Niveau de criticité du champ pour le calcul (low / medium / high) */
  impactOnResult?: "low" | "medium" | "high";
}

export const FIELD_HELP: Record<string, FieldHelp> = {
  // ── PROJECT / IDENTIFICATION ──────────────────────────────────────────────
  "project.address": {
    ref: "project.address",
    label: "Adresse du bâtiment",
    whatToPut: "L'adresse complète du logement audité (numéro, rue, code postal, ville).",
    howToMeasure: "Tapez les premiers caractères, l'autocomplétion BAN propose des résultats officiels. Privilégiez la sélection BAN à la saisie libre.",
    whyUseful: "L'adresse permet de récupérer la zone climatique (H1/H2/H3), l'altitude, l'exposition aux vents, le DJU local. Tout cela influence directement les besoins de chauffage et le confort d'été.",
    commonMistakes: ["Saisir une adresse approximative (ex juste « Lyon »)", "Oublier le numéro de rue"],
    whenUnknown: "Si vous n'avez que le code postal, l'estimation reste possible mais marquée « confiance moyenne ».",
    impactOnResult: "high",
    relatedHelp: ["zone-climatique", "geocodage-ban"],
  },

  "project.buildingType": {
    ref: "project.buildingType",
    label: "Type de bâtiment",
    whatToPut: "Maison individuelle, appartement, immeuble entier, bâtiment tertiaire (bureau / commerce).",
    howToMeasure: "Choix simple : posez-vous la question « combien de logements au total dans le bâtiment et est-ce que je calcule pour un seul ou pour tous ? ».",
    whyUseful: "Les hypothèses de calcul (surface vitrée, ratio toiture/sol, ventilation collective ou individuelle) varient drastiquement entre maison, appartement et tertiaire.",
    commonMistakes: ["Choisir « maison » pour un appartement situé dans un immeuble", "Confondre « immeuble entier » et « copropriété »"],
    impactOnResult: "high",
  },

  "project.constructionYear": {
    ref: "project.constructionYear",
    label: "Année de construction",
    whatToPut: "Année où le bâtiment a été construit (ou achevé). Si plusieurs corps de bâtiment, prenez le plus représentatif en surface.",
    howToMeasure: "Demandez l'acte de propriété, le titre de propriété, le DPE existant, ou consultez la mairie (cadastre). Sinon, observez les matériaux : pierre = avant 1948, parpaing avec charpente bois = 1950-1980, isolation visible en murs = après 1975 (RT 1974).",
    whyUseful: "L'année détermine la réglementation thermique applicable à l'origine (RT 1974, 1988, 2000, 2005, 2012, 2020) et donc l'isolation présumée. Pour le bâti ancien (< 1948), des règles spécifiques s'appliquent (compatibilité matériaux respirants).",
    commonMistakes: ["Mettre l'année de la dernière rénovation au lieu de la construction d'origine"],
    whenUnknown: "Cochez « bâti ancien (avant 1948) » si vous voyez de la pierre apparente, du colombage, du pisé, du torchis, ou du moellon. Sinon estimez par tranche : 1948-1974, 1975-2000, 2001-2012, après 2012.",
    impactOnResult: "high",
    relatedHelp: ["periode-construction", "decret-anciens"],
  },

  "project.surfaceM2": {
    ref: "project.surfaceM2",
    label: "Surface habitable (m²)",
    whatToPut: "La surface habitable au sens de la loi Carrez : surface au sol des pièces d'habitation, hors murs, hors balcons, hors caves, hors combles non aménagés.",
    howToMeasure: "1) Prenez le plan ou faites un relevé pièce par pièce avec un télémètre laser. 2) Pour chaque pièce : longueur × largeur. 3) Excluez les surfaces sous 1,80 m de hauteur sous plafond (combles aménagés). 4) Additionnez tout.",
    whyUseful: "C'est la base de TOUS les ratios kWh/m²/an. Une erreur de 10 % sur la surface décale toute l'étiquette DPE. C'est aussi la base des aides MaPrimeRénov' et de la résolution AG en copropriété.",
    commonMistakes: ["Inclure le garage / cave / grenier", "Oublier d'enlever les murs porteurs", "Confondre surface habitable et surface utile / surface plancher"],
    whenUnknown: "Reportez la surface du DPE existant si disponible, ou de l'acte authentique. À défaut, marquez « estimation » et laissez l'IA calculer un ordre de grandeur depuis le bâti type.",
    impactOnResult: "high",
    relatedHelp: ["mesurer-surface-habitable", "loi-carrez"],
  },

  "project.numberOfLevels": {
    ref: "project.numberOfLevels",
    label: "Nombre de niveaux",
    whatToPut: "Nombre d'étages du bâtiment, en comptant le rez-de-chaussée comme 1.",
    howToMeasure: "Comptez les planchers habitables. Un sous-sol non habité ne compte pas. Des combles aménagés comptent comme un niveau.",
    whyUseful: "Le nombre de niveaux influence la part de toiture et de plancher bas dans les déperditions, et la stratégie de circulation d'air pour la ventilation.",
    impactOnResult: "medium",
  },

  "project.heightUnderCeiling": {
    ref: "project.heightUnderCeiling",
    label: "Hauteur sous plafond (m)",
    whatToPut: "Hauteur moyenne entre le sol fini et le plafond, par étage. En général entre 2,30 m (collectif récent) et 3,20 m (haussmannien).",
    howToMeasure: "Mesurez avec un télémètre laser ou un mètre déroulant, dans la pièce principale. Si plusieurs hauteurs très différentes, donnez la moyenne pondérée par surface.",
    whyUseful: "Détermine le volume chauffé donc le besoin énergétique. 2,50 m vs 3,00 m sur 100 m² = 50 m³ de plus à chauffer.",
    commonMistakes: ["Oublier de retirer l'épaisseur du plancher haut", "Mesurer dans une pièce annexe (couloir) plus basse"],
    impactOnResult: "medium",
  },

  // ── ENVELOPPE / MURS ──────────────────────────────────────────────────────
  "envelope.walls.materialKey": {
    ref: "envelope.walls.materialKey",
    label: "Matériau des murs extérieurs",
    whatToPut: "Le matériau structurel principal des murs extérieurs (pierre, brique, parpaing, béton, ossature bois, pisé, moellons, etc.). Choisissez l'option dominante : si 70 % pierre + 30 % parpaing, prenez « pierre ».",
    howToMeasure: "Observez : 1) Un mur extérieur depuis l'intérieur (gratter doucement l'enduit dans un coin discret si nécessaire). 2) Un mur depuis l'extérieur après écaillage léger d'enduit. 3) Une coupe au niveau d'une fenêtre ouverte (montre l'épaisseur). 4) Tapez avec le poing : son creux = brique creuse / parpaing, son plein = pierre / béton plein.",
    whyUseful: "Le matériau détermine la résistance thermique de base (R), l'inertie (confort d'été), la perméance à la vapeur (risque condensation), et la compatibilité avec une isolation par l'intérieur ou l'extérieur. Pierre + isolation polystyrène intérieure = risque de pathologie.",
    commonMistakes: ["Confondre pierre meulière et moellons calcaires", "Marquer « parpaing » alors qu'il s'agit de brique creuse", "Oublier qu'un bardage cache souvent un autre matériau"],
    whenUnknown: "Utilisez la fonction « Identifier par photo » : prenez 1 photo d'un mur extérieur + 1 photo d'une coupe / d'un défaut visible. Claude Vision propose un top-3. Sinon laissez « inconnu » : l'IA prendra une hypothèse prudente selon période + région.",
    impactOnResult: "high",
    relatedHelp: ["materiaux-bati-initial", "identification-photo", "alertes-hygrothermiques"],
  },

  "envelope.walls.thicknessCm": {
    ref: "envelope.walls.thicknessCm",
    label: "Épaisseur des murs (cm)",
    whatToPut: "Épaisseur totale du mur extérieur, enduits compris. Pour le bâti ancien : 40-80 cm fréquent. Récent : 20-30 cm typique.",
    howToMeasure: "Mesurez l'embrasure d'une fenêtre ouverte avec un mètre. C'est la mesure la plus fiable.",
    whyUseful: "Avec le matériau, l'épaisseur donne la résistance thermique structurelle. Un mur en pierre de 60 cm vaut presque autant qu'un mur récent isolé.",
    commonMistakes: ["Mesurer la profondeur du tableau seulement, pas l'épaisseur totale", "Oublier l'enduit extérieur"],
    impactOnResult: "high",
  },

  "envelope.walls.insulationKind": {
    ref: "envelope.walls.insulationKind",
    label: "Isolation existante des murs",
    whatToPut: "Type d'isolation déjà en place : aucune, ITI (intérieur), ITE (extérieur), ITR (répartie / monomur). Si vous ne savez pas, choisissez « isolation cachée à confirmer ».",
    howToMeasure: "Indices ITI : doublage placo visible, épaisseur de mur intérieure inhabituelle, retours de fenêtre profonds. Indices ITE : enduit projeté épais avec joints visibles, bardage extérieur, soubassement décollé du mur. Indices ITR : monomur, brique de chanvre, blocs isolants. Démontez une prise électrique pour voir la coupe du mur.",
    whyUseful: "Une isolation existante mal détectée fausse complètement le diagnostic. Inversement, ajouter une isolation par l'extérieur sur un mur déjà isolé par l'intérieur peut créer des pathologies.",
    commonMistakes: ["Confondre doublage acoustique et isolation thermique", "Marquer « pas d'isolation » alors qu'il y a 3-5 cm de polystyrène"],
    whenUnknown: "Utilisez le détecteur d'isolation cachée : tapotez le mur intérieur tous les mètres, écoutez les résonances. Mesurez la température de surface en hiver avec un thermomètre IR (différence > 4 °C entre mur isolé et mur froid).",
    impactOnResult: "high",
    relatedHelp: ["isolation-cachee", "ate-vs-iti"],
  },

  // ── ENVELOPPE / TOITURE ───────────────────────────────────────────────────
  "envelope.roof.kind": {
    ref: "envelope.roof.kind",
    label: "Type de toiture",
    whatToPut: "Toiture en pente (charpente traditionnelle, fermettes industrielles), toiture-terrasse, toiture mixte. Précisez si combles perdus ou aménagés.",
    howToMeasure: "Montez dans les combles si accessibles. Sinon observez de l'extérieur (pente / plat) et demandez les plans.",
    whyUseful: "La toiture représente jusqu'à 30 % des déperditions thermiques d'une maison. C'est généralement le geste le plus rentable. Type + accessibilité conditionnent les solutions (soufflage perdus, isolation rampants, sarking).",
    impactOnResult: "high",
  },

  "envelope.roof.insulationCm": {
    ref: "envelope.roof.insulationCm",
    label: "Épaisseur d'isolant en toiture (cm)",
    whatToPut: "Épaisseur d'isolant existant : 0 (aucun), 5-10 (ancien), 20-30 (RT 2005-2012), 30-40 (RT 2020 / Passivhaus).",
    howToMeasure: "Combles perdus : grimpez et mesurez avec une règle plantée verticalement dans la laine. Rampants : sondez via une trappe. Toiture-terrasse : indiquez « inconnu » sauf si plans disponibles.",
    whyUseful: "L'épaisseur d'isolant détermine directement la résistance R du toit (R = épaisseur / λ). Sans isolant : R ≈ 0,3. Avec 30 cm de laine de verre : R ≈ 7,5. C'est un facteur 25.",
    commonMistakes: ["Mesurer l'épaisseur d'un seul lit alors qu'il y en a deux croisés", "Oublier que la laine se tasse avec le temps (-20 % à 20 ans)"],
    impactOnResult: "high",
  },

  // ── ENVELOPPE / PLANCHER BAS ──────────────────────────────────────────────
  "envelope.lowerFloor.structure": {
    ref: "envelope.lowerFloor.structure",
    label: "Structure du plancher bas",
    whatToPut: "Sur terre-plein, sur vide sanitaire, sur sous-sol non chauffé, sur sous-sol chauffé, sur garage, plancher entre logements (collectif).",
    howToMeasure: "Allez en sous-sol / cave / vide sanitaire si accessible. Observez la sous-face du plancher. Plein pied + sol froid = terre-plein. Plancher bois grinçant = poutres + plancher = vide sanitaire ou sous-sol.",
    whyUseful: "Un plancher sur vide sanitaire ou sur sous-sol non chauffé représente 7 à 15 % des déperditions. Sur terre-plein, c'est moins critique mais l'isolation doit gérer l'humidité remontant du sol.",
    commonMistakes: ["Confondre dalle de compression et terre-plein", "Marquer « sous-sol non chauffé » alors qu'il y a une chaudière qui le réchauffe"],
    impactOnResult: "medium",
    relatedHelp: ["plancher-bas-types"],
  },

  // ── ENVELOPPE / FENÊTRES ──────────────────────────────────────────────────
  "envelope.windows.glazingKind": {
    ref: "envelope.windows.glazingKind",
    label: "Type de vitrage",
    whatToPut: "Simple vitrage, double vitrage standard, double vitrage à isolation renforcée (VIR), triple vitrage.",
    howToMeasure: "Test de la flamme : approchez une flamme (briquet) à 5 cm du vitrage. Comptez les reflets : 2 reflets = simple vitrage, 4 reflets = double vitrage. VIR : reflet plus rosé / orangé. Triple vitrage : 6 reflets. Test « pièce de monnaie » : poser sur le vitrage, si l'image se dédouble = double vitrage.",
    whyUseful: "Les fenêtres représentent 10-15 % des déperditions. Un simple vitrage Uw ≈ 5,8 W/m²K vs double VIR Uw ≈ 1,2. Aussi déterminant pour le confort thermique près des fenêtres et l'inconfort « paroi froide ».",
    commonMistakes: ["Marquer « double vitrage » pour des fenêtres avec contre-fenêtre intérieure (= simple + simple, pas double)"],
    whenUnknown: "L'étiquette gravée dans l'angle du vitrage donne la composition (4-16-4 = double vitrage 4mm + 16mm air + 4mm). Sinon faites le test des reflets de flamme.",
    impactOnResult: "high",
    relatedHelp: ["reconnaitre-vitrage"],
  },

  "envelope.windows.frameMaterial": {
    ref: "envelope.windows.frameMaterial",
    label: "Matériau du dormant des fenêtres",
    whatToPut: "Bois, PVC, aluminium sans rupture de pont thermique, aluminium à rupture de pont, mixte bois-aluminium.",
    howToMeasure: "Tapez sur le dormant : son sourd = bois ou PVC, son métallique = aluminium. Visuel : un alu à rupture de pont a une bande noire / grise visible entre l'intérieur et l'extérieur du dormant.",
    whyUseful: "Le matériau du cadre influence l'Uw global. Un dormant alu sans rupture de pont a un Uf ≈ 5 W/m²K (très mauvais) vs PVC ou bois à 1,3-1,7. La rupture de pont thermique change tout sur l'alu.",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / CHAUFFAGE ──────────────────────────────────────────────────
  "systems.heating.kind": {
    ref: "systems.heating.kind",
    label: "Système de chauffage principal",
    whatToPut: "Chaudière (gaz, fioul, bois, granulés), pompe à chaleur (air-air, air-eau, géothermie), radiateurs électriques (convecteurs, panneaux rayonnants, à inertie), poêle (bois, granulés), réseau de chaleur urbain.",
    howToMeasure: "Repérez l'unité principale : chaudière dans cellier / sous-sol, PAC avec unité extérieure (caisson métallique grande taille), radiateurs électriques individuels par pièce, poêle dans le séjour. Pour les radiateurs électriques, vérifiez s'ils sont à inertie (lourds, plus chers neufs) ou convecteurs simples (légers, grilles visibles).",
    whyUseful: "Le système de chauffage représente 60-80 % des consommations. Son rendement, son énergie (élec / gaz / fioul / bois) et sa COP (PAC) déterminent la facture annuelle ET les émissions GES.",
    commonMistakes: ["Confondre poêle d'agrément et chauffage principal", "Marquer « PAC » pour un climatiseur réversible mal dimensionné"],
    whenUnknown: "Cherchez la plaque signalétique de l'appareil : marque, modèle, puissance, énergie. Photographiez et l'IA identifiera. Pour les PAC : COP saisonnier (SCOP) gravé sur l'unité extérieure.",
    impactOnResult: "high",
    relatedHelp: ["reconnaitre-chauffage", "pac-types", "chaudiere-types"],
  },

  "systems.heating.installYear": {
    ref: "systems.heating.installYear",
    label: "Année d'installation du chauffage",
    whatToPut: "Année où le système actuel a été installé (pas la construction du bâtiment).",
    howToMeasure: "Plaque signalétique, contrat d'entretien, facture d'installation. Sinon estimez par état général.",
    whyUseful: "Le rendement chute avec l'âge (chaudière > 20 ans = -10 à -20 % rendement). Aussi obligatoire pour calculer les CEE (certificats d'économie d'énergie) et conditions MaPrimeRénov'.",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / ECS ────────────────────────────────────────────────────────
  "systems.dhw.kind": {
    ref: "systems.dhw.kind",
    label: "Production d'eau chaude sanitaire (ECS)",
    whatToPut: "Ballon électrique, ballon thermodynamique, chaudière mixte (chauffage + ECS), chauffe-eau solaire, chaudière fioul/gaz dédiée ECS, instantané gaz.",
    howToMeasure: "Localisez le ballon (cellier, salle de bain, comble) ou la chaudière mixte. Un ballon thermodynamique a une « cloche » au sommet (PAC intégrée) — taille ≈ 1,8 m de haut. Un chauffe-eau solaire a des panneaux thermiques en toiture + ballon stratifié.",
    whyUseful: "L'ECS représente 10-20 % des consommations. Un thermodynamique consomme 3× moins qu'un ballon électrique classique. Le solaire thermique couvre 50-70 % des besoins ECS gratuitement.",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / VENTILATION ────────────────────────────────────────────────
  "systems.ventilation.kind": {
    ref: "systems.ventilation.kind",
    label: "Ventilation",
    whatToPut: "Naturelle (ouverture des fenêtres, grilles haut-bas), VMC simple flux autoréglable, VMC simple flux hygroréglable, VMC double flux (avec récupérateur de chaleur).",
    howToMeasure: "Cherchez les bouches d'extraction au plafond (cuisine, SDB, WC). Présent + caisson dans comble = VMC simple flux. Présent + bouches d'insufflation aussi (chambres, séjour) = VMC double flux. Aucune bouche = ventilation naturelle.",
    whyUseful: "Une mauvaise ventilation = humidité, moisissures, qualité d'air dégradée. Une VMC double flux récupère 70-90 % de la chaleur de l'air sortant — gain consommation 10-20 %. Mais incompatible avec certains bâtis très perméables.",
    commonMistakes: ["Confondre VMC simple flux hygro et autoréglable (la première a des bouches qui s'ouvrent selon l'humidité)"],
    impactOnResult: "medium",
    relatedHelp: ["ventilation-types"],
  },

  // ── SCÉNARIOS / TRAVAUX ──────────────────────────────────────────────────
  "scenarios.target": {
    ref: "scenarios.target",
    label: "Objectif visé du scénario travaux",
    whatToPut: "Objectif principal : 1) confort + petit budget, 2) gain DPE de 2 lettres, 3) bâtiment basse consommation (BBC), 4) zéro carbone, 5) audit conforme MaPrimeRénov' parcours accompagné.",
    howToMeasure: "Question budget : combien le ménage est-il prêt à investir ? Combien d'aides sont accessibles ? Quel niveau d'inconfort actuel ?",
    whyUseful: "L'objectif détermine le bouquet de travaux à proposer (juste isolation toiture vs rénovation globale) et donc le coût, le ROI, et le confort attendu.",
    impactOnResult: "high",
  },

  // ── AIDES ─────────────────────────────────────────────────────────────────
  "aids.householdIncome": {
    ref: "aids.householdIncome",
    label: "Revenu fiscal de référence du ménage",
    whatToPut: "Revenu fiscal de référence (RFR) du ménage tel qu'indiqué sur l'avis d'imposition, ligne « Revenu fiscal de référence ». Cumul des avis si plusieurs occupants.",
    howToMeasure: "Avis d'imposition N-1 ou N-2 (selon date de demande aide). Conservez le PDF, il sera demandé pour le dossier.",
    whyUseful: "Détermine la catégorie MaPrimeRénov' : Bleu (très modeste), Jaune (modeste), Violet (intermédiaire), Rose (supérieur). Les barèmes d'aides varient du simple au quadruple selon la catégorie.",
    commonMistakes: ["Confondre RFR et salaire net", "Oublier les revenus du conjoint", "Donner le revenu brut imposable au lieu du RFR"],
    whenUnknown: "Connectez votre compte impots.gouv.fr (lien direct depuis l'app) ou téléversez le PDF de l'avis. Le RFR est en page 1, encadré « Vos références ».",
    impactOnResult: "high",
    relatedHelp: ["mpr-categories", "rfr-comprendre"],
  },

  "aids.householdSize": {
    ref: "aids.householdSize",
    label: "Composition du ménage",
    whatToPut: "Nombre de personnes vivant dans le logement (adultes + enfants à charge fiscale).",
    howToMeasure: "Comptez : 2 conjoints + 2 enfants à charge = 4. Excluez : enfants majeurs avec foyer fiscal séparé, locataires, hébergés temporaires.",
    whyUseful: "Les barèmes MaPrimeRénov' varient selon la composition (un célibataire à 25 k€ est en Bleu, un couple à 25 k€ aussi mais une famille de 4 à 25 k€ aussi en Bleu).",
    impactOnResult: "high",
  },

  // ── PROJECT / OCCUPANT ────────────────────────────────────────────────────
  "project.occupancyMode": {
    ref: "project.occupancyMode",
    label: "Mode d'occupation",
    whatToPut: "Résidence principale (occupé > 8 mois/an), résidence secondaire, location nue, location meublée, vacant.",
    howToMeasure: "Question simple. Si plusieurs occupants successifs dans l'année, prenez le statut dominant (> 6 mois).",
    whyUseful: "Conditionne l'éligibilité aux aides (la plupart exigent résidence principale propriétaire occupant). Influence aussi les hypothèses de scénario d'usage (présence diurne, ECS, etc.).",
    impactOnResult: "high",
  },

  "project.ownerStatus": {
    ref: "project.ownerStatus",
    label: "Statut juridique vis-à-vis du logement",
    whatToPut: "Propriétaire occupant, propriétaire bailleur, copropriétaire, locataire, usufruitier, indivision.",
    howToMeasure: "Acte de propriété. Si copropriété, vous êtes propriétaire exclusif des parties privatives + quote-part des parties communes.",
    whyUseful: "Détermine le périmètre des travaux possibles seul (parties privatives) vs nécessitant AG copropriété (façades, toiture commune, chaudière collective).",
    impactOnResult: "high",
  },

  // ── ENVELOPPE / MURS — compléments ────────────────────────────────────────
  "envelope.walls.exteriorTreatment": {
    ref: "envelope.walls.exteriorTreatment",
    label: "Traitement extérieur des murs",
    whatToPut: "Enduit chaux, enduit ciment, bardage bois, bardage métal, pierre apparente, peinture façade.",
    howToMeasure: "Observation directe. Tapez sur l'enduit : son sourd = ciment dur, son creux = bardage avec lame d'air, granulométrie irrégulière = chaux.",
    whyUseful: "Influence la perméance à la vapeur (ciment = quasi-imperméable, chaux = respirante) et la stratégie d'isolation par l'extérieur compatible.",
    commonMistakes: ["Confondre enduit chaux ancien (sablonneux) et enduit ciment moderne (lisse)"],
    impactOnResult: "medium",
  },

  "envelope.walls.thermalBridges": {
    ref: "envelope.walls.thermalBridges",
    label: "Ponts thermiques visibles",
    whatToPut: "Présence de ponts thermiques : balcons béton continus, planchers intermédiaires non rompus, refends en façade, encadrements de baies.",
    howToMeasure: "En hiver : les ponts thermiques montrent des taches d'humidité ou des moisissures aux angles. Caméra thermique idéale.",
    whyUseful: "Les ponts thermiques peuvent représenter 5-25 % des déperditions selon le bâti. Influence le type d'isolation (ITE traite les ponts, ITI les laisse).",
    impactOnResult: "medium",
  },

  // ── ENVELOPPE / TOITURE — compléments ─────────────────────────────────────
  "envelope.roof.coveringKind": {
    ref: "envelope.roof.coveringKind",
    label: "Type de couverture",
    whatToPut: "Tuiles terre cuite, tuiles béton, ardoise naturelle, ardoise fibrociment, zinc, bac acier, étanchéité bitumineuse (terrasse), végétalisée.",
    howToMeasure: "Observation extérieure. Régionalité forte : ardoise au Nord-Ouest, tuile canal au Sud, lauze en montagne.",
    whyUseful: "Influence l'absorption solaire (couverture sombre = plus chaud en été), la durée de vie restante, et le coût de réfection si rénovation toiture.",
    impactOnResult: "low",
  },

  "envelope.roof.atticType": {
    ref: "envelope.roof.atticType",
    label: "Type de combles",
    whatToPut: "Combles perdus (non habitables, non chauffés), combles aménagés (habitables, chauffés), combles aménageables (potentiel futur).",
    howToMeasure: "Combles perdus : trappe au plafond du dernier étage, vide non habitable au-dessus. Combles aménagés : pièces habitables sous rampants.",
    whyUseful: "Combles perdus = isolation soufflée la moins chère et la plus efficace (R 7+ pour 200 €/m²). Combles aménagés = isolation des rampants, plus complexe et chère.",
    impactOnResult: "high",
  },

  // ── ENVELOPPE / PLANCHER BAS — compléments ────────────────────────────────
  "envelope.lowerFloor.insulationCm": {
    ref: "envelope.lowerFloor.insulationCm",
    label: "Épaisseur d'isolant en plancher bas (cm)",
    whatToPut: "Épaisseur d'isolant existant en sous-face de plancher (côté sous-sol/cave/vide sanitaire) ou sur dalle.",
    howToMeasure: "Si sous-sol accessible : observez la sous-face. Panneaux PSE bleus/blancs collés = isolation. Mesurez avec une règle.",
    whyUseful: "Détermine la résistance thermique du plancher. R = 5-7 m².K/W cible pour neuf, 3-4 acceptable en rénovation.",
    impactOnResult: "medium",
  },

  // ── ENVELOPPE / FENÊTRES — compléments ────────────────────────────────────
  "envelope.windows.totalAreaM2": {
    ref: "envelope.windows.totalAreaM2",
    label: "Surface totale vitrée (m²)",
    whatToPut: "Somme des surfaces de toutes les fenêtres et baies vitrées du logement, mesurée à l'extérieur du dormant.",
    howToMeasure: "Pour chaque fenêtre : largeur × hauteur du dormant entier (cadre compris). Additionnez. Hors fenêtres de toit (à compter séparément).",
    whyUseful: "Le ratio surface vitrée / surface habitable conditionne les apports solaires d'hiver (gain) et d'été (risque surchauffe). Cible 15-20 % en RT 2012.",
    impactOnResult: "medium",
  },

  "envelope.windows.shutterKind": {
    ref: "envelope.windows.shutterKind",
    label: "Type de protection solaire (volets/stores)",
    whatToPut: "Aucun, volets battants bois, volets roulants PVC, volets roulants alu, persiennes, brise-soleil orientables, stores extérieurs.",
    howToMeasure: "Observation directe. Volets roulants modernes ont souvent un coffre intérieur ou linteau visible.",
    whyUseful: "Critique pour le confort d'été : volets fermés en journée chaude réduisent les apports solaires de 60-80 %. Aussi rôle isolation hivernale (lame d'air supplémentaire).",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / CHAUFFAGE — compléments ────────────────────────────────────
  "systems.heating.distribution": {
    ref: "systems.heating.distribution",
    label: "Mode de distribution de chaleur",
    whatToPut: "Radiateurs eau (acier, fonte, alu), radiateurs électriques individuels, plancher chauffant eau, plancher chauffant électrique, soufflage air.",
    howToMeasure: "Observation directe par pièce. Radiateurs eau = tuyauterie + robinet thermostatique. Plancher chauffant = pas de radiateur visible, sol tiède en hiver.",
    whyUseful: "La distribution conditionne la compatibilité avec un changement de générateur. PAC air-eau performante exige radiateurs basse température ou plancher chauffant.",
    impactOnResult: "high",
  },

  "systems.heating.regulation": {
    ref: "systems.heating.regulation",
    label: "Régulation du chauffage",
    whatToPut: "Sans régulation, thermostat unique d'ambiance, robinets thermostatiques par pièce, programmation horaire, sonde extérieure, GTC connecté.",
    howToMeasure: "Vérifier dans chaque pièce. Programmation = écran sur thermostat ou box dédiée. Sonde extérieure = capteur en façade nord.",
    whyUseful: "Une bonne régulation peut économiser 15-25 % sur la consommation chauffage à confort égal.",
    impactOnResult: "medium",
  },

  "systems.heating.powerKw": {
    ref: "systems.heating.powerKw",
    label: "Puissance du générateur (kW)",
    whatToPut: "Puissance nominale en kilowatts du générateur de chauffage (chaudière, PAC, etc.).",
    howToMeasure: "Plaque signalétique de l'équipement. Mention « Puissance utile », « Pn », ou « kW ». Pour PAC : puissance thermique fournie, pas électrique consommée.",
    whyUseful: "Puissance surdimensionnée = cycles courts, rendement dégradé, usure prématurée. Sous-dimensionnée = inconfort en pointe de froid. Cible : 70-90 % de la puissance de pointe calculée.",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / ECS — compléments ──────────────────────────────────────────
  "systems.dhw.tankVolumeL": {
    ref: "systems.dhw.tankVolumeL",
    label: "Volume du ballon ECS (litres)",
    whatToPut: "Capacité en litres du ballon d'eau chaude (50, 100, 150, 200, 250, 300 L).",
    howToMeasure: "Plaque signalétique. Sinon dimensionnement typique : 50 L/personne/jour usage standard.",
    whyUseful: "Volume sous-dimensionné = manque eau chaude en pointe. Surdimensionné = pertes de stockage importantes (1-2 kWh/jour).",
    impactOnResult: "low",
  },

  "systems.dhw.distributionLossLength": {
    ref: "systems.dhw.distributionLossLength",
    label: "Distance ballon ECS ↔ point de puisage le plus éloigné (m)",
    whatToPut: "Longueur estimée du circuit eau chaude entre le ballon et la salle de bain ou cuisine la plus éloignée.",
    howToMeasure: "Suivez visuellement les tuyaux. Si > 8 m, prévoir un bouclage ou ballon décentralisé.",
    whyUseful: "Distribution longue = pertes de chaleur en transit + gaspillage d'eau (purger avant chaud). Bouclage permanent peut consommer 10-15 % du besoin ECS.",
    impactOnResult: "low",
  },

  // ── SYSTÈMES / VENTILATION — compléments ──────────────────────────────────
  "systems.ventilation.year": {
    ref: "systems.ventilation.year",
    label: "Année d'installation de la VMC",
    whatToPut: "Année où la VMC a été installée. Si remplacée : dernière installation.",
    howToMeasure: "Plaque signalétique caisson VMC. Sinon estimation par état (filtre vieillissant, encrassement).",
    whyUseful: "Une VMC > 15 ans a souvent un débit dégradé (-30 %) et consomme plus. À remplacer si > 20 ans.",
    impactOnResult: "low",
  },

  "systems.ventilation.airTightness": {
    ref: "systems.ventilation.airTightness",
    label: "Étanchéité à l'air du bâtiment (Q4Pa-surf)",
    whatToPut: "Valeur de perméabilité à l'air si test réalisé : exprimée en m³/(h.m²) sous 4 Pa. Si non mesurée : estimation par catégorie (excellente / bonne / moyenne / mauvaise).",
    howToMeasure: "Test infiltrométrie (porte soufflante / blower door) par opérateur certifié — ~500 €. Sinon estimation : RT 2012 = 0,6 max maison neuve, ancien = 1,5-3.",
    whyUseful: "Sans étanchéité, l'isolation perd 30-50 % d'efficacité. Et ventilation contrôlée perd toute efficacité.",
    impactOnResult: "high",
  },

  // ── SYSTÈMES / CLIM ───────────────────────────────────────────────────────
  "systems.cooling.kind": {
    ref: "systems.cooling.kind",
    label: "Système de climatisation",
    whatToPut: "Aucune, ventilateurs uniquement, brasseur d'air plafond, climatisation split simple, multisplit, gainable, PAC réversible (combinée chauffage).",
    howToMeasure: "Observer les unités intérieures (splits muraux) + unité extérieure. PAC réversible = même équipement que chauffage.",
    whyUseful: "Climatisation = forte consommation été (1-3 kWh/m²/an). Une bonne stratégie passive (volets, isolation, ventilation nocturne) la rend souvent superflue.",
    impactOnResult: "medium",
  },

  "systems.cooling.scop": {
    ref: "systems.cooling.scop",
    label: "Coefficient de performance saisonnier (SEER ou SCOP)",
    whatToPut: "SEER (climatisation seule, été) ou SCOP (réversible, hiver) indiqué sur la plaque ou la fiche produit.",
    howToMeasure: "Plaque signalétique unité extérieure. SEER 6+ = bon, SEER 3-4 = ancien.",
    whyUseful: "Détermine consommation électrique. PAC SEER 7 consomme 2× moins qu'une vieille clim SEER 3 pour même fraîcheur.",
    impactOnResult: "medium",
  },

  // ── SYSTÈMES / ÉCLAIRAGE ──────────────────────────────────────────────────
  "systems.lighting.dominantTech": {
    ref: "systems.lighting.dominantTech",
    label: "Technologie d'éclairage dominante",
    whatToPut: "LED, fluocompactes, halogènes, incandescentes, mixte. Estimer la techno la plus présente en nombre de points lumineux.",
    howToMeasure: "Comptez les ampoules par pièce et leur type. LED = ampoule moderne, peu chaude, instantanée. Halogène = chaude au toucher, intense.",
    whyUseful: "Passage tout-LED = -70 % consommation éclairage (typiquement 5-10 % du total résidentiel). Geste rapide et rentable.",
    impactOnResult: "low",
  },

  // ── SYSTÈMES / ÉNERGIES RENOUVELABLES ─────────────────────────────────────
  "systems.solar.thermalKind": {
    ref: "systems.solar.thermalKind",
    label: "Solaire thermique (eau chaude solaire)",
    whatToPut: "Aucun, CESI individuel (Chauffe-Eau Solaire Individuel), SSC (Système Solaire Combiné chauffage + ECS).",
    howToMeasure: "Capteurs solaires plans ou tubes sous vide en toiture orientée sud + ballon stratifié au sol/comble.",
    whyUseful: "Couvre 50-70 % des besoins ECS gratuitement. Très bon ROI dans le sud, plus modéré au nord.",
    impactOnResult: "medium",
  },

  "systems.solar.pvKwc": {
    ref: "systems.solar.pvKwc",
    label: "Puissance photovoltaïque installée (kWc)",
    whatToPut: "Puissance crête en kilowatts-crête de l'installation PV existante (0 si aucune).",
    howToMeasure: "Plaque onduleur ou contrat de raccordement EDF OA (Obligation d'Achat).",
    whyUseful: "Détermine la production électrique annuelle (~1100 kWh/kWc/an dans le sud, 950 dans le nord). Influence le bilan énergétique global.",
    impactOnResult: "medium",
  },

  // ── SCÉNARIOS / TRAVAUX — compléments ─────────────────────────────────────
  "scenarios.budgetMaxEuros": {
    ref: "scenarios.budgetMaxEuros",
    label: "Budget maximum envisageable (€)",
    whatToPut: "Montant total que le ménage est prêt à investir, hors aides. Si financé par crédit, le capital total.",
    howToMeasure: "Discussion ménage. Inclure épargne mobilisable + capacité crédit (généralement 33 % des revenus en mensualités).",
    whyUseful: "Borne supérieure du scénario. Si bouquet visé excède budget, l'IA suggère une priorisation par ROI ou par confort.",
    impactOnResult: "high",
  },

  "scenarios.workConstraints": {
    ref: "scenarios.workConstraints",
    label: "Contraintes pendant les travaux",
    whatToPut: "Logement occupé pendant travaux, déménagement temporaire possible, monument historique (ABF), copropriété (AG nécessaire), saisonnalité (avant hiver).",
    howToMeasure: "Question ménage + visite mairie si secteur sauvegardé.",
    whyUseful: "Conditionne la faisabilité (ITE en copro nécessite AG, monument historique limite les options esthétiques). Influence aussi les délais.",
    impactOnResult: "medium",
  },

  // ── AIDES — compléments ───────────────────────────────────────────────────
  "aids.locationEpci": {
    ref: "aids.locationEpci",
    label: "EPCI / Communauté de communes",
    whatToPut: "Nom de l'établissement public de coopération intercommunale dont dépend la commune (Métropole Lyon, Grenoble Alpes Métropole, etc.).",
    howToMeasure: "Auto-rempli depuis l'adresse BAN. Sinon recherche sur banatic.interieur.gouv.fr.",
    whyUseful: "Beaucoup d'EPCI ont des aides locales cumulables (jusqu'à 1 000-3 000 €). À ne pas oublier.",
    impactOnResult: "medium",
  },

  "aids.regionCode": {
    ref: "aids.regionCode",
    label: "Région",
    whatToPut: "Code région (ARA, IDF, NAQ, etc.). Auto-rempli depuis adresse.",
    howToMeasure: "Auto.",
    whyUseful: "Aides régionales (Île-de-France Énergie, Région Sud, etc.) parfois substantielles pour rénovation globale.",
    impactOnResult: "low",
  },

  // ── CONFORT ───────────────────────────────────────────────────────────────
  "comfort.summerComplaints": {
    ref: "comfort.summerComplaints",
    label: "Problèmes de confort d'été ressentis",
    whatToPut: "Cocher : surchauffe combles, surchauffe chambres sud, manque d'air, gêne pour dormir, recours obligatoire à clim.",
    howToMeasure: "Question ménage. Demander mois et pièces concernées.",
    whyUseful: "Oriente le diagnostic vers les solutions confort été : isolation toiture épaisse, protection solaire, ventilation nocturne, inertie.",
    impactOnResult: "medium",
  },

  "comfort.winterComplaints": {
    ref: "comfort.winterComplaints",
    label: "Problèmes de confort d'hiver ressentis",
    whatToPut: "Cocher : pieds froids, sensation paroi froide, courants d'air, condensation sur fenêtres, moisissures, chambres difficiles à chauffer.",
    howToMeasure: "Question ménage. Demander pièces et conditions (matin / soir / nuit).",
    whyUseful: "Oriente vers solutions ciblées : isolation plancher (pieds froids), ITE (paroi froide), étanchéité (courants d'air), ventilation (condensation), surfaces vitrées (radiation froide).",
    impactOnResult: "medium",
  },

  "comfort.indoorTempTarget": {
    ref: "comfort.indoorTempTarget",
    label: "Température intérieure souhaitée (°C)",
    whatToPut: "Température cible en hiver. Valeur typique 19-21 °C en pièces de vie, 17-19 °C en chambres.",
    howToMeasure: "Question ménage. Privilégier la valeur réellement souhaitée vs valeur subie.",
    whyUseful: "1 °C de plus = +7 % de consommation chauffage. La cible influence directement les besoins calculés.",
    impactOnResult: "high",
  },

  // ── PHOTOS ────────────────────────────────────────────────────────────────
  "photos.requiredCount": {
    ref: "photos.requiredCount",
    label: "Nombre de photos minimum recommandé",
    whatToPut: "Pour un audit complet : 4 façades extérieures + 1 toiture + 1 sous-face plancher + 1 chaque pièce + 1 chaudière + 1 PAC + 1 VMC + 1 compteur électrique + 1 compteur gaz/fioul. Total ~15-25 photos.",
    howToMeasure: "Listing à respecter. La fonction « Identifier par photo » fonctionne mieux avec photos nettes, en plein jour, perpendiculaires.",
    whyUseful: "Photos = traçabilité du diagnostic + alimentation IA Vision pour identification matériaux. Utile aussi pour le rapport PDF final.",
    impactOnResult: "medium",
  },

  // ── PROJET — compléments avancés ──────────────────────────────────────────
  "project.altitudeM": {
    ref: "project.altitudeM",
    label: "Altitude (m)",
    whatToPut: "Altitude du bâtiment au-dessus du niveau de la mer.",
    howToMeasure: "Auto-rempli depuis l'adresse BAN. Sinon : carte IGN, GPS, ou recherche en ligne.",
    whyUseful: "Au-delà de 800 m, les coefficients climatiques sont majorés (DJU plus élevés, gel plus fréquent). Influence dimensionnement chauffage.",
    impactOnResult: "medium",
  },
  "project.climateZone": {
    ref: "project.climateZone",
    label: "Zone climatique",
    whatToPut: "Zone H1 (Nord, Est), H2 (Centre, Ouest), H3 (Méditerranée). Auto-rempli depuis l'adresse.",
    howToMeasure: "Auto. Référence : carte zones climatiques RT 2012/RE 2020.",
    whyUseful: "Les coefficients de référence varient selon la zone. H1a Strasbourg ≠ H3 Marseille en besoin chauffage.",
    impactOnResult: "high",
  },
  "project.exposition": {
    ref: "project.exposition",
    label: "Exposition au vent",
    whatToPut: "Abritée (vallée, dense urbain), normale (péri-urbain), exposée (côte, crête, plaine).",
    howToMeasure: "Observation site. Présence de coupe-vents, distance aux obstacles.",
    whyUseful: "Influence les déperditions par renouvellement d'air infiltrations (jusqu'à +30 % en site exposé).",
    impactOnResult: "medium",
  },
  "project.shadingMask": {
    ref: "project.shadingMask",
    label: "Masques solaires (ombrages)",
    whatToPut: "Bâtiments voisins, arbres, relief qui ombragent les façades en hiver.",
    howToMeasure: "Observer course du soleil aux solstices d'hiver. Logiciel masques solaires si projet précis.",
    whyUseful: "Réduit les apports solaires hivernaux gratuits (10-30 % facture chauffage).",
    impactOnResult: "medium",
  },

  // ── ENVELOPPE / COMPLÉMENTS DÉTAILLÉS ─────────────────────────────────────
  "envelope.walls.facadeOrientation": {
    ref: "envelope.walls.facadeOrientation",
    label: "Orientation des façades",
    whatToPut: "N / NE / E / SE / S / SO / O / NO pour chaque façade principale, avec sa surface.",
    howToMeasure: "Boussole ou plan d'urbanisme. Privilégier dominante si plusieurs façades cardinales.",
    whyUseful: "Sud = apports solaires hiver gratuits + risque surchauffe été. Nord = froid + sans gain. Stratégie isolation différente.",
    impactOnResult: "medium",
  },
  "envelope.walls.weatherProtection": {
    ref: "envelope.walls.weatherProtection",
    label: "Protection contre la pluie battante",
    whatToPut: "Aucune, débord toiture > 50 cm, bardage ventilé, enduit étanche.",
    howToMeasure: "Observer débord toit, type de surface mur. Photos en pluie battante révèlent l'eau.",
    whyUseful: "Mur exposé pluie sans protection peut prendre 5-15 % d'humidité = perte isolation 30-50 %.",
    impactOnResult: "medium",
  },
  "envelope.roof.atticVentilation": {
    ref: "envelope.roof.atticVentilation",
    label: "Ventilation des combles",
    whatToPut: "Aucune (combles aménagés étanches), naturelle (entrées sous tuiles + sortie faîtage), forcée (extracteur).",
    howToMeasure: "Observation combles : présence de tuiles à douille, chatières, sorties faîtage.",
    whyUseful: "Combles non ventilés + isolation = risque condensation pic en intersaison. Indispensable si rampants en laine de verre.",
    impactOnResult: "medium",
  },
  "envelope.roof.skylightCount": {
    ref: "envelope.roof.skylightCount",
    label: "Nombre de fenêtres de toit (Velux)",
    whatToPut: "Compter le nombre de fenêtres de toit (Velux, Roto, Fakro).",
    howToMeasure: "Compter visuellement.",
    whyUseful: "Une fenêtre de toit a un Uw 50 % moins bon qu'une fenêtre verticale équivalente. Source de surchauffe été en sud.",
    impactOnResult: "low",
  },
  "envelope.windows.openingType": {
    ref: "envelope.windows.openingType",
    label: "Type d'ouverture des fenêtres",
    whatToPut: "Battantes, oscillo-battantes, à galandage, coulissantes, fixes.",
    howToMeasure: "Observation directe.",
    whyUseful: "Les coulissantes ont une étanchéité air moins bonne que les battantes (-1 classe AEV typique).",
    impactOnResult: "low",
  },
  "envelope.doors.entranceUw": {
    ref: "envelope.doors.entranceUw",
    label: "Performance porte d'entrée (Uw)",
    whatToPut: "Coefficient Uw de la porte d'entrée principale. Ancien bois plein ≈ 3-4, neuf isolé ≈ 1,2-1,8.",
    howToMeasure: "Étiquette CEKAL, ou estimation par âge et matériau.",
    whyUseful: "Une porte d'entrée représente jusqu'à 5 % des déperditions surfaces opaques. Souvent négligée.",
    impactOnResult: "low",
  },
  "envelope.airTightnessQ4": {
    ref: "envelope.airTightnessQ4",
    label: "Perméabilité à l'air mesurée (Q4Pa-surf)",
    whatToPut: "Valeur en m³/(h.m²) sous 4 Pa, mesurée par test infiltrométrie. RT 2012 maison neuve = 0,6 max.",
    howToMeasure: "Test porte soufflante par opérateur certifié (~500 €).",
    whyUseful: "Sans étanchéité, l'isolation perd 30-50 % d'efficacité. Test obligatoire pour RE 2020.",
    impactOnResult: "high",
  },

  // ── SYSTÈMES — COMPLÉMENTS ────────────────────────────────────────────────
  "systems.heating.fuelType": {
    ref: "systems.heating.fuelType",
    label: "Énergie principale du chauffage",
    whatToPut: "Électricité, gaz naturel, propane, fioul, bois bûches, bois pellets, charbon, réseau de chaleur.",
    howToMeasure: "Étiquette compteur ou facture annuelle.",
    whyUseful: "Détermine le facteur de conversion énergie primaire / finale et les émissions GES (kgCO2eq/kWh).",
    impactOnResult: "high",
  },
  "systems.heating.boilerEfficiency": {
    ref: "systems.heating.boilerEfficiency",
    label: "Rendement chaudière (%)",
    whatToPut: "Rendement saisonnier nominal de la chaudière. Standard ancienne ≈ 75 %, condensation ≈ 95-105 %.",
    howToMeasure: "Plaque signalétique ou contrat d'entretien (rapport annuel).",
    whyUseful: "Un rendement bas + chaudière vieille = surdimensionnement réel des consommations. Cible >92 % pour aides.",
    impactOnResult: "high",
  },
  "systems.heating.maintenanceContract": {
    ref: "systems.heating.maintenanceContract",
    label: "Contrat d'entretien chauffage",
    whatToPut: "Oui (annuel) / non / occasionnel.",
    howToMeasure: "Demander factures dernières années.",
    whyUseful: "Obligation légale annuelle pour chaudière > 4 kW. Sans entretien, rendement chute 5-15 %/an.",
    impactOnResult: "low",
  },
  "systems.dhw.dailyVolumeL": {
    ref: "systems.dhw.dailyVolumeL",
    label: "Consommation quotidienne ECS (L/jour)",
    whatToPut: "Volume estimé d'eau chaude consommée par jour pour le foyer. Standard : 50 L/personne.",
    howToMeasure: "Compteur d'eau chaude si présent. Sinon estimation : douches × 50L + bain × 150L + vaisselle × 20L.",
    whyUseful: "Détermine le besoin annuel ECS et le dimensionnement du ballon.",
    impactOnResult: "medium",
  },
  "systems.dhw.targetTemp": {
    ref: "systems.dhw.targetTemp",
    label: "Température de consigne ECS (°C)",
    whatToPut: "Température réglée du ballon ou production. Standard 55 °C (anti-légionellose) à 65 °C (confort).",
    howToMeasure: "Vérifier sur thermostat ballon ou panneau commande chaudière.",
    whyUseful: "Chaque °C en moins = -3 % conso ECS. Mais < 50 °C = risque légionellose.",
    impactOnResult: "low",
  },
  "systems.ventilation.flowRate": {
    ref: "systems.ventilation.flowRate",
    label: "Débit d'extraction VMC (m³/h)",
    whatToPut: "Débit total nominal selon DTU 68.3. Maison T3 = 60-105 m³/h, T5 = 105-135 m³/h.",
    howToMeasure: "Plaque caisson VMC. Sinon mesure par anémomètre aux bouches (somme).",
    whyUseful: "Débit insuffisant = humidité, qualité air dégradée. Surdébit = surconsommation chauffage (air neuf à réchauffer).",
    impactOnResult: "low",
  },

  // ── SCÉNARIOS — COMPLÉMENTS ───────────────────────────────────────────────
  "scenarios.combineWith": {
    ref: "scenarios.combineWith",
    label: "Travaux à combiner",
    whatToPut: "Liste des travaux à inclure dans le scénario : isolation toiture, ITE, menuiseries, chauffage, ECS, VMC, photovoltaïque.",
    howToMeasure: "Choisir 2 à 6 postes priorités.",
    whyUseful: "Bouquets cohérents permettent éligibilité MPR Sérénité et meilleur ROI global.",
    impactOnResult: "high",
  },
  "scenarios.financingMode": {
    ref: "scenarios.financingMode",
    label: "Mode de financement",
    whatToPut: "Apport personnel total, Eco-PTZ partiel, crédit conso, crédit hypothécaire, mix.",
    howToMeasure: "Question ménage. Capacité crédit max ≈ 33 % revenus.",
    whyUseful: "Conditionne la mensualité et donc l'effort budgétaire réel.",
    impactOnResult: "medium",
  },
  "scenarios.priorityCriterion": {
    ref: "scenarios.priorityCriterion",
    label: "Critère de priorisation",
    whatToPut: "ROI maximum, gain DPE maximum, confort été maximum, confort hiver maximum, GES minimum.",
    howToMeasure: "Discussion avec le ménage.",
    whyUseful: "L'IA classe les options selon le critère. Confort ≠ ROI ≠ DPE.",
    impactOnResult: "medium",
  },

  // ── AIDES — COMPLÉMENTS ───────────────────────────────────────────────────
  "aids.dependents": {
    ref: "aids.dependents",
    label: "Personnes à charge fiscale",
    whatToPut: "Nombre de personnes à charge fiscale (enfants mineurs, étudiants rattachés, personnes invalides).",
    howToMeasure: "Avis d'imposition section « personnes à charge ».",
    whyUseful: "Modifie les seuils MPR (ex famille 4 personnes : seuil Bleu 41 855 € en IDF).",
    impactOnResult: "high",
  },
  "aids.taxYear": {
    ref: "aids.taxYear",
    label: "Année fiscale de référence",
    whatToPut: "N-1 ou N-2 selon date demande aide. MPR utilise généralement N-2.",
    howToMeasure: "Vérifier sur impots.gouv.fr.",
    whyUseful: "Une bonne année = catégorie sup, donc moins d'aide. Ne pas anticiper inutilement la demande.",
    impactOnResult: "medium",
  },
  "aids.previousMprReceived": {
    ref: "aids.previousMprReceived",
    label: "MaPrimeRénov' déjà perçue",
    whatToPut: "Oui / non. Si oui, montant et année.",
    howToMeasure: "Compte maprimerenov.gouv.fr historique.",
    whyUseful: "Plafond pluri-annuel à respecter (cumul). Influence éligibilité MPR Sérénité.",
    impactOnResult: "medium",
  },

  // ── CONFORT — COMPLÉMENTS ────────────────────────────────────────────────
  "comfort.relativeHumidity": {
    ref: "comfort.relativeHumidity",
    label: "Humidité relative ressentie (%)",
    whatToPut: "Plage habituelle : 40-60 % confortable, < 30 % air sec, > 70 % humide.",
    howToMeasure: "Hygromètre digital (~10 €) en plusieurs pièces / saisons.",
    whyUseful: "Humidité élevée = perception froid en hiver, moisissures. Faible = irritations, statique.",
    impactOnResult: "low",
  },
  "comfort.acousticSensitivity": {
    ref: "comfort.acousticSensitivity",
    label: "Gêne acoustique extérieure",
    whatToPut: "Faible / moyenne / forte. Sources : route, train, voisins, industrie.",
    howToMeasure: "Question ménage. Prise mesure dB possible.",
    whyUseful: "Indique besoin de menuiseries acoustiques (Rw 35-40 dB minimum) en remplacement.",
    impactOnResult: "low",
  },
  "comfort.airQualityComplaints": {
    ref: "comfort.airQualityComplaints",
    label: "Plaintes qualité d'air intérieur",
    whatToPut: "Cocher : odeurs persistantes, allergies, asthme, fatigue chronique, maux de tête sans cause médicale.",
    howToMeasure: "Question ménage. Diagnostic CMEI possible.",
    whyUseful: "Indique besoin de VMC double flux avec filtration et/ou révision matériaux émetteurs COV.",
    impactOnResult: "medium",
  },

  // ── COÛTS / CHANTIER ─────────────────────────────────────────────────────
  "costs.localPriceLevel": {
    ref: "costs.localPriceLevel",
    label: "Niveau prix local",
    whatToPut: "Bas (rural, province), moyen (banlieue), élevé (Paris, grandes métropoles, île).",
    howToMeasure: "Devis comparatifs 3 entreprises locales.",
    whyUseful: "Coûts main d'œuvre varient ±30 % selon zone. Important pour estimation réaliste.",
    impactOnResult: "medium",
  },
  "costs.includeSelfWork": {
    ref: "costs.includeSelfWork",
    label: "Auto-construction partielle ?",
    whatToPut: "Oui / non. Si oui, sur quels postes (peinture, démolition, manutention).",
    howToMeasure: "Question ménage.",
    whyUseful: "Économise 10-20 % du devis mais perd l'éligibilité MPR (qui exige RGE pour la pose).",
    impactOnResult: "medium",
  },

  // ── RAPPORT / METADATA ───────────────────────────────────────────────────
  "report.auditorSignature": {
    ref: "report.auditorSignature",
    label: "Signature auditeur",
    whatToPut: "Nom + qualif (OPQIBI 1905 / RGE Audit / certifié AFNOR DPE).",
    howToMeasure: "Auto-rempli depuis profil utilisateur Pro.",
    whyUseful: "Conformité audit énergétique réglementaire (arrêté 4 mai 2022).",
    impactOnResult: "low",
  },
  "report.includePhotos": {
    ref: "report.includePhotos",
    label: "Inclure photos dans le rapport PDF",
    whatToPut: "Oui (recommandé) / non.",
    howToMeasure: "Toggle.",
    whyUseful: "Photos = traçabilité diagnostic + crédibilité auprès du client. Augmente taille PDF (~5-15 Mo).",
    impactOnResult: "low",
  },
  "report.language": {
    ref: "report.language",
    label: "Langue du rapport PDF",
    whatToPut: "FR (standard), EN, ES, DE, PT.",
    howToMeasure: "Sélecteur. Souvent même langue que l'interface.",
    whyUseful: "Pour clients étrangers ou propriétaires bilingues.",
    impactOnResult: "low",
  },

  // ── PHOTOS DÉTAILLÉ Sprint 28 ────────────────────────────────────────────
  "photos.facadeNorth": {
    ref: "photos.facadeNorth",
    label: "Photo façade nord",
    whatToPut: "Une photo cadrée de la façade nord en plein jour, perpendiculaire au mur, sans véhicule devant.",
    howToMeasure: "Reculez de 5-10 m. Format paysage. Évitez contre-jour matinal.",
    whyUseful: "Permet à l'IA d'identifier matériau de mur, présence/absence d'isolation visible, état de l'enduit.",
    impactOnResult: "medium",
  },
  "photos.facadeSouth": {
    ref: "photos.facadeSouth",
    label: "Photo façade sud",
    whatToPut: "Façade sud avec vue dégagée. Inclure la base (terrain) et le faîtage si possible.",
    howToMeasure: "Évitez plein soleil de midi (forte ombre). Privilégiez matin ou fin d'après-midi.",
    whyUseful: "Façade sud = apports solaires hiver. Photos révèlent ombrages, débord toiture, balcons.",
    impactOnResult: "medium",
  },
  "photos.roofGeneral": {
    ref: "photos.roofGeneral",
    label: "Photo générale de la toiture",
    whatToPut: "Photo de la toiture entière depuis un point haut accessible (fenêtre étage voisin, drone autorisé).",
    howToMeasure: "Évitez photos en plongée extrême. Privilégiez vue 3/4.",
    whyUseful: "Identifie matériau couverture, état (mousses, fissures), nombre de Velux, cheminées.",
    impactOnResult: "medium",
  },
  "photos.atticInside": {
    ref: "photos.atticInside",
    label: "Photo intérieur combles",
    whatToPut: "Photo dans les combles (perdus ou aménagés) montrant l'isolation présente et la charpente.",
    howToMeasure: "Lampe puissante. Cadrer pour montrer épaisseur isolant + structure (chevrons, fermettes).",
    whyUseful: "Identifie type isolant, épaisseur, état (tassement, humidité), présence pare-vapeur.",
    impactOnResult: "high",
  },
  "photos.electricMeter": {
    ref: "photos.electricMeter",
    label: "Photo compteur électrique",
    whatToPut: "Photo du compteur (Linky ou ancien) avec affichage lisible.",
    howToMeasure: "Cadrage rapproché, affichage net.",
    whyUseful: "Permet de confirmer la puissance souscrite, type de compteur, et pour Linky : courbe de charge.",
    impactOnResult: "low",
  },
  "photos.boilerNameplate": {
    ref: "photos.boilerNameplate",
    label: "Photo plaque signalétique chaudière",
    whatToPut: "Photo nette de la plaque indiquant marque, modèle, puissance, année, énergie.",
    howToMeasure: "Lampe + macro si nécessaire. Texte lisible obligatoire.",
    whyUseful: "Critique pour identifier précisément l'équipement et calculer rendement réel + éligibilité aides.",
    impactOnResult: "high",
  },
  "photos.windowDetail": {
    ref: "photos.windowDetail",
    label: "Photo détail fenêtre",
    whatToPut: "Photo d'une fenêtre représentative montrant cadre, vitrage, dormant.",
    howToMeasure: "Inclure étiquette CEKAL si visible. Photographier l'angle inférieur (souvent étiquette gravée).",
    whyUseful: "L'IA Vision peut identifier type de vitrage (double, VIR, triple) depuis les reflets.",
    impactOnResult: "medium",
  },

  // ── CONFORMITÉ RÉGLEMENTAIRE Sprint 28 ───────────────────────────────────
  "compliance.dpeMode": {
    ref: "compliance.dpeMode",
    label: "Mode DPE applicable",
    whatToPut: "DPE 3CL individuel (logement seul), DPE collectif L731-1 (immeuble), DPE tertiaire (bureau/commerce), audit énergétique réglementaire (vente passoire).",
    howToMeasure: "Selon contexte : maison/appartement = 3CL, immeuble entier = L731-1, vente classe F/G = audit obligatoire.",
    whyUseful: "Détermine la méthode de calcul, le format du rapport et les obligations réglementaires.",
    impactOnResult: "high",
  },
  "compliance.energyLabelTarget": {
    ref: "compliance.energyLabelTarget",
    label: "Étiquette DPE visée après travaux",
    whatToPut: "Lettre cible (A à G). MaPrimeRénov' Sérénité = saut min 2 lettres. Loi Climat 2025 = sortie classe G obligatoire en location.",
    howToMeasure: "Question stratégique : impact réglementaire location (G interdit 2025, F en 2028, E en 2034).",
    whyUseful: "Détermine ambition du scénario travaux et éligibilité aides cumulées.",
    impactOnResult: "high",
  },
  "compliance.tertiaryDecree": {
    ref: "compliance.tertiaryDecree",
    label: "Concerné par décret tertiaire",
    whatToPut: "Oui/non. Concerne bâtiments tertiaires > 1 000 m² (bureau, commerce, enseignement, etc.) avec obligation -40% conso d'ici 2030, -50% 2040, -60% 2050.",
    howToMeasure: "Vérifier surface tertiaire totale du site.",
    whyUseful: "Si oui, déclaration annuelle OPERAT obligatoire et plan d'action pluri-annuel.",
    impactOnResult: "high",
  },
  "compliance.copropertyDPE": {
    ref: "compliance.copropertyDPE",
    label: "DPE collectif copropriété obligatoire",
    whatToPut: "Oui/non. Obligation : DPE collectif pour immeubles > 50 lots dès 2024, 51-200 lots en 2025, < 50 lots en 2026.",
    howToMeasure: "Compter nombre lots syndic.",
    whyUseful: "Si oui, déclencher mission DPE collectif certifié + résolution AG associée.",
    impactOnResult: "high",
  },
  "compliance.historicalProtection": {
    ref: "compliance.historicalProtection",
    label: "Protection patrimoine (ABF, MH, secteur sauvegardé)",
    whatToPut: "Aucune, secteur sauvegardé, périmètre ABF (rayon 500 m monument), monument historique inscrit, monument classé.",
    howToMeasure: "Mairie, atlas patrimoine, géoportail urbanisme.",
    whyUseful: "Limite fortement les options de rénovation extérieure (ITE généralement interdite, fenêtres devant respecter cahier des charges).",
    impactOnResult: "high",
  },
  "compliance.asbestos": {
    ref: "compliance.asbestos",
    label: "Diagnostic amiante avant travaux (DAAT)",
    whatToPut: "Réalisé / à réaliser / non concerné (post-1997).",
    howToMeasure: "Obligation pour bâtiments d'avant juillet 1997. DAAT par diagnostiqueur certifié.",
    whyUseful: "Présence amiante = surcoût travaux (encapsulation/désamiantage) et risque chantier.",
    impactOnResult: "medium",
  },
  "compliance.lead": {
    ref: "compliance.lead",
    label: "Diagnostic plomb (CREP)",
    whatToPut: "Réalisé / à réaliser / non concerné (post-1949).",
    howToMeasure: "Obligation pour parties communes immeubles d'avant 1949.",
    whyUseful: "Plomb = travaux peinture nécessite précautions (encapsulant ou retrait).",
    impactOnResult: "low",
  },

  // ── MOBILE CAPTURE Sprint 28 ─────────────────────────────────────────────
  "mobile.gpsCoordinates": {
    ref: "mobile.gpsCoordinates",
    label: "Coordonnées GPS du bâtiment",
    whatToPut: "Latitude/longitude du bâtiment audité. Auto-rempli depuis GPS du téléphone si autorisation.",
    howToMeasure: "App mobile : autoriser accès géolocalisation. Précision : ±5 m en GPS, ±50 m en triangulation.",
    whyUseful: "Permet de croiser avec adresse BAN, vérifier zone climatique, détecter erreur d'adresse.",
    impactOnResult: "low",
  },
  "mobile.weatherAtCapture": {
    ref: "mobile.weatherAtCapture",
    label: "Conditions météo lors de la visite",
    whatToPut: "Beau temps, nuageux, pluie, soleil intense, neige, vent fort. Température extérieure approximative.",
    howToMeasure: "Auto-rempli via API météo OpenWeather si géolocalisation autorisée.",
    whyUseful: "Photos faites en pluie battante révèlent l'eau dans les murs. Forte chaleur = test confort été pertinent.",
    impactOnResult: "low",
  },
  "mobile.thermalImagery": {
    ref: "mobile.thermalImagery",
    label: "Imagerie thermique (caméra IR)",
    whatToPut: "Aucune, smartphone avec capteur IR (FLIR One), caméra dédiée pro.",
    howToMeasure: "Conditions : ΔT ≥ 10°C entre intérieur/extérieur, sans soleil direct sur la façade.",
    whyUseful: "Révèle ponts thermiques, défauts isolation, infiltrations air. Idéale en complément du diagnostic visuel.",
    impactOnResult: "medium",
  },
  "mobile.audioNotes": {
    ref: "mobile.audioNotes",
    label: "Notes audio terrain",
    whatToPut: "Enregistrements vocaux courts (10-60s) capturés sur place. Transcrits automatiquement par Whisper.",
    howToMeasure: "App mobile : bouton micro dédié. Annoter pendant inspection au lieu d'écrire.",
    whyUseful: "Plus rapide que la saisie manuelle. Préserve les détails contextuels parfois oubliés.",
    impactOnResult: "low",
  },
  "mobile.scanQrEquipment": {
    ref: "mobile.scanQrEquipment",
    label: "Scan QR/code-barres équipement",
    whatToPut: "Scanner les codes éventuellement présents sur les équipements (chaudière, PAC, fenêtres).",
    howToMeasure: "App mobile : ouvrir scanner QR intégré, viser le code.",
    whyUseful: "Auto-renseigne marque/modèle/spécifications techniques depuis base catalogue fournisseur.",
    impactOnResult: "low",
  },
};

/** Helper : récupère l'aide d'un champ par sa ref */
export function getFieldHelp(ref: string): FieldHelp | null {
  return FIELD_HELP[ref] ?? null;
}

/** Helper : recherche fuzzy par mot-clé (pour reformulations utilisateur) */
export function searchFieldHelp(query: string): FieldHelp[] {
  const q = query.toLowerCase();
  return Object.values(FIELD_HELP).filter(
    f =>
      f.label.toLowerCase().includes(q) ||
      f.whatToPut.toLowerCase().includes(q) ||
      f.howToMeasure.toLowerCase().includes(q)
  );
}
