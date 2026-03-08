"use client";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Mail, ArrowRight } from "lucide-react";

export default function PressPage() {
  const router = useRouter();

  const pressItems = [
    { outlet: "TechCrunch", logo: "TC", date: "Feb 2025", headline: "LawHelpZone Raises $24M to Democratize Legal Services Globally", url: "#", color: "#1da462" },
    { outlet: "Forbes", logo: "F", date: "Jan 2025", headline: "How LawHelpZone Is Closing the Justice Gap for Millions", url: "#", color: "#c41000" },
    { outlet: "Financial Times", logo: "FT", date: "Dec 2024", headline: "Legal Tech Startups Disrupt the $900B Legal Services Market", url: "#", color: "#ff7700" },
    { outlet: "BBC Business", logo: "BBC", date: "Nov 2024", headline: "The Platform Making Legal Help Accessible Worldwide", url: "#", color: "#b80000" },
    { outlet: "The Guardian", logo: "G", date: "Oct 2024", headline: "Online Legal Marketplaces: A New Era for Access to Justice", url: "#", color: "#052962" },
    { outlet: "Wired", logo: "W", date: "Sep 2024", headline: "Meet the Startup That Wants to Be the Airbnb of Legal Services", url: "#", color: "#1a1a1a" },
  ];

  const awards = [
    { title: "Best Legal Tech Platform 2025", org: "LegalTech Awards", emoji: "🏆" },
    { title: "Top 50 Startups to Watch", org: "Forbes", emoji: "⭐" },
    { title: "Innovation in Access to Justice", org: "Law Society UK", emoji: "⚖️" },
    { title: "Best Startup — RegTech & Legal", org: "TechCrunch Disrupt", emoji: "🚀" },
  ];

  const assets = [
    { name: "LawHelpZone Logo Pack", desc: "PNG, SVG, dark and light versions", size: "2.4 MB" },
    { name: "Brand Guidelines", desc: "Colors, typography, usage rules", size: "1.1 MB" },
    { name: "Executive Headshots", desc: "CEO, CTO, and leadership team", size: "8.7 MB" },
    { name: "Product Screenshots", desc: "App UI screenshots — all platforms", size: "12.3 MB" },
    { name: "Fact Sheet 2025", desc: "Key stats, milestones, and company background", size: "0.4 MB" },
    { name: "Series B Press Release", desc: "Full announcement with quotes", size: "0.2 MB" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .press-card { background:white; border-radius:14px; border:1px solid #e2e8f0; padding:22px 24px; transition:all 0.3s; }
        .press-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.1); }
        .asset-row:hover { background:#f8fafc !important; }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#34d399", marginBottom: 12 }}>PRESS & MEDIA</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, marginBottom: 16 }}>Press Room</h1>
          <p style={{ opacity: 0.75, fontSize: 16, lineHeight: 1.7, maxWidth: 540, marginBottom: 28 }}>
            For media enquiries, interview requests, brand assets, and official statements about LawHelpZone.
          </p>
          <a href="mailto:press@lawhelpzone.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#10b981", color: "white", padding: "12px 24px", borderRadius: 50, fontWeight: 600, fontSize: 15, textDecoration: "none", transition: "all 0.2s" }}>
            <Mail size={16} /> press@lawhelpzone.com
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 52 }}>
          {[["50,000+", "Cases Resolved"], ["1,200+", "Verified Lawyers"], ["40+", "Countries"], ["$32M", "Total Funding"]].map(([v, l], i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: "20px 16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#0A1A3F" }}>{v}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Press Coverage */}
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, marginBottom: 24, color: "#0A1A3F" }}>In the Press</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, marginBottom: 52 }}>
          {pressItems.map((item, i) => (
            <div key={i} className="press-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: item.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{item.logo}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{item.outlet}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{item.date}</div>
                </div>
              </div>
              <p style={{ fontSize: 14.5, color: "#374151", lineHeight: 1.6, marginBottom: 14, fontWeight: 500 }}>{item.headline}</p>
              <a href={item.url} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#3b82f6", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                Read Article <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>

        {/* Awards */}
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, marginBottom: 24, color: "#0A1A3F" }}>Awards & Recognition</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 52 }}>
          {awards.map((a, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "22px 20px", border: "1px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{a.emoji}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A1A3F", marginBottom: 6 }}>{a.title}</h3>
              <p style={{ fontSize: 13, color: "#64748b" }}>{a.org}</p>
            </div>
          ))}
        </div>

        {/* Brand Assets */}
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, marginBottom: 24, color: "#0A1A3F" }}>Brand Assets & Downloads</h2>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 52 }}>
          {assets.map((asset, i) => (
            <div key={i} className="asset-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: i < assets.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.15s" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{asset.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{asset.desc} · {asset.size}</div>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", color: "#374151", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                <Download size={13} /> Download
              </button>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", borderRadius: 20, padding: "40px 36px", color: "white", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Get in Touch</h2>
          <p style={{ opacity: 0.75, fontSize: 15, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 28px" }}>
            For interview requests, press enquiries, or speaking opportunities, our communications team is ready to help.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:press@lawhelpzone.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#10b981", color: "white", padding: "12px 24px", borderRadius: 50, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
              <Mail size={15} /> Contact Press Team
            </a>
            <button onClick={() => router.push("/about")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.3)", padding: "11px 24px", borderRadius: 50, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
              About LawHelpZone <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}