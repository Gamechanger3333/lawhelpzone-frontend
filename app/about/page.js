"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Users, Globe, Shield, Award, Heart, Target, Linkedin, Twitter } from "lucide-react";

export default function AboutPage() {
  const router = useRouter();
  const [visible, setVisible] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setVisible((v) => ({ ...v, [e.target.dataset.id]: true })); });
    }, { threshold: 0.12 });
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reg = (id) => (el) => { refs.current[id] = el; if (el) el.dataset.id = id; };

  const team = [
    { name: "Aisha Karimi", role: "CEO & Co-Founder", bio: "Former attorney with 12 years in international law. Passionate about access to justice.", emoji: "👩‍💼" },
    { name: "David Osei", role: "CTO & Co-Founder", bio: "Full-stack engineer who built legal tech platforms for Fortune 500 companies.", emoji: "👨‍💻" },
    { name: "Priya Nair", role: "Head of Legal", bio: "Ex-partner at a top-tier firm. Ensures our platform meets the highest legal standards.", emoji: "⚖️" },
    { name: "Carlos Vega", role: "VP of Product", bio: "Product leader with a decade of experience building marketplaces and trust platforms.", emoji: "🎯" },
    { name: "Yuki Tanaka", role: "Head of Design", bio: "Award-winning UX designer focused on making complex systems feel effortless.", emoji: "🎨" },
    { name: "Amara Diallo", role: "VP of Growth", bio: "Growth strategist who scaled three B2C legal platforms from 0 to 1M+ users.", emoji: "📈" },
  ];

  const values = [
    { icon: <Shield size={24} />, title: "Trust First", desc: "Every decision we make starts with whether it builds or erodes trust between clients and lawyers.", color: "#3b82f6" },
    { icon: <Globe size={24} />, title: "Access for All", desc: "Legal help shouldn't be a privilege. We build for everyone, everywhere, in every language.", color: "#10b981" },
    { icon: <Heart size={24} />, title: "Human-Centered", desc: "Behind every case is a person facing a real challenge. We never forget that.", color: "#ef4444" },
    { icon: <Target size={24} />, title: "Accountability", desc: "We hold ourselves and the professionals on our platform to the highest standards.", color: "#8b5cf6" },
  ];

  const milestones = [
    { year: "2019", event: "LawHelpZone founded in London by two attorneys frustrated with outdated legal services" },
    { year: "2020", event: "Launched beta with 50 lawyers in the UK. First 1,000 client cases resolved" },
    { year: "2021", event: "Series A funding of $8M. Expanded to 12 countries. Passed 10,000 registered lawyers" },
    { year: "2022", event: "Launched video consultations and document collaboration. Reached 100K active clients" },
    { year: "2023", event: "Series B of $24M. Entered North America, Middle East, and Southeast Asia" },
    { year: "2024", event: "Surpassed 1,200 verified lawyers. 50,000+ cases resolved with 98% satisfaction rate" },
    { year: "2025", event: "Launched AI-assisted case matching. Named 'Best Legal Tech Platform' at LegalTech Awards" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fafafa", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .reveal { opacity:0; transform:translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .team-card:hover { transform:translateY(-6px); box-shadow:0 16px 48px rgba(0,0,0,0.12) !important; }
        .cta-btn { background: linear-gradient(135deg,#0A1A3F,#1e3a6e); color:white; border:none; padding:14px 36px; border-radius:50px; font-size:16px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.3s; }
        .cta-btn:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(10,26,63,0.4); }
      `}</style>

      {/* Hero */}
      <section style={{ background: "linear-gradient(150deg, #0A1A3F, #1e3a6e)", color: "white", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeUp 0.8s ease" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: "#34d399", marginBottom: 16 }}>OUR STORY</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(42px, 6vw, 68px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Justice Shouldn't<br />Be Out of Reach
          </h1>
          <p style={{ fontSize: 18, opacity: 0.82, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 40px" }}>
            LawHelpZone was built by lawyers who believed that finding trusted legal help should be as easy as booking a restaurant. We're on a mission to close the justice gap, one case at a time.
          </p>
          <button className="cta-btn" onClick={() => router.push("/how-it-works")} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            See How It Works <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "white", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[["50,000+", "Cases Resolved"], ["1,200+", "Verified Lawyers"], ["40+", "Countries"], ["98%", "Satisfaction"]].map(([v, l], i) => (
            <div key={i} style={{ textAlign: "center", padding: "32px 16px", borderRight: i < 3 ? "1px solid #eee" : "none" }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: "#0A1A3F" }}>{v}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div ref={reg("mission")} className={`reveal ${visible["mission"] ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#10b981", marginBottom: 12 }}>OUR MISSION</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>
              Democratizing Access to Legal Services
            </h2>
            <p style={{ fontSize: 15.5, color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
              Every year, millions of people navigate complex legal situations alone — not because they don't want help, but because they can't find or afford it. We built LawHelpZone to change that.
            </p>
            <p style={{ fontSize: 15.5, color: "#475569", lineHeight: 1.8 }}>
              By connecting clients directly with verified lawyers on a transparent, secure platform, we remove the barriers — high fees, geographic limits, and information asymmetry — that keep people from getting the justice they deserve.
            </p>
          </div>
          <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderRadius: 20, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚖️</div>
            <blockquote style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontStyle: "italic", color: "#0A1A3F", lineHeight: 1.6 }}>
              "Legal help is a right, not a luxury. We exist to make that real."
            </blockquote>
            <p style={{ marginTop: 16, fontSize: 14, color: "#64748b", fontWeight: 500 }}>— Aisha Karimi, CEO</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div ref={reg("vals-head")} className={`reveal ${visible["vals-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#10b981", marginBottom: 12 }}>WHAT WE STAND FOR</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700 }}>Our Core Values</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {values.map((v, i) => (
              <div key={i} ref={reg(`val-${i}`)} className={`reveal ${visible[`val-${i}`] ? "visible" : ""}`}
                style={{ background: "#f8fafc", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", transitionDelay: `${i * 0.1}s` }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${v.color}18`, color: v.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>{v.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, fontFamily: "'Playfair Display', Georgia, serif" }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "80px 24px", background: "#f8f7f4" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div ref={reg("timeline-head")} className={`reveal ${visible["timeline-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#10b981", marginBottom: 12 }}>OUR JOURNEY</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700 }}>Milestones</h2>
          </div>
          <div style={{ position: "relative", paddingLeft: 40 }}>
            <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, width: 2, background: "#e2e8f0" }} />
            {milestones.map((m, i) => (
              <div key={i} ref={reg(`ms-${i}`)} className={`reveal ${visible[`ms-${i}`] ? "visible" : ""}`}
                style={{ position: "relative", marginBottom: 32, transitionDelay: `${i * 0.08}s` }}>
                <div style={{ position: "absolute", left: -34, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: "3px solid white", boxShadow: "0 0 0 2px #10b981" }} />
                <div style={{ background: "white", borderRadius: 12, padding: "18px 22px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>{m.year}</div>
                  <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{m.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div ref={reg("team-head")} className={`reveal ${visible["team-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#10b981", marginBottom: 12 }}>THE PEOPLE BEHIND IT</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700 }}>Leadership Team</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {team.map((member, i) => (
              <div key={i} ref={reg(`tm-${i}`)} className={`team-card reveal ${visible[`tm-${i}`] ? "visible" : ""}`}
                style={{ background: "#f8fafc", borderRadius: 16, padding: "28px 24px", border: "1px solid #e2e8f0", transition: "all 0.3s ease", transitionDelay: `${i * 0.08}s` }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>
                  {member.emoji}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{member.name}</h3>
                <p style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 12 }}>{member.role}</p>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "80px 24px", textAlign: "center" }}>
        <div ref={reg("cta")} className={`reveal ${visible["cta"] ? "visible" : ""}`} style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, marginBottom: 16 }}>Join Our Mission</h2>
          <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7, marginBottom: 36 }}>
            Whether you're a client seeking help or a lawyer wanting to make a difference — LawHelpZone is for you.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-btn" onClick={() => router.push("/auth/signup?role=lawyer")} style={{ background: "#10b981" }}>
              Get Started <ArrowRight size={16} />
            </button>
            <button onClick={() => router.push("/careers")} style={{ background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.3)", padding: "13px 32px", borderRadius: "50px", cursor: "pointer", fontSize: 15, fontWeight: 600, transition: "all 0.2s" }}>
              We're Hiring
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}