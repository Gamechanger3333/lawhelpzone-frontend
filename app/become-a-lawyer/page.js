"use client";
// app/become-a-lawyer/page.jsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, BookOpen, Award, Users, Star, ArrowRight,
  Download, FileText, Video, Globe, DollarSign,
  MessageSquare, Briefcase, Shield, ChevronDown,
  GraduationCap, Laptop, ExternalLink, Search, X,
  MapPin, Loader2,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API       = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const getToken  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const authHdr   = () => ({ "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) });

/* ── Helpers ──────────────────────────────────────────────────────── */
const getRole = () => {
  try {
    const p = localStorage.getItem("persist:auth");
    if (!p) return null;
    return JSON.parse(JSON.parse(p).user || "null")?.role || null;
  } catch { return null; }
};

const goProtected = (router, path, redirectPath) => {
  if (!getToken() || !getRole()) {
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
  } else {
    router.push(path);
  }
};

/* ── Static data ──────────────────────────────────────────────────── */
const STEPS = [
  { num: "01", icon: GraduationCap, color: "#3b82f6", title: "Complete Legal Education",   desc: "Obtain an LLB degree from an accredited university (3–5 years).",       tips: ["Core subjects: Constitutional Law, Contract Law, Tort Law", "Maintain a strong GPA (3.0+ recommended)", "Participate in moot court and legal clinics"] },
  { num: "02", icon: BookOpen,       color: "#10b981", title: "Pass the Bar Examination",    desc: "Pass the Bar Council examination in your jurisdiction.",                  tips: ["Register with your local Bar Council", "Prepare for 6+ months using bar prep materials", "Complete internship/pupillage (6–12 months)"] },
  { num: "03", icon: Scale,          color: "#f59e0b", title: "Get Licensed to Practice",   desc: "Obtain your practising certificate and fulfil CLE requirements.",          tips: ["File for admission to the bar", "Pay annual licensing fees", "Complete required CLE hours"] },
  { num: "04", icon: Shield,         color: "#8b5cf6", title: "Register on LawHelpZone",    desc: "Create your lawyer profile — verified within 24–48 hours.",                tips: ["Upload bar licence and credentials", "Complete your professional profile", "Set your availability and consultation fees"] },
];

const COURSES = [
  { title: "Introduction to Pakistani Law",  provider: "Virtual University", duration: "40 hours", level: "Beginner",     free: true,  link: "https://www.vu.edu.pk"       },
  { title: "Contract Law Fundamentals",      provider: "Coursera",          duration: "30 hours", level: "Beginner",     free: false, price: "$49", link: "https://www.coursera.org" },
  { title: "Criminal Law & Procedure",       provider: "edX",               duration: "60 hours", level: "Intermediate", free: false, price: "$89", link: "https://www.edx.org"     },
  { title: "Corporate & Business Law",       provider: "Khan Academy",      duration: "20 hours", level: "Beginner",     free: true,  link: "https://www.khanacademy.org" },
  { title: "Legal Research & Writing",       provider: "LUMS Online",       duration: "25 hours", level: "Intermediate", free: false, price: "$35", link: "https://www.lums.edu.pk" },
  { title: "Family Law in Pakistan",         provider: "LawHelpZone",       duration: "15 hours", level: "Beginner",     free: true,  link: "#"                            },
];

const BOOKS = [
  { title: "Principles of Pakistani Law",        author: "Justice (R) Fazal Karim",  cat: "Foundation"    },
  { title: "The Law of Contracts",               author: "Pollock & Mulla",           cat: "Contract Law"  },
  { title: "Criminal Law (PPC)",                 author: "Dr. Sohail Mehmood",        cat: "Criminal Law"  },
  { title: "Constitutional Law of Pakistan",     author: "A.G. Noorani",              cat: "Constitutional"},
  { title: "Family Laws in Pakistan",            author: "Justice Mamoon Kazi",       cat: "Family Law"    },
  { title: "Legal Drafting & Pleadings",         author: "Khurshid Iqbal Chaudhry",  cat: "Practice"      },
];

const TEMPLATES = [
  { name: "Power of Attorney Template", pages: 3,  downloads: 1240, type: "PDF"  },
  { name: "General Legal Notice",       pages: 2,  downloads: 890,  type: "DOCX" },
  { name: "Employment Contract",        pages: 8,  downloads: 2100, type: "DOCX" },
  { name: "Tenancy Agreement",          pages: 6,  downloads: 1670, type: "PDF"  },
  { name: "Sale Deed Template",         pages: 10, downloads: 780,  type: "PDF"  },
  { name: "Bail Application",           pages: 4,  downloads: 560,  type: "DOCX" },
];

const FAQS = [
  { q: "How long does it take to become a lawyer in Pakistan?",  a: "Typically 5–6 years: 4 years LLB + 6–12 months internship + Bar exam." },
  { q: "What is the fee for Bar Council enrollment?",            a: "Punjab Bar Council charges ~PKR 5,000–10,000 initially; annual renewal ~PKR 1,000–3,000." },
  { q: "Can I practise in any province after enrollment?",       a: "Initially in your province's bar council; transfer to other High Courts requires a separate application." },
  { q: "How much can a lawyer earn in Pakistan?",               a: "Junior lawyers ~PKR 30,000–80,000/mo; senior lawyers in large firms PKR 200,000–1,000,000+/mo." },
  { q: "How does LawHelpZone verify lawyer credentials?",        a: "We verify bar licence, CNIC, and bar council certificate manually within 24–48 hours." },
];

/* ── Accordion ────────────────────────────────────────────────────── */
function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border-color,#e2e8f0)" }}>
      <button onClick={() => setOpen((p) => !p)}
        style={{ width: "100%", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{q}</span>
        <ChevronDown size={18} style={{ color: "var(--text-muted,#64748b)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 20px 18px", fontSize: 14, color: "var(--text-muted,#64748b)", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

/* ── Inline lawyer search dropdown ───────────────────────────────── */
function LawyerSearch({ router }) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const debRef  = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    if (!query.trim()) { setResults([]); setShowDrop(false); return; }
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/lawyers?search=${encodeURIComponent(query.trim())}&limit=5`, {
          credentials: "include", headers: authHdr(),
        });
        if (r.ok) {
          const d = await r.json();
          setResults(d.lawyers || (Array.isArray(d) ? d : []));
          setShowDrop(true);
        }
      } catch {}
      finally { setLoading(false); }
    }, 300);
  }, [query]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setShowDrop(false);
    router.push(query.trim() ? `/browse-lawyers?search=${encodeURIComponent(query.trim())}` : "/browse-lawyers");
  };

  const handleMsg  = (id) => goProtected(router, `/dashboard/${getRole()}/messages?contact=${id}`,    "/become-a-lawyer");
  const handleCall = (id) => goProtected(router, `/dashboard/${getRole()}/video-calls?contact=${id}`, "/become-a-lawyer");

  return (
    <div ref={wrapRef} style={{ maxWidth: 560, margin: "0 auto 24px", position: "relative" }}>
      <form onSubmit={handleSubmit}
        style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.95)", borderRadius: 14, padding: "4px 6px 4px 14px", border: "1px solid rgba(255,255,255,0.2)", gap: 8 }}>
        <Search size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          placeholder="Search registered lawyers…"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#0f172a", padding: "8px 0" }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setResults([]); setShowDrop(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px 4px" }}>
            <X size={14} />
          </button>
        )}
        <button type="submit"
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          Search
        </button>
      </form>

      {showDrop && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid #f1f5f9", overflow: "hidden", zIndex: 999 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", color: "#94a3b8", fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Searching registered lawyers…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 13 }}>No lawyers found for "{query}"</div>
          ) : (
            <>
              <div style={{ padding: "10px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Registered Lawyers</span>
                <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>🔒 Login to contact</span>
              </div>

              {results.map((l) => {
                const lp      = l.lawyerProfile || {};
                const name    = l.name || "Lawyer";
                const spec    = lp.specializations?.[0] || lp.specialization || "General Law";
                const rating  = lp.rating || 0;
                const isAvail = lp.isAvailable !== false;
                return (
                  <div key={l._id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0f9ff"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    {/* Avatar */}
                    <div style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "2px solid #e2e8f0", flexShrink: 0 }}>
                      {l.profileImage
                        ? <img src={l.profileImage} style={{ width: 40, height: 40, objectFit: "cover" }} alt="" />
                        : <div style={{ width: 40, height: 40, background: "#0A1A3F", color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>{name.charAt(0)}</div>}
                      {isAvail && <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, background: "#10b981", border: "2px solid #fff", borderRadius: "50%" }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: "#3b82f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{spec}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                        {rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#f59e0b", fontWeight: 700 }}><Star size={9} fill="currentColor" />{rating}</span>}
                        {(l.city || lp.city) && <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#94a3b8" }}><MapPin size={9} />{l.city || lp.city}</span>}
                        {lp.consultationFee
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>PKR {Number(lp.consultationFee).toLocaleString()}</span>
                          : <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Free</span>}
                      </div>
                    </div>

                    {/* Protected buttons */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleMsg(l._id)}
                        title="Login required to message"
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, background: "#0A1A3F", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        <MessageSquare size={11} /> Msg
                      </button>
                      <button onClick={() => handleCall(l._id)}
                        title="Login required to call"
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        <Video size={11} /> Call
                      </button>
                    </div>
                  </div>
                );
              })}

              <button onClick={handleSubmit}
                style={{ width: "100%", padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#2563eb", background: "none", border: "none", borderTop: "1px solid #f1f5f9", cursor: "pointer" }}>
                View all results for "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Page                                                              */
/* ══════════════════════════════════════════════════════════════════ */
export default function BecomeALawyerPage() {
  const router = useRouter();
  const [registeredLawyers, setRegisteredLawyers] = useState([]);
  const [activeTab, setTab] = useState("courses");

  useEffect(() => {
    fetch(`${API}/api/lawyers?limit=4`, { credentials: "include", headers: authHdr() })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setRegisteredLawyers(d.lawyers || []); })
      .catch(() => {});
  }, []);

  const handleMsg  = (id) => goProtected(router, `/dashboard/${getRole()}/messages?contact=${id}`,    "/become-a-lawyer");
  const handleCall = (id) => goProtected(router, `/dashboard/${getRole()}/video-calls?contact=${id}`, "/become-a-lawyer");

  return (
    <>
      <style>{`
        @keyframes fd{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .step-card:hover{box-shadow:0 12px 32px rgba(0,0,0,0.1)!important;transform:translateY(-2px)!important;}
        .step-card,.res-card{transition:all 0.2s ease!important;}
        .res-card:hover{box-shadow:0 6px 20px rgba(0,0,0,0.08)!important;}
        .animate-spin{animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0A1A3F 0%,#1e3a6e 60%,#1a3560 100%)", padding: "64px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 20, fontSize: 13, color: "#34d399", fontWeight: 700 }}>
            <Scale size={14} /> Join 500+ Lawyers on Our Platform
          </div>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>
            Become a Lawyer &<br /><span style={{ color: "#34d399" }}>Grow Your Practice</span>
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            Get guidance on becoming a licensed lawyer, access free courses, legal templates, and connect with clients.
          </p>

          {/* Live lawyer search */}
          <LawyerSearch router={router} />

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/signup?role=lawyer")}
              style={{ padding: "14px 32px", borderRadius: 14, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
              Register as Lawyer →
            </button>
            <button onClick={() => document.getElementById("how-steps")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 28px", borderRadius: 14, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              How to Become a Lawyer
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div style={{ background: "var(--card-bg,#fff)", borderBottom: "1px solid var(--border-color,#e2e8f0)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 20 }}>
          {[
            { v: "500+", l: "Registered Lawyers", icon: Users,    c: "#3b82f6" },
            { v: "10K+", l: "Cases Handled",       icon: Briefcase,c: "#10b981" },
            { v: "4.8/5",l: "Average Rating",      icon: Star,     c: "#f59e0b" },
            { v: "50+",  l: "Cities Covered",      icon: Globe,    c: "#8b5cf6" },
          ].map((s) => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.c}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} style={{ color: s.c }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{s.v}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px" }}>

        {/* ── Steps ────────────────────────────────────────────────────── */}
        <div id="how-steps" style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "var(--text-heading,#0f172a)" }}>How to Become a Lawyer in Pakistan</h2>
            <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted,#64748b)" }}>Follow these 4 steps to launch your legal career</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} className="step-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#e2e8f0)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: `fd 0.4s ease ${i * 0.1}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${step.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <step.icon size={22} style={{ color: step.color }} />
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 900, color: `${step.color}40` }}>{step.num}</span>
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{step.title}</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted,#64748b)", lineHeight: 1.6 }}>{step.desc}</p>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {step.tips.map((t) => <li key={t} style={{ fontSize: 12, color: "var(--text-muted,#64748b)", marginBottom: 4, lineHeight: 1.5 }}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Resource Tabs ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: "var(--text-heading,#0f172a)" }}>Legal Resources & Tools</h2>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
            {[{ k: "courses", l: "📚 Courses" }, { k: "books", l: "📖 Books" }, { k: "templates", l: "📄 Templates" }, { k: "software", l: "💻 Software" }].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                style={{ padding: "10px 20px", borderRadius: 20, border: `1px solid ${activeTab === t.k ? "#0A1A3F" : "var(--border-color,#e2e8f0)"}`, background: activeTab === t.k ? "#0A1A3F" : "var(--card-bg,#fff)", color: activeTab === t.k ? "#fff" : "var(--text-muted,#64748b)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {t.l}
              </button>
            ))}
          </div>

          {activeTab === "courses" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {COURSES.map((c, i) => (
                <div key={c.title} className="res-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1px solid var(--border-color,#e2e8f0)", padding: 20, animation: `fd 0.3s ease ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: c.level === "Beginner" ? "#f0fdf4" : "#fef3c7", color: c.level === "Beginner" ? "#10b981" : "#d97706" }}>{c.level}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.free ? "#10b981" : "#0f172a" }}>{c.free ? "Free" : c.price}</span>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{c.title}</h4>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-muted,#64748b)" }}>{c.provider} • {c.duration}</p>
                  <a href={c.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#eff6ff", color: "#3b82f6", textDecoration: "none", fontSize: 13, fontWeight: 700, border: "1px solid #bfdbfe" }}>
                    <ExternalLink size={13} /> Enroll Now
                  </a>
                </div>
              ))}
            </div>
          )}

          {activeTab === "books" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {BOOKS.map((b, i) => (
                <div key={b.title} className="res-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1px solid var(--border-color,#e2e8f0)", padding: 18, display: "flex", gap: 14, alignItems: "flex-start", animation: `fd 0.3s ease ${i * 0.07}s both` }}>
                  <div style={{ width: 44, height: 56, borderRadius: 8, background: "linear-gradient(135deg,#0A1A3F,#1e3a6e)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#f5f3ff", color: "#7c3aed" }}>{b.cat}</span>
                    <h4 style={{ margin: "6px 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{b.title}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>by {b.author}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "templates" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {TEMPLATES.map((t, i) => (
                <div key={t.name} className="res-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1px solid var(--border-color,#e2e8f0)", padding: 18, animation: `fd 0.3s ease ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 40, height: 48, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} style={{ color: "#d97706" }} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{t.name}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{t.pages} pages • {t.type} • {t.downloads.toLocaleString()} downloads</p>
                    </div>
                  </div>
                  <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Download size={13} /> Download Free
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "software" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {[
                { name: "Clio Manage",    desc: "Complete legal practice management", free: false, price: "$39/mo", cat: "Practice Mgmt", link: "https://www.clio.com"          },
                { name: "LexisNexis",     desc: "Legal research and analytics",       free: false, price: "$65/mo", cat: "Research",      link: "https://www.lexisnexis.com"    },
                { name: "Google Scholar", desc: "Free legal case research",           free: true,                   cat: "Research",      link: "https://scholar.google.com"    },
                { name: "Notion",         desc: "Document management for law firms",  free: true,                   cat: "Documents",     link: "https://www.notion.so"         },
                { name: "PakLaw",         desc: "Pakistan legal database & case law", free: false, price: "$25/mo", cat: "Pakistani Law", link: "#"                             },
                { name: "DocuSign",       desc: "Electronic signatures for legal docs",free:false, price: "$15/mo", cat: "E-Signatures",  link: "https://www.docusign.com"      },
              ].map((s, i) => (
                <div key={s.name} className="res-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1px solid var(--border-color,#e2e8f0)", padding: 20, animation: `fd 0.3s ease ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6" }}>{s.cat}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.free ? "#10b981" : "#64748b" }}>{s.free ? "Free" : s.price}</span>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{s.name}</h4>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted,#64748b)" }}>{s.desc}</p>
                  <a href={s.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#3b82f6", textDecoration: "none" }}>
                    Try it <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Consult Registered Lawyers ────────────────────────────────── */}
        {registeredLawyers.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: "var(--text-heading,#0f172a)" }}>Consult with Professional Lawyers</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted,#64748b)" }}>Talk to our registered lawyers for career guidance</p>
              {!getToken() && (
                <p style={{ marginTop: 8, fontSize: 13, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "6px 14px", display: "inline-block" }}>
                  🔒 <strong>Login required</strong> to send messages or make video calls
                </p>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {registeredLawyers.map((l) => {
                const lp = l.lawyerProfile || {};
                return (
                  <div key={l._id} className="res-card" style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1px solid var(--border-color,#e2e8f0)", padding: 20, textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#10b981", color: "#fff", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", overflow: "hidden" }}>
                      {l.profileImage
                        ? <img src={l.profileImage} style={{ width: 52, height: 52, objectFit: "cover" }} alt="" />
                        : (l.name || "L").charAt(0)}
                    </div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{l.name}</h4>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#3b82f6" }}>{lp.specializations?.[0] || "Lawyer"}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleMsg(l._id)}
                        style={{ flex: 1, padding: 8, borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <MessageSquare size={12} /> Message
                      </button>
                      <button onClick={() => handleCall(l._id)}
                        style={{ flex: 1, padding: 8, borderRadius: 10, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Video size={12} /> Call
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => router.push("/browse-lawyers")}
                style={{ padding: "12px 28px", borderRadius: 12, background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                View All Lawyers →
              </button>
            </div>
          </div>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: "var(--text-heading,#0f172a)" }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#e2e8f0)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {FAQS.map((f) => <AccordionItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg,#0A1A3F,#1e3a6e)", borderRadius: 24, padding: "48px 32px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px,3vw,32px)", fontWeight: 900 }}>Ready to Start Your Legal Career?</h2>
          <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.7)", fontSize: 15, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
            Join thousands of lawyers on LawHelpZone and grow your practice.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/signup?role=lawyer")}
              style={{ padding: "14px 32px", borderRadius: 14, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
              Register as Lawyer →
            </button>
            <button onClick={() => router.push("/browse-lawyers")}
              style={{ padding: "14px 28px", borderRadius: 14, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Browse Lawyers
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}