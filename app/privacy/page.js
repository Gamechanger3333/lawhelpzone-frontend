// =====================================================
// PRIVACY POLICY PAGE
// Path: app/privacy/page.jsx
// =====================================================
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, ExternalLink } from "lucide-react";

export function PrivacyPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    {
      id: "collection",
      title: "1. Information We Collect",
      content: `We collect information you provide directly when you create an account, post a case, or communicate through the platform. This includes:

• Personal identifiers: name, email address, phone number, date of birth
• Professional information: bar credentials, specializations, years of experience (for lawyers)
• Case information: legal issues, documents, case descriptions you submit
• Communication data: messages, files, and video call metadata between users
• Technical data: IP address, device type, browser, operating system, and usage patterns
• Payment information: processed securely through our payment processors (we never store card details)

We also collect information automatically when you use the platform, including log data, cookies, and similar tracking technologies.`
    },
    {
      id: "use",
      title: "2. How We Use Your Information",
      content: `We use the information we collect to:

• Provide, maintain, and improve our platform and services
• Match clients with appropriate legal professionals
• Verify lawyer credentials and maintain platform integrity
• Process payments and prevent fraud
• Send service-related communications (case updates, security alerts)
• Send marketing communications (with your consent — you can opt out anytime)
• Comply with legal obligations and enforce our Terms of Service
• Conduct analytics to improve user experience
• Resolve disputes and troubleshoot issues

We do not sell your personal information to third parties. Ever.`
    },
    {
      id: "sharing",
      title: "3. Information Sharing",
      content: `We share your information only in these circumstances:

With other users: Profile information visible to other platform users (lawyers see client case details to submit proposals; clients see lawyer profiles). Private messages are only visible to the parties involved.

With service providers: Trusted third-party vendors who help us operate the platform (cloud hosting, payment processing, email delivery, analytics). All vendors are bound by data processing agreements.

For legal reasons: When required by law, court order, or to protect rights, safety, or property of LawHelpZone, our users, or the public.

Business transfers: In connection with a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before this occurs.

With your consent: Any other sharing will only happen with your explicit permission.`
    },
    {
      id: "security",
      title: "4. Data Security",
      content: `We take data security seriously and implement industry-standard measures:

• All data transmitted is encrypted using TLS 1.3
• Messages between users are end-to-end encrypted
• Sensitive data is encrypted at rest using AES-256
• We conduct regular security audits and penetration testing
• Access to user data is role-based and logged
• We maintain a responsible disclosure policy for security researchers
• In the event of a data breach, we will notify affected users within 72 hours

However, no system is 100% secure. We encourage you to use strong passwords and enable two-factor authentication.`
    },
    {
      id: "rights",
      title: "5. Your Rights & Choices",
      content: `Depending on your location, you may have rights including:

• Access: Request a copy of your personal data
• Correction: Update inaccurate or incomplete data
• Deletion: Request deletion of your account and data ("right to be forgotten")
• Portability: Receive your data in a structured, machine-readable format
• Objection: Object to processing of your data for marketing or profiling
• Restriction: Request we limit how we use your data

To exercise these rights, contact us at privacy@lawhelpzone.com or use the Privacy Settings in your dashboard. We will respond within 30 days.

GDPR (EEA users): LawHelpZone is GDPR compliant. Our legal basis for processing is contract performance, legitimate interests, and consent.
CCPA (California users): We do not sell personal information. You may opt out of targeted advertising.`
    },
    {
      id: "retention",
      title: "6. Data Retention",
      content: `We retain your information as long as your account is active or as needed to provide services. Specific retention periods:

• Account data: Until you delete your account, plus 30 days
• Case data: 7 years (required for legal compliance in most jurisdictions)
• Message history: 3 years from last activity
• Payment records: 7 years (tax and financial regulations)
• Log data: 90 days
• Backup copies: 30 days after deletion

After retention periods expire, data is permanently deleted from our systems.`
    },
    {
      id: "cookies",
      title: "7. Cookies & Tracking",
      content: `We use cookies and similar technologies. See our full Cookie Policy for details. In summary:

• Essential cookies: Required for the platform to function (cannot be disabled)
• Analytics cookies: Help us understand how users use the platform
• Preference cookies: Remember your settings and preferences
• Marketing cookies: Used for relevant advertising (with your consent)

You can manage cookie preferences in your browser settings or through our Cookie Preference Centre accessible from the footer.`
    },
    {
      id: "children",
      title: "8. Children's Privacy",
      content: `LawHelpZone is not directed to children under 18. We do not knowingly collect personal information from minors. If we learn we have collected information from a child, we will delete it promptly.

If you believe a minor has provided us with personal information, please contact privacy@lawhelpzone.com.`
    },
    {
      id: "changes",
      title: "9. Changes to This Policy",
      content: `We may update this Privacy Policy periodically. When we make material changes, we will:

• Post the updated policy with a new "Last Updated" date
• Send an email notification to registered users
• Display a banner on the platform for 30 days

Continued use of the platform after changes constitutes acceptance of the updated policy.`
    },
    {
      id: "contact",
      title: "10. Contact Us",
      content: `For privacy questions, requests, or concerns:

Email: privacy@lawhelpzone.com
Data Protection Officer: dpo@lawhelpzone.com
Address: LawHelpZone Ltd, 123 Legal Street, London, EC1A 1BB, United Kingdom

For EEA users, you also have the right to lodge a complaint with your local supervisory authority.`
    },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Shield size={22} color="#34d399" />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#34d399" }}>PRIVACY POLICY</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 12 }}>Your Privacy Matters</h1>
          <p style={{ opacity: 0.75, fontSize: 16, lineHeight: 1.7 }}>Last updated: January 15, 2025 · Effective: February 1, 2025</p>
          <p style={{ opacity: 0.75, fontSize: 15, lineHeight: 1.7, marginTop: 12, maxWidth: 600 }}>
            We believe you have the right to know exactly what data we collect, why we collect it, and how you can control it. This policy is written in plain language — no legal jargon.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, alignItems: "start" }}>
        {/* Sidebar Nav */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", textDecoration: "none", fontSize: 13, color: activeSection === s.id ? "#0A1A3F" : "#64748b", fontWeight: activeSection === s.id ? 600 : 400, background: activeSection === s.id ? "#f0f4ff" : "transparent", borderLeft: activeSection === s.id ? "3px solid #3b82f6" : "3px solid transparent", transition: "all 0.15s" }}
                onClick={() => setActiveSection(s.id)}>
                {s.title.split(". ")[1]} <ChevronRight size={12} />
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div>
          {sections.map((s) => (
            <div key={s.id} id={s.id} style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1A3F", marginBottom: 16 }}>{s.title}</h2>
              <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, whiteSpace: "pre-line" }}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;