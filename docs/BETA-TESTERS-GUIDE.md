# RenocalcPro Beta — Guide testeurs

Merci d'accepter de tester la beta ! Ce guide te dit comment te connecter,
quoi tester et quoi nous remonter.

---

## URL de test

**À remplacer par l'URL Vercel Preview réelle** une fois la preview
déployée (le lien restera stable tant que la branche `wip/preprod-hardening`
existe sur GitHub) :

```
https://renocalcpro-saas-git-wip-preprod-hardening-XXX.vercel.app
```

⚠ **C'est un environnement de test.** Zéro paiement réel, zéro donnée
partagée à Stripe, tu peux tout casser sans risque.

## Comptes de démonstration prêts à l'emploi

Deux comptes déjà créés — tu peux te connecter directement sans t'inscrire :

| Type de compte     | Email                        | Mot de passe |
| ------------------ | ---------------------------- | ------------ |
| **Particulier**    | `demo.particulier@test.local` | `demo1234`   |
| **Professionnel**  | `demo.pro@test.local`         | `demo1234`   |

Le compte particulier voit **1 projet démo** (maison à Lyon).
Le compte pro voit **2 projets démo** (copropriété Paris + bureaux Lille).

Tu peux aussi créer ton propre compte via **Créer un compte** — un magic
link sera envoyé (en mode démo, il est loggé côté serveur, tu peux
demander à ce qu'on te le récupère).

## Parcours à tester (par ordre d'importance)

### Parcours 1 — Découverte / homepage (2 min)

1. Ouvre l'URL sur ton téléphone ET sur ton ordi
2. Homepage `/fr`
3. Menu principal → **Fonctionnalités**, **Tarifs**, **À propos**, **Contact**
4. Pied de page → CGU / CGV / Mentions légales / Cookies / Confidentialité

**Objectif** : est-ce que la promesse RenocalcPro est claire en 30 s ?
Qu'est-ce qui accroche, qu'est-ce qui perd ?

### Parcours 2 — Compte particulier (5 min)

1. Sign in avec `demo.particulier@test.local` / `demo1234`
2. Dashboard → tu vois "Ma maison à Lyon"
3. Ouvre le projet → parcours toutes les onglets/sections
4. **Diagnostic** : vérifie que tu peux remplir/modifier
5. **Scénarios** : compare ECO vs PERFORMANT, lis les détails
6. **Aides** : combien récupère-t-on, quelles conditions ?
7. **Financement** : est-ce clair combien tu payes vraiment de ta poche ?
8. **Rapport** : vérifie que la synthèse s'affiche

### Parcours 3 — Compte pro (5 min)

1. Sign in avec `demo.pro@test.local` / `demo1234`
2. Dashboard pro → 2 projets clients (copro + tertiaire)
3. Ouvre "Copropriété 24 lots — Paris 19e"
4. Explore la fiche projet, les scénarios, les aides
5. Regarde si la vue "professionnel" te semble différente / mieux adaptée que la vue particulier

### Parcours 4 — Créer un projet from scratch (5 min)

1. Depuis n'importe quel compte : **Nouveau projet**
2. Renseigne : type, adresse, année, surface
3. Va jusqu'au bout du parcours
4. **Objectif** : est-ce que ça bloque quelque part ? Y a-t-il un champ qui te surprend ?

### Parcours 5 — Test responsive (5 min)

Ouvre sur téléphone (iPhone ou Android) :
1. Tout parcours 1 & 2
2. Est-ce que la lecture est confortable ?
3. Les boutons sont-ils cliquables sans zoom ?
4. Est-ce que les tableaux/graphes sont lisibles ?

## Quoi nous remonter

### ⚡ Priorité 1 — Bloquant
- Impossible de se connecter ?
- Erreur `404 Not Found` ?
- Erreur `500 Internal Server Error` ?
- Bouton qui plante ou ne fait rien ?
- Formulaire qui ne valide pas ?

### 💡 Priorité 2 — Ergonomie
- Ce qui manque (fonctionnalité attendue absente)
- Ce qui est confus (terminologie, disposition)
- Ce qui est répétitif ou trop long
- Ce qui semble faux (chiffres bizarres, textes mal placés)

### 🎨 Priorité 3 — Cosmétique
- Bugs d'affichage (mais pas critiques)
- Suggestions d'améliorations visuelles
- Fautes d'orthographe / grammaire

**Format idéal du retour** :
> Page : `/fr/p/projects/demo-projet-1/scenarios`
> Contexte : compte pro, iPhone 13
> Problème : le bouton "Comparer" ne renvoie rien
> Reproduction : clic sur "Comparer" en haut de la liste

Envoie par email, SMS, ou vocal — comme tu préfères.

## Limites connues du mode preview

- **Emails désactivés** : magic links loggés côté serveur, pas envoyés dans ta boîte
- **Paiements simulés** : boutons "Souscrire" / "Passer à Pro" simulent le succès sans facturer (aucune carte demandée)
- **Assistant IA off** : l'aide contextuelle Claude est désactivée (coût token)
- **Uploads temporaires** : fichiers stockés en `/tmp` du serveur, perdus au prochain déploiement
- **Base de données démo** : partagée entre tous les testeurs — attention à ne pas casser les données des autres
- **Base réveil lent** : si l'app dort depuis 5+ min, le premier chargement peut prendre 5-10 s

## Ce qui n'est pas encore là

- **Personnalisation scénarios** : la création de bouquets sur-mesure n'est pas complète
- **Uploads photos** : tu peux uploader, mais les vignettes reviennent parfois cassées
- **Rapport PDF téléchargeable** : partiel, certains blocs sont en mock
- **AI Assistant** : entièrement désactivé en preview

## Merci !

Ton retour aide à prioriser la vraie mise en production prévue **fin 2026**.
Toutes les remontées sont lues et priorisées — pas la peine d'être diplomate,
plus c'est direct, plus c'est utile.
