"use client";
import { useState } from "react";
import { FileText, ChevronRight } from "lucide-react";

export default function TermsPage() {
  const [active, setActive] = useState(null);

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms", content: `By accessing or using LawHelpZone ("Platform," "we," "us"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, please do not use the platform.

These Terms apply to all users, including clients, lawyers, and visitors. We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated via email.

Users must be 18 years of age or older. By using the platform, you represent and warrant that you meet this requirement.` },

    { id: "services", title: "2. Description of Services", content: `LawHelpZone is an online marketplace that connects individuals and businesses ("Clients") with licensed legal professionals ("Lawyers"). We provide:

• A platform for Clients to post legal cases and receive proposals
• A directory of verified, licensed lawyers searchable by specialty and location
• Secure messaging, document sharing, and video consultation tools
• Case management and payment processing infrastructure

LawHelpZone is a technology platform and facilitator — not a law firm. We do not provide legal advice. The relationship is between the Client and the Lawyer, not LawHelpZone and the Client.` },

    { id: "accounts", title: "3. User Accounts", content: `Registration: You must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your credentials.

Account Security: Notify us immediately of any unauthorized use at security@lawhelpzone.com. You are responsible for all activity under your account.

Lawyer Verification: Lawyers must submit valid bar credentials, which we verify with the relevant bar association. Misrepresenting credentials is grounds for immediate termination and may result in legal action.

Account Termination: We reserve the right to suspend or terminate accounts for violations of these Terms, fraudulent activity, or actions harmful to other users or the platform.` },

    { id: "client", title: "4. Client Terms", content: `Case Posting: You may post legal cases and receive proposals from lawyers. Case information should be accurate and not misleading.

Engagement: By accepting a proposal, you enter into a direct legal services agreement with the lawyer. LawHelpZone is not party to this agreement.

Payment: Fees are agreed directly between you and the lawyer. Payments are processed through our secure escrow system. Funds are held until milestones are confirmed or disputes are resolved.

Attorney-Client Privilege: Communications with lawyers through the platform are protected by attorney-client privilege to the same extent as traditional communications.

Reviews: Post-case ratings and reviews must be honest and based on genuine experience. False, defamatory, or malicious reviews will be removed.` },

    { id: "lawyer", title: "5. Lawyer Terms", content: `Eligibility: You must be a licensed attorney in good standing with your bar association. You are responsible for maintaining your license and informing us of any changes.

Professional Responsibility: All professional rules, ethics guidelines, and regulations of your jurisdiction apply to your conduct on the platform. LawHelpZone does not supersede professional rules.

Proposals: Proposals must be honest, achievable, and comply with your jurisdiction's rules on fee agreements.

Fees: LawHelpZone charges a platform fee as described in our Lawyer Pricing page. This is deducted from client payments before disbursement to you.

Conflicts of Interest: You are solely responsible for performing conflict checks before accepting cases.` },

    { id: "prohibited", title: "6. Prohibited Conduct", content: `You agree not to:

• Impersonate any person or entity or misrepresent your credentials
• Post false, misleading, or fraudulent case information
• Harass, abuse, threaten, or intimidate other users
• Attempt to solicit users off-platform to avoid platform fees
• Use the platform for money laundering or other illegal activities
• Share login credentials or allow others to use your account
• Scrape, crawl, or use automated tools to access the platform
• Post content that is defamatory, obscene, or violates third-party rights
• Attempt to interfere with platform security or functionality
• Violate any applicable law or regulation

Violations may result in immediate account termination and potential legal action.` },

    { id: "payment", title: "7. Payments & Fees", content: `Client Payments: Clients pay through our secure escrow system. Payments are held until both parties confirm milestone completion or a dispute is resolved.

Lawyer Payouts: Once a milestone is confirmed, LawHelpZone releases payment minus the platform fee to the lawyer's registered payout account within 2-3 business days.

Platform Fees: Current fee structure is available at lawhelpzone.com/pricing. We reserve the right to modify fees with 30 days' notice.

Disputes: Payment disputes are handled through our dispute resolution process. See Section 9 for details.

Refunds: Refunds are issued at LawHelpZone's discretion or per the terms agreed between client and lawyer.

Taxes: Each party is responsible for their own taxes. LawHelpZone will provide tax documents (1099, etc.) as required by law.` },

    { id: "content", title: "8. Content & Intellectual Property", content: `Your Content: You retain ownership of content you post. By posting, you grant LawHelpZone a non-exclusive, worldwide license to display and host your content solely to provide the service.

Our Content: All platform content, including design, code, and text, is owned by LawHelpZone and protected by copyright law.

DMCA: We comply with the Digital Millennium Copyright Act. To report copyright infringement, contact legal@lawhelpzone.com.

Confidentiality: Case information and communications are confidential. Do not disclose confidential information shared through the platform outside the engagement.` },

    { id: "disputes", title: "9. Dispute Resolution", content: `Informal Resolution: If a dispute arises, first contact us at support@lawhelpzone.com. We will attempt to resolve it informally within 30 days.

Arbitration: If informal resolution fails, disputes will be resolved by binding arbitration under the rules of the American Arbitration Association (AAA) or equivalent body in your jurisdiction. Class action waiver applies.

Governing Law: These Terms are governed by the laws of England and Wales, without regard to conflict of law principles.

Exceptions: Either party may seek emergency injunctive relief in court to prevent irreparable harm.` },

    { id: "liability", title: "10. Limitation of Liability", content: `To the maximum extent permitted by law:

LawHelpZone is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.

Our total liability to you for any claim arising from use of the platform is limited to the fees you paid to LawHelpZone in the 12 months preceding the claim.

LawHelpZone does not warrant that the platform will be uninterrupted, error-free, or completely secure.

We are not responsible for the quality, competence, or conduct of lawyers on the platform. We perform credential verification but do not guarantee outcomes.` },

    { id: "contact", title: "11. Contact", content: `For questions about these Terms:

Legal Department: legal@lawhelpzone.com
Address: LawHelpZone Ltd, 123 Legal Street, London, EC1A 1BB, UK
Phone: +44 20 1234 5678

For platform support: support@lawhelpzone.com` },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} a{color:inherit}`}</style>

      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <FileText size={20} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#34d399" }}>TERMS OF SERVICE</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 10 }}>Terms of Service</h1>
          <p style={{ opacity: 0.7, fontSize: 15 }}>Last updated: January 15, 2025 · Effective: February 1, 2025</p>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 10, maxWidth: 580, lineHeight: 1.7 }}>
            Please read these Terms carefully before using LawHelpZone. They explain your rights, obligations, and our responsibilities.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, alignItems: "start" }}>
        <div style={{ position: "sticky", top: 24, background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setActive(s.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", textDecoration: "none", fontSize: 12.5, color: active === s.id ? "#0A1A3F" : "#64748b", fontWeight: active === s.id ? 600 : 400, background: active === s.id ? "#f0f4ff" : "transparent", borderLeft: active === s.id ? "3px solid #3b82f6" : "3px solid transparent", transition: "all 0.15s" }}>
              {s.title.replace(/^\d+\. /, "")} <ChevronRight size={11} />
            </a>
          ))}
        </div>

        <div>
          {sections.map((s) => (
            <div key={s.id} id={s.id} style={{ background: "white", borderRadius: 14, padding: "28px 32px", border: "1px solid #e2e8f0", marginBottom: 18 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#0A1A3F", marginBottom: 14 }}>{s.title}</h2>
              <div style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.85, whiteSpace: "pre-line" }}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}