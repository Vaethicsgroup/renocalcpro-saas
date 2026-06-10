// app/maintenance/page.tsx — Page maintenance brandée.
// À activer via env MAINTENANCE_MODE=true → middleware redirige tout ici.

export const metadata = { title: "Maintenance en cours — Réno·Calc Pro" };

export default function MaintenancePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", color: "white", padding: 32, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }} aria-hidden>🛠</div>
        <h1 style={{ fontFamily: "Source Serif 4, Georgia, serif", fontSize: 40, fontWeight: 700, lineHeight: 1.1, margin: 0 }}>
          Maintenance en cours
        </h1>
        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6, color: "#d6f5f0" }}>
          Nous procédons à une mise à jour pour vous offrir une meilleure expérience.
          Le service revient d'ici quelques minutes.
        </p>
        <p style={{ marginTop: 24, fontSize: 14, color: "#9fe1cb" }}>
          Pour toute urgence : <a href="mailto:contact@renocalcpro.fr" style={{ color: "#fbbf24" }}>contact@renocalcpro.fr</a>
        </p>
        <p style={{ marginTop: 40, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Réno·Calc Pro · Hébergé en France
        </p>
      </div>
    </div>
  );
}
