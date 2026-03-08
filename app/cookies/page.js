// =====================================================
// COOKIE POLICY PAGE  →  app/cookies/page.jsx
// =====================================================
"use client";
import { useState, useEffect } from "react";
import { Cookie, ToggleLeft, ToggleRight, Check } from "lucide-react";

export function CookiesPage() {
  const [prefs, setPrefs] = useState({ essential: true, analytics: true, marketing: false, preferences: true });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => { if (key === "essential") return; setPrefs((p) => ({ ...p, [key]: !p[key] })); setSaved(false); };

  const save = () => {
    localStorage.setItem("cookiePrefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("cookiePrefs");
    if (stored) try { setPrefs({ essential: true, ...JSON.parse(stored) }); } catch {}
  }, []);

  const cookieTypes = [
    { key: "essential", label: "Essential Cookies", desc: "Required for the platform to function. Cannot be disabled.", required: true, examples: ["Session authentication", "Security tokens", "Load balancing", "Cookie preferences"] },
    { key: "analytics", label: "Analytics Cookies", desc: "Help us understand how users interact with the platform so we can improve it.", required: false, examples: ["Page views and navigation paths", "Feature usage statistics", "Error tracking", "Performance monitoring"] },
    { key: "preferences", label: "Preference Cookies", desc: "Remember your settings and personalisation choices.", required: false, examples: ["Language and region settings", "Theme preference (dark/light)", "Notification settings", "Dashboard layout"] },
    { key: "marketing", label: "Marketing Cookies", desc: "Used to show relevant ads and measure campaign effectiveness.", required: false, examples: ["Ad targeting", "Remarketing pixels", "Social media integration", "Campaign attribution"] },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} @keyframes pop{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}`}</style>

      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Cookie size={20} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#34d399" }}>COOKIE POLICY</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 10 }}>Cookie Policy & Preferences</h1>
          <p style={{ opacity: 0.7, fontSize: 15 }}>Last updated: January 15, 2025</p>
          <p style={{ opacity: 0.72, fontSize: 14, marginTop: 10, maxWidth: 560, lineHeight: 1.7 }}>
            We use cookies to make the platform work and to improve your experience. You can control most of them below.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>

        {/* What are cookies */}
        <div style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F", marginBottom: 14 }}>What Are Cookies?</h2>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 12 }}>
            Cookies are small text files stored on your device when you visit a website. They help websites remember information about your visit, making your experience more efficient and personalized.
          </p>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8 }}>
            We also use similar technologies like local storage, session storage, and pixels. When we say "cookies" in this policy, we mean all of these technologies.
          </p>
        </div>

        {/* Cookie Preferences Control */}
        <div style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F" }}>Manage Your Preferences</h2>
            <button onClick={save} style={{ background: saved ? "#10b981" : "#0A1A3F", color: "white", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" }}>
              {saved ? <><Check size={14} /> Saved!</> : "Save Preferences"}
            </button>
          </div>

          {cookieTypes.map((ct) => (
            <div key={ct.key} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20, display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{ct.label}</h3>
                  {ct.required && <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 50 }}>Required</span>}
                </div>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 10 }}>{ct.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ct.examples.map((ex, i) => (
                    <span key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, padding: "3px 10px", borderRadius: 50 }}>{ex}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => toggle(ct.key)} style={{ background: "none", border: "none", cursor: ct.required ? "not-allowed" : "pointer", color: prefs[ct.key] ? "#10b981" : "#cbd5e1", flexShrink: 0, marginTop: 2, opacity: ct.required ? 0.5 : 1 }}>
                {prefs[ct.key] ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => { setPrefs({ essential: true, analytics: false, marketing: false, preferences: false }); setSaved(false); }} style={{ background: "#f1f5f9", color: "#374151", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              Reject All Non-Essential
            </button>
            <button onClick={() => { setPrefs({ essential: true, analytics: true, marketing: true, preferences: true }); setSaved(false); }} style={{ background: "#f1f5f9", color: "#374151", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              Accept All
            </button>
          </div>
        </div>

        {/* Cookie List */}
        <div style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F", marginBottom: 20 }}>Specific Cookies We Use</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Name", "Type", "Purpose", "Expires"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["auth_token", "Essential", "Authenticates your session", "Session"],
                  ["csrf_token", "Essential", "Prevents cross-site request forgery", "Session"],
                  ["cookie_prefs", "Essential", "Stores your cookie preferences", "1 year"],
                  ["_ga", "Analytics", "Google Analytics — distinguishes users", "2 years"],
                  ["_gid", "Analytics", "Google Analytics — session identifier", "24 hours"],
                  ["ui_theme", "Preferences", "Stores dark/light mode preference", "1 year"],
                  ["lang", "Preferences", "Stores language preference", "1 year"],
                  ["_fbp", "Marketing", "Facebook Pixel — ad attribution", "90 days"],
                ].map(([name, type, purpose, expires], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0A1A3F", fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: { Essential: "#dbeafe", Analytics: "#d1fae5", Preferences: "#fef3c7", Marketing: "#ede9fe" }[type], color: { Essential: "#1d4ed8", Analytics: "#065f46", Preferences: "#92400e", Marketing: "#5b21b6" }[type], padding: "2px 8px", borderRadius: 50, fontSize: 11, fontWeight: 600 }}>{type}</span></td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>{purpose}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: "24px 32px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0A1A3F", marginBottom: 12 }}>Questions?</h2>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
            Contact our privacy team at <a href="mailto:privacy@lawhelpzone.com" style={{ color: "#3b82f6" }}>privacy@lawhelpzone.com</a> if you have questions about our use of cookies. For more on your privacy rights, see our full <a href="/privacy" style={{ color: "#3b82f6" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CookiesPage;