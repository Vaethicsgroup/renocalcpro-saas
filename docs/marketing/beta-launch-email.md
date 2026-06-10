# Email annonce mailing list — Beta program

Pour envoi via Resend ou Mailjet à une liste de prospects/anciens utilisateurs.

## Objet (FR)

Options A/B :
- A : « 100 places en avant-première : devenez beta tester ✨ »
- B : « 12 mois Pro gratuits — programme beta ouvert ✨ »

## Corps HTML simple

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width:600px; margin:0 auto; padding:32px 16px; color:#1c1917;">

  <h1 style="font-family: Georgia, serif; color:#0f766e; font-size:32px; margin-bottom:8px;">
    100 places en avant-première
  </h1>
  <p style="color:#78716c; margin-top:0;">Programme Beta tester Réno·Calc Pro</p>

  <p>Bonjour,</p>

  <p>On ouvre aujourd'hui le programme Beta tester de Réno·Calc Pro. Cette fois c'est 100 personnes maximum, premier arrivé premier servi.</p>

  <h2 style="color:#0f766e; font-size:20px;">Ce que vous obtenez</h2>
  <ul style="padding-left:20px;">
    <li><strong>12 mois Pro gratuit</strong> (valeur 1 549 €)</li>
    <li>Accès anticipé 2-3 semaines avant la sortie publique</li>
    <li>Roadmap influencée par votre feedback</li>
    <li>Statut « Beta tester » + crédit dans /changelog</li>
  </ul>

  <h2 style="color:#0f766e; font-size:20px;">Ce qu'on attend</h2>
  <ul style="padding-left:20px;">
    <li>Tester ≥ 1 nouvelle feature par mois</li>
    <li>Mini-form feedback mensuel (5 min)</li>
    <li>Optionnel : 1 call 30 min tous les 3 mois</li>
  </ul>

  <h2 style="color:#0f766e; font-size:20px;">Pour qui ?</h2>
  <p>En priorité auditeurs OPQIBI, diagnostiqueurs DPE certifiés AFNOR, syndics, bureaux d'études thermiques. Profils annexes étudiés cas par cas.</p>

  <p style="text-align:center; margin: 32px 0;">
    <a href="https://renocalcpro.fr/fr/beta?utm_source=email&utm_campaign=beta_launch_2026"
       style="background:#0d9488; color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
      Postuler en 2 minutes →
    </a>
  </p>

  <p>Acceptation sous 5 jours ouvrés.</p>

  <p>À très vite,<br>
  <strong>Flora & l'équipe Réno·Calc Pro</strong></p>

  <hr style="margin-top:48px; border:none; border-top:1px solid #e7e5e4;">
  <p style="color:#78716c; font-size:12px;">
    Vous recevez cet email car vous avez interagi avec Réno·Calc Pro précédemment.<br>
    <a href="{{unsubscribeUrl}}" style="color:#78716c;">Se désabonner</a> ·
    <a href="https://renocalcpro.fr/fr/legal/privacy" style="color:#78716c;">Politique de confidentialité</a>
  </p>
</body>
</html>
```

## Plain text version (toujours inclure)

```
100 places en avant-première — Programme Beta tester Réno·Calc Pro

Bonjour,

On ouvre aujourd'hui le programme Beta tester de Réno·Calc Pro.
100 personnes maximum, premier arrivé premier servi.

Ce que vous obtenez :
- 12 mois Pro gratuit (valeur 1 549 €)
- Accès anticipé 2-3 semaines avant la sortie publique
- Roadmap influencée par votre feedback
- Statut « Beta tester » + crédit dans /changelog

Ce qu'on attend :
- Tester ≥ 1 nouvelle feature par mois
- Mini-form feedback mensuel (5 min)
- Optionnel : 1 call 30 min tous les 3 mois

Pour qui ?
Auditeurs OPQIBI, diagnostiqueurs DPE AFNOR, syndics, bureaux d'études thermiques.

Postuler en 2 minutes :
https://renocalcpro.fr/fr/beta?utm_source=email&utm_campaign=beta_launch_2026

Acceptation sous 5 jours ouvrés.

À très vite,
Flora & l'équipe Réno·Calc Pro

---
Se désabonner : {{unsubscribeUrl}}
Politique : https://renocalcpro.fr/fr/legal/privacy
```

## Tracking

- UTM source `email`
- UTM campaign `beta_launch_2026`
- UTM medium `newsletter`
- Mesure conversion : POST /beta soumis avec ces UTM → vu dans `/admin/abtests` (testName: `beta_funnel`)
