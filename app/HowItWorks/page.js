"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserCheck, MessageSquare, Scale, Shield, Clock,
  CheckCircle, ArrowRight, Star, Users, FileText, Video,
  ChevronDown, ChevronUp, Zap, Award, Globe, Lock
} from "lucide-react";

export default function HowItWorksPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);
  const [visible, setVisible] = useState({});
  const [role, setRole] = useState("client"); // "client" | "lawyer"
  const refs = useRef({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible((v) => ({ ...v, [e.target.dataset.id]: true }));
        });
      },
      { threshold: 0.15 }
    );
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const register = (id) => (el) => {
    refs.current[id] = el;
    if (el) el.dataset.id = id;
  };

  const handleGetStarted = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const persist = localStorage.getItem("persist:auth");
      let userRole = "client";
      if (persist) {
        try { userRole = JSON.parse(JSON.parse(persist).user || "{}").role || "client"; } catch {}
      }
      router.push(`/dashboard/${userRole}`);
    } else {
      router.push("/auth/login");
    }
  };

  const clientSteps = [
    {
      icon: <UserCheck size={28} />,
      color: "#3b82f6",
      title: "Create Your Account",
      desc: "Sign up in under 2 minutes. Tell us about your legal needs so we can match you with the right experts.",
      detail: "No credit card required. Your information is encrypted and confidential from day one.",
    },
    {
      icon: <Search size={28} />,
      color: "#10b981",
      title: "Post Your Case or Browse Lawyers",
      desc: "Describe your legal issue and let lawyers come to you — or search our verified network directly.",
      detail: "Filter by specialization, location, language, fee range, and ratings.",
    },
    {
      icon: <FileText size={28} />,
      color: "#8b5cf6",
      title: "Review Proposals",
      desc: "Receive detailed proposals from qualified lawyers. Compare fees, expertise, and approach.",
      detail: "Each proposal includes the lawyer's strategy, timeline estimate, and transparent pricing.",
    },
    {
      icon: <MessageSquare size={28} />,
      color: "#f59e0b",
      title: "Consult & Collaborate",
      desc: "Chat, video call, and share documents securely with your chosen lawyer inside the platform.",
      detail: "All communications are end-to-end encrypted and archived for your records.",
    },
    {
      icon: <CheckCircle size={28} />,
      color: "#10b981",
      title: "Resolve Your Case",
      desc: "Work together toward resolution. Pay securely once milestones are met.",
      detail: "Rate your experience and help others find great legal help.",
    },
  ];

  const lawyerSteps = [
    {
      icon: <Award size={28} />,
      color: "#10b981",
      title: "Apply & Get Verified",
      desc: "Submit your bar credentials, specializations, and experience. Our team reviews within 48 hours.",
      detail: "We verify all licenses with official bar associations to maintain trust.",
    },
    {
      icon: <Globe size={28} />,
      color: "#3b82f6",
      title: "Build Your Profile",
      desc: "Showcase your expertise, past wins, and client testimonials. A compelling profile brings more cases.",
      detail: "Upload a professional photo, set your rates, and define your practice areas.",
    },
    {
      icon: <Zap size={28} />,
      color: "#8b5cf6",
      title: "Browse & Apply to Cases",
      desc: "See new cases matching your specialization in real time. Submit targeted proposals instantly.",
      detail: "Smart matching surfaces cases where your expertise is most needed.",
    },
    {
      icon: <Video size={28} />,
      color: "#f59e0b",
      title: "Serve Clients Efficiently",
      desc: "Use built-in messaging, video calls, and document sharing to serve clients without friction.",
      detail: "No third-party tools needed. Everything is inside LawHelpZone.",
    },
    {
      icon: <Lock size={28} />,
      color: "#ef4444",
      title: "Get Paid Securely",
      desc: "Receive payments directly through the platform. Track invoices and earnings in your dashboard.",
      detail: "Transparent fee structure. Fast payouts. Full payment history.",
    },
  ];

  const steps = role === "client" ? clientSteps : lawyerSteps;

  const features = [
    { icon: <Shield size={22} />, title: "Verified Lawyers Only", desc: "Every lawyer is background-checked and bar-certified before joining.", color: "#3b82f6" },
    { icon: <Lock size={22} />, title: "End-to-End Encryption", desc: "Messages, documents, and calls are fully encrypted.", color: "#10b981" },
    { icon: <Clock size={22} />, title: "24/7 Availability", desc: "Post cases or consult anytime — no office hours required.", color: "#8b5cf6" },
    { icon: <Star size={22} />, title: "Transparent Reviews", desc: "Real ratings from real clients. No paid placements.", color: "#f59e0b" },
    { icon: <Users size={22} />, title: "1,000+ Verified Lawyers", desc: "Covering all major areas of law across 30+ countries.", color: "#ef4444" },
    { icon: <Scale size={22} />, title: "All Legal Areas", desc: "Family, corporate, criminal, IP, immigration, and more.", color: "#6366f1" },
  ];

  const faqs = [
    { q: "How do I know the lawyers are legitimate?", a: "Every lawyer on LawHelpZone goes through a strict verification process. We confirm their bar registration, license status, and identity before they can accept cases. You can also see their ratings, reviews, and case history on their profile." },
    { q: "How much does it cost to post a case?", a: "Posting a case is completely free for clients. You only pay when you accept a lawyer's proposal and engage their services. Pricing is agreed upon directly between you and the lawyer — we never add hidden fees." },
    { q: "Can I consult a lawyer before committing?", a: "Yes. Many lawyers offer free or low-cost initial consultations. You can also send messages to lawyers before accepting any proposal. Use the platform to ask questions and assess fit before making any financial commitment." },
    { q: "Is my information kept confidential?", a: "Absolutely. All communications are end-to-end encrypted. We never share your personal information with third parties. Attorney-client privilege applies to all conversations with verified lawyers on the platform." },
    { q: "What if I'm not satisfied with my lawyer?", a: "You can end an engagement at any time before milestones are paid. Our dispute resolution team is available to mediate issues. We take client satisfaction seriously and have processes in place to protect your interests." },
    { q: "How do lawyers get paid?", a: "Lawyers receive payments through our secure escrow system. Funds are released when agreed milestones are completed. We support bank transfers and major payment methods. Typical payout time is 2-3 business days." },
    { q: "Can I use LawHelpZone from outside my country?", a: "Yes. LawHelpZone is a global platform. You can hire lawyers from your own country or from jurisdictions relevant to your case. Many lawyers specialize in international and cross-border legal matters." },
    { q: "I'm a lawyer. How do I join?", a: "Click 'Become a Lawyer' in the navigation. Submit your credentials and specializations. Our team reviews applications within 48 hours. Once approved, your profile goes live and you can start applying to cases immediately." },
  ];

  const stats = [
    { value: "50,000+", label: "Cases Resolved" },
    { value: "1,200+", label: "Verified Lawyers" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "4.2min", label: "Avg. First Response" },
  ];

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#f8f7f4", minHeight: "100vh", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Source Sans 3', sans-serif; }
        h1,h2,h3,h4 { font-family: 'Playfair Display', Georgia, serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes lineGrow {
          from { width: 0; } to { width: 64px; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .step-card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eee; transition: all 0.3s ease; cursor: default; }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.12); }

        .feature-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid #eee; transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }

        .faq-item { background: white; border-radius: 12px; border: 1px solid #eee; overflow: hidden; transition: box-shadow 0.3s; }
        .faq-item:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

        .tab-btn { padding: 10px 28px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; font-family: 'Source Sans 3', sans-serif; }

        .cta-btn { background: linear-gradient(135deg, #0A1A3F, #1e3a6e); color: white; border: none; padding: 16px 40px; border-radius: 50px; font-size: 17px; font-weight: 600; cursor: pointer; font-family: 'Source Sans 3', sans-serif; transition: all 0.3s; display: inline-flex; align-items: center; gap: 10px; }
        .cta-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(10,26,63,0.4); }

        .secondary-btn { background: transparent; color: #0A1A3F; border: 2px solid #0A1A3F; padding: 14px 36px; border-radius: 50px; font-size: 17px; font-weight: 600; cursor: pointer; font-family: 'Source Sans 3', sans-serif; transition: all 0.3s; }
        .secondary-btn:hover { background: #0A1A3F; color: white; }

        .connector-line { position: absolute; top: 44px; left: calc(50% + 44px); width: calc(100% - 88px); height: 2px; background: linear-gradient(90deg, #cbd5e1, #94a3b8); z-index: 0; }
        @media (max-width: 768px) { .connector-line { display: none; } }
      `}</style>

      {/* Hero */}
      <section style={{ background: "linear-gradient(150deg, #0A1A3F 0%, #1e3a6e 50%, #0A1A3F 100%)", color: "white", padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ animation: "fadeUp 0.8s ease both", maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", padding: "6px 20px", borderRadius: "50px", fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: 1, fontFamily: "'Source Sans 3', sans-serif" }}>
            SIMPLE · SECURE · EFFECTIVE
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            How LawHelpZone<br /><em style={{ color: "#34d399" }}>Works</em>
          </h1>
          <p style={{ fontSize: 19, opacity: 0.85, lineHeight: 1.7, marginBottom: 48, fontFamily: "'Source Sans 3', sans-serif", maxWidth: 560, margin: "0 auto 48px" }}>
            Connecting people with trusted legal expertise has never been this straightforward. From posting your case to resolution — we handle everything in between.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-btn" onClick={handleGetStarted} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button className="secondary-btn" onClick={() => router.push("/browse-lawyers")} style={{ borderColor: "rgba(255,255,255,0.4)", color: "white" }}>
              Browse Lawyers
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: "white", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "0 24px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "28px 16px", borderRight: i < 3 ? "1px solid #eee" : "none" }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#0A1A3F" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 4, fontFamily: "'Source Sans 3', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Role Tabs */}
      <section style={{ padding: "64px 24px 0", textAlign: "center" }}>
        <div ref={register("tabs")} className={`reveal ${visible["tabs"] ? "visible" : ""}`}>
          <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1.5, color: "#64748b", marginBottom: 16, fontFamily: "'Source Sans 3', sans-serif" }}>I AM A</p>
          <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: "50px", padding: 4, gap: 4 }}>
            {["client", "lawyer"].map((r) => (
              <button key={r} className="tab-btn" onClick={() => setRole(r)}
                style={{
                  background: role === r ? "#0A1A3F" : "transparent",
                  color: role === r ? "white" : "#64748b",
                  borderColor: "transparent",
                }}>
                {r === "client" ? "👤 Client Seeking Help" : "⚖️ Lawyer Offering Services"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: "60px 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div ref={register("steps-head")} className={`reveal ${visible["steps-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700 }}>
            {role === "client" ? "Get Legal Help in 5 Easy Steps" : "Start Earning with 5 Simple Steps"}
          </h2>
          <div style={{ width: 64, height: 3, background: "#10b981", borderRadius: 2, margin: "16px auto 0", animation: visible["steps-head"] ? "lineGrow 0.6s 0.3s ease both" : "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, position: "relative" }}>
          {steps.map((step, i) => (
            <div key={`${role}-${i}`} ref={register(`step-${i}`)} className={`step-card reveal ${visible[`step-${i}`] ? "visible" : ""}`}
              style={{ transitionDelay: `${i * 0.1}s`, position: "relative" }}>
              {/* Step number */}
              <div style={{ position: "absolute", top: -14, left: 24, background: step.color, color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: "'Source Sans 3', sans-serif", boxShadow: `0 4px 12px ${step.color}60` }}>
                {i + 1}
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, marginBottom: 20, marginTop: 8 }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.7, marginBottom: 14, fontFamily: "'Source Sans 3', sans-serif" }}>{step.desc}</p>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, fontFamily: "'Source Sans 3', sans-serif", fontStyle: "italic" }}>{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why LawHelpZone */}
      <section style={{ background: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div ref={register("features-head")} className={`reveal ${visible["features-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, color: "#10b981", marginBottom: 12, fontFamily: "'Source Sans 3', sans-serif" }}>WHY CHOOSE US</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700 }}>Built on Trust, Powered by Technology</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} ref={register(`feat-${i}`)} className={`feature-card reveal ${visible[`feat-${i}`] ? "visible" : ""}`}
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, fontFamily: "'Source Sans 3', sans-serif" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual process diagram */}
      <section style={{ background: "linear-gradient(135deg, #0A1A3F 0%, #1e3a6e 100%)", padding: "80px 24px", color: "white" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div ref={register("diagram")} className={`reveal ${visible["diagram"] ? "visible" : ""}`}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, marginBottom: 48 }}>
              The Journey from Problem to Resolution
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
              {["Post Case", "Match", "Consult", "Collaborate", "Resolved"].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ textAlign: "center", padding: "0 12px" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: i === 4 ? "#10b981" : "rgba(255,255,255,0.12)", border: `2px solid ${i === 4 ? "#10b981" : "rgba(255,255,255,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>
                      {["📝", "🔍", "💬", "🤝", "✅"][i]}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, fontFamily: "'Source Sans 3', sans-serif" }}>{label}</div>
                  </div>
                  {i < 4 && <div style={{ width: 40, height: 2, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 48, fontSize: 16, opacity: 0.7, fontFamily: "'Source Sans 3', sans-serif", maxWidth: 560, margin: "48px auto 0" }}>
              From your first post to final resolution — we're with you every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", maxWidth: 780, margin: "0 auto" }}>
        <div ref={register("faq-head")} className={`reveal ${visible["faq-head"] ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, color: "#10b981", marginBottom: 12, fontFamily: "'Source Sans 3', sans-serif" }}>QUESTIONS & ANSWERS</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700 }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item" ref={register(`faq-${i}`)}
              style={{ transitionDelay: `${i * 0.05}s` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", textAlign: "left", padding: "20px 24px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1a2e", fontFamily: "'Playfair Display', Georgia, serif" }}>{faq.q}</span>
                <span style={{ color: "#64748b", flexShrink: 0 }}>{openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 24px 20px", animation: "fadeIn 0.2s ease" }}>
                  <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, fontFamily: "'Source Sans 3', sans-serif" }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 0, padding: "80px 24px", textAlign: "center" }}>
        <div ref={register("cta")} className={`reveal ${visible["cta"] ? "visible" : ""}`} style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, marginBottom: 16, color: "#0A1A3F" }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.7, marginBottom: 40, fontFamily: "'Source Sans 3', sans-serif" }}>
            Join thousands of people who found the right legal help — or the right cases — through LawHelpZone.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-btn" onClick={handleGetStarted}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button className="secondary-btn" onClick={() => router.push("/become-a-lawyer")}>
              Join as a Lawyer
            </button>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: "#94a3b8", fontFamily: "'Source Sans 3', sans-serif" }}>
            No credit card required · Free to post · Verified lawyers only
          </p>
        </div>
      </section>
    </div>
  );
}