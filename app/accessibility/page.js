// =====================================================
// ACCESSIBILITY PAGE  →  app/accessibility/page.jsx
// =====================================================
"use client";
import { Eye, Keyboard, Volume2, Smartphone, CheckCircle, Mail } from "lucide-react";

export function AccessibilityPage() {
  const commitments = [
    { icon: <Eye size={22} />, title: "Visual Accessibility", color: "#3b82f6", items: ["Minimum 4.5:1 color contrast ratio across all text", "High-contrast mode available in Settings", "Text resizable up to 200% without loss of content", "No reliance on color alone to convey information", "Alt text on all meaningful images and icons"] },
    { icon: <Keyboard size={22} />, title: "Keyboard Navigation", color: "#10b981", items: ["Full keyboard navigation with visible focus indicators", "Logical tab order throughout all pages", "Skip navigation links on all pages", "No keyboard traps — always escapable", "Custom keyboard shortcuts documented in Settings"] },
    { icon: <Volume2 size={22} />, title: "Screen Reader Support", color: "#8b5cf6", items: ["Semantic HTML with proper heading hierarchy", "ARIA labels and landmarks throughout", "Live regions for dynamic content updates", "Form error announcements", "Compatible with NVDA, JAWS, VoiceOver, TalkBack"] },
    { icon: <Smartphone size={22} />, title: "Motor & Touch Accessibility", color: "#f59e0b", items: ["Touch targets minimum 44×44px", "Sufficient spacing between interactive elements", "No time limits on important actions (extendable)", "Pointer cancellation — drag/click can be cancelled", "Motion can be reduced in OS accessibility settings"] },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Eye size={20} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#34d399" }}>ACCESSIBILITY</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 12 }}>Accessibility Statement</h1>
          <p style={{ opacity: 0.7, fontSize: 15 }}>Last updated: January 15, 2025</p>
          <p style={{ opacity: 0.72, fontSize: 15, marginTop: 12, maxWidth: 600, lineHeight: 1.7 }}>
            LawHelpZone is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Compliance Status */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "24px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
          <CheckCircle size={28} color="#10b981" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>WCAG 2.1 AA Conformance</h2>
            <p style={{ fontSize: 14, color: "#047857", lineHeight: 1.6 }}>
              LawHelpZone aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. We conduct regular accessibility audits and user testing with assistive technologies.
            </p>
          </div>
        </div>

        {/* Commitments */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 20, marginBottom: 32 }}>
          {commitments.map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "24px 28px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}18`, color: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{c.title}</h3>
              </div>
              <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {c.items.map((item, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                    <CheckCircle size={13} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Known Issues */}
        <div style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F", marginBottom: 16 }}>Known Limitations</h2>
          <p style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.8, marginBottom: 12 }}>
            We are actively working to resolve the following known accessibility issues:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Video call interface (Jitsi) — third-party tool with some accessibility gaps. We are evaluating alternatives.", "Complex data tables in case management may require improved screen reader navigation.", "Some PDF documents uploaded by users may not be tagged for accessibility."].map((item, i) => (
              <li key={i} style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Feedback */}
        <div style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Mail size={20} color="#3b82f6" />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F" }}>Feedback & Contact</h2>
          </div>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
            We welcome feedback on the accessibility of LawHelpZone. If you experience any barriers or have suggestions for improvement, please let us know:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14.5, color: "#475569" }}>
            <p>📧 Email: <a href="mailto:accessibility@lawhelpzone.com" style={{ color: "#3b82f6" }}>accessibility@lawhelpzone.com</a></p>
            <p>📞 Phone: <a href="tel:+442012345678" style={{ color: "#3b82f6" }}>+44 20 1234 5678</a> (available Mon–Fri, 9AM–5PM GMT)</p>
            <p>We aim to respond within 3 business days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessibilityPage;