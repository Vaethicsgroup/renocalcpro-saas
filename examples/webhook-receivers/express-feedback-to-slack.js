// examples/webhook-receivers/express-feedback-to-slack.js
//
// Exemple receiver Réno·Calc Pro : consomme les events ASSISTANT_FEEDBACK_RECEIVED
// et publie une notification Slack via incoming webhook.
//
// Usage :
//   npm install express
//   RENOCAL_HMAC_SECRET=... SLACK_WEBHOOK_URL=https://hooks.slack.com/... \
//     node express-feedback-to-slack.js
//
// Configuration côté Réno·Calc Pro :
//   POST /o/settings/webhooks → URL pointant ici, événement "ASSISTANT_FEEDBACK_RECEIVED"
//   secret HMAC partagé via RENOCAL_HMAC_SECRET

const express = require("express");
const crypto = require("crypto");

const HMAC_SECRET = process.env.RENOCAL_HMAC_SECRET;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
if (!HMAC_SECRET || !SLACK_URL) {
  console.error("RENOCAL_HMAC_SECRET et SLACK_WEBHOOK_URL requis.");
  process.exit(1);
}

const app = express();

// IMPORTANT : keep le body raw pour vérifier la signature HMAC
app.use(express.raw({ type: "application/json" }));

app.post("/webhooks/renocal", async (req, res) => {
  const signature = req.header("X-Renocal-Signature");
  const timestamp = req.header("X-Renocal-Timestamp");
  if (!signature || !timestamp) {
    return res.status(400).json({ error: "missing_signature" });
  }

  // Anti-replay : refuser si timestamp > 5 min écart
  const ageS = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (ageS > 300) {
    return res.status(401).json({ error: "stale_timestamp" });
  }

  // Vérifier signature HMAC SHA-256 (timing-safe)
  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`${timestamp}.${req.body.toString("utf8")}`)
    .digest("hex");
  const received = signature.replace(/^sha256=/, "");
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  ) {
    return res.status(401).json({ error: "invalid_signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "invalid_json" });
  }

  // Filtrer : on ne traite que ASSISTANT_FEEDBACK_RECEIVED
  if (event.event !== "ASSISTANT_FEEDBACK_RECEIVED") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const d = event.data ?? {};
  const emoji = d.helpful === true ? "👍" : d.helpful === false ? "👎" : "💬";
  const message = {
    text: `${emoji} Feedback assistant IA`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${emoji} Feedback assistant IA*\n` +
            `• Helpful : *${d.helpful === true ? "Oui" : d.helpful === false ? "Non" : "Neutre"}*\n` +
            `• Catégorie problème : ${d.issueKind ?? "(aucune)"}\n` +
            `• Commentaire libre fourni : ${d.hasComment ? "Oui (consultez l'app)" : "Non"}\n` +
            `• Conversation : \`${d.conversationId}\`\n` +
            `• Message : \`${d.messageId ?? "(non précisé)"}\`\n` +
            `• Reçu : ${d.createdAt}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Voir la conversation" },
            url: `https://renocalcpro.fr/fr/o/ai-assistant/${d.conversationId}`,
          },
        ],
      },
    ],
  };

  try {
    const slackResp = await fetch(SLACK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!slackResp.ok) {
      console.error("Slack webhook failed:", slackResp.status);
      return res.status(502).json({ error: "slack_failed" });
    }
  } catch (e) {
    console.error("Slack error:", e);
    return res.status(502).json({ error: "slack_error" });
  }

  console.log(`[${new Date().toISOString()}] Feedback ${d.feedbackId} relayé vers Slack`);
  res.status(200).json({ ok: true });
});

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`Webhook receiver écoute sur http://localhost:${port}/webhooks/renocal`);
});
