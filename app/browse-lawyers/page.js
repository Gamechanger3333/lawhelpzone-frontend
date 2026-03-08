"use client";
// app/browse-lawyers/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, MapPin, MessageSquare, Video,
  SlidersHorizontal, Award,
} from "lucide-react";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import LawyerSearchDropdown from "../components/LawyerSearchDropdown";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const SPECIALIZATIONS = [
  "All Specializations", "Criminal Law", "Family Law", "Business Law",
  "Real Estate", "Personal Injury", "Estate Planning", "Employment Law",
  "Tax Law", "Immigration", "Intellectual Property", "Constitutional Law",
];

/* ── Lawyer Card ─────────────────────────────────────────────────────────── */
function LawyerCard({ lawyer, onMessage, onCall, index }) {
  const lp      = lawyer.lawyerProfile || {};
  const name    = lawyer.name || "Lawyer";
  const spec    = lp.specializations?.[0] || lp.specialization || "General Law";
  const rating  = lp.rating || 5;
  const exp     = lp.yearsOfExperience;
  const fee     = lp.consultationFee;
  const isAvail = lp.isAvailable !== false;

  return (
    <div
      style={{
        background: "var(--card-bg,#fff)",
        borderRadius: 20,
        border: "1px solid var(--border-color,#f1f5f9)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
        transition: "all 0.2s",
        animation: `fd 0.4s ease ${index * 0.05}s both`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Card header */}
      <div style={{ background: "linear-gradient(135deg,#0A1A3F 0%,#1e3a6e 100%)", padding: "20px 20px 0", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", overflow: "hidden", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0, marginBottom: -24, zIndex: 1, position: "relative" }}>
            {lawyer.profileImage
              ? <img src={lawyer.profileImage} style={{ width: 72, height: 72, objectFit: "cover" }} alt="" />
              : <div style={{ width: 72, height: 72, background: "#10b981", color: "#fff", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{name.charAt(0)}</div>}
            {isAvail && <span style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} />}
          </div>
          <div style={{ paddingBottom: 28, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>{name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{spec}</p>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "28px 18px 18px" }}>
        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width={14} height={14} viewBox="0 0 24 24"
                fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
                stroke={s <= Math.round(rating) ? "#f59e0b" : "#d1d5db"} strokeWidth={2}>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{rating}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted,#94a3b8)" }}>({lp.totalReviews || 0} reviews)</span>
          {exp && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted,#94a3b8)" }}>{exp} yrs exp</span>}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {(lp.specializations || [spec]).slice(0, 3).map((s) => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac" }}>{s}</span>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted,#94a3b8)", marginBottom: 12 }}>
          {lawyer.city && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{lawyer.city}</span>}
          {lp.barCouncil && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Award size={11} />{lp.barCouncil}</span>}
        </div>

        {lawyer.bio && (
          <p style={{ fontSize: 12, color: "var(--text-muted,#64748b)", lineHeight: 1.5, margin: "0 0 14px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {lawyer.bio}
          </p>
        )}

        {/* Fee + Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border-color,#f1f5f9)" }}>
          <div>
            {fee ? (
              <>
                <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Consultation</p>
                <p style={{ margin: "1px 0 0", fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>PKR {fee.toLocaleString()}</p>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>Free Consultation</span>
            )}
          </div>
          {/* ── Protected contact buttons ────────────────────────────────── */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onMessage(lawyer)}
              title="Login required to message"
              style={{ padding: "8px 14px", borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <MessageSquare size={12} /> Message
            </button>
            <button
              onClick={() => onCall(lawyer)}
              title="Login required to call"
              style={{ padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <Video size={12} /> Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function BrowseLawyersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { goToMessages, goToVideoCall } = useProtectedAction();

  const [lawyers,   setLawyers]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [spec,      setSpec]     = useState("All Specializations");
  const [sortBy,    setSort]     = useState("rating");
  const [available, setAvail]    = useState(false);
  const [page,      setPage]     = useState(1);
  const [total,     setTotal]    = useState(0);
  const [vis,       setVis]      = useState(false);
  const PER = 12;

  const load = useCallback(async (searchOverride) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });

      // Support both URL ?search= and the shared LawyerSearchDropdown navigation
      const urlSearch = searchOverride ?? searchParams.get("search") ?? searchParams.get("query") ?? "";
      if (urlSearch) params.set("search", urlSearch);

      const urlSpec = searchParams.get("spec") ?? "";
      const activeSpec = urlSpec || (spec !== "All Specializations" ? spec : "");
      if (activeSpec) params.set("specialization", activeSpec);

      const r = await fetch(`${API}/api/lawyers?${params}`, {
        credentials: "include",
        headers: authHeaders(),
      });

      if (r.ok) {
        const d = await r.json();
        let list = d.lawyers || (Array.isArray(d) ? d : []);

        if (available) list = list.filter((l) => l.lawyerProfile?.isAvailable !== false);

        list.sort((a, b) => {
          if (sortBy === "rating")     return (b.lawyerProfile?.rating || 0) - (a.lawyerProfile?.rating || 0);
          if (sortBy === "experience") return (b.lawyerProfile?.yearsOfExperience || 0) - (a.lawyerProfile?.yearsOfExperience || 0);
          if (sortBy === "fee_asc")    return (a.lawyerProfile?.consultationFee || 0) - (b.lawyerProfile?.consultationFee || 0);
          if (sortBy === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
          return 0;
        });

        setTotal(list.length);
        setLawyers(list);
      }
    } catch {}
    finally { setLoading(false); setTimeout(() => setVis(true), 60); }
  }, [spec, sortBy, available, searchParams]);

  useEffect(() => { load(); }, [spec, sortBy, available, searchParams]);

  // ── Protected contact handlers — redirect to login if not authenticated ──
  const handleMessage = (l) => goToMessages(l._id, "/browse-lawyers");
  const handleCall    = (l) => goToVideoCall(l._id, "/browse-lawyers");

  const paged = lawyers.slice((page - 1) * PER, page * PER);
  const pages = Math.ceil(total / PER);

  return (
    <>
      <style>{`
        @keyframes fd{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--chat-bg,#f8fafc)" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#0A1A3F 0%,#1e3a6e 100%)", padding: "48px 20px 36px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 900, color: "#fff" }}>Browse Legal Experts</h1>
            <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.65)" }}>
              Find and connect with verified, registered lawyers on LawHelpZone
            </p>

            {/* Stats */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 28, flexWrap: "wrap" }}>
              {[["👩‍⚖️", total || "500+", "Registered Lawyers"], ["⭐", "4.8/5", "Average Rating"], ["✅", "10K+", "Cases Resolved"]].map(([icon, val, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{icon} {val}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Shared search component ─────────────────────────────────── */}
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <LawyerSearchDropdown
                redirectPath="/browse-lawyers"
                placeholder="Search by name, specialization…"
                limit={6}
                theme="dark"
                inputClassName="py-3 text-gray-900 text-sm rounded-xl bg-transparent"
                wrapperClassName="border border-white/20 bg-white/95 rounded-xl px-4"
                onSearch={(q) => {
                  router.push(`/browse-lawyers?search=${encodeURIComponent(q)}`);
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", opacity: vis ? 1 : 0, transition: "opacity 0.4s" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
            <select value={spec} onChange={(e) => { setSpec(e.target.value); setPage(1); }}
              style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid var(--border-color,#e2e8f0)", background: "var(--card-bg,#fff)", color: "var(--text-heading,#0f172a)", fontSize: 13, outline: "none", cursor: "pointer" }}>
              {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>

            <select value={sortBy} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid var(--border-color,#e2e8f0)", background: "var(--card-bg,#fff)", color: "var(--text-heading,#0f172a)", fontSize: 13, outline: "none", cursor: "pointer" }}>
              <option value="rating">⭐ Highest Rated</option>
              <option value="experience">🏆 Most Experienced</option>
              <option value="fee_asc">💰 Lowest Fee</option>
              <option value="newest">🆕 Newest</option>
            </select>

            <button onClick={() => { setAvail((p) => !p); setPage(1); }}
              style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${available ? "#10b981" : "var(--border-color,#e2e8f0)"}`, background: available ? "#f0fdf4" : "var(--card-bg,#fff)", color: available ? "#10b981" : "var(--text-muted,#64748b)", fontSize: 13, fontWeight: available ? 700 : 500, cursor: "pointer" }}>
              {available ? "✓ Available Now" : "Available Now"}
            </button>

            <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted,#94a3b8)" }}>{total} lawyers found</span>
          </div>

          {/* Spec chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {["All", "Criminal", "Family", "Business", "Real Estate", "Employment", "Tax", "Immigration"].map((s) => {
              const active = spec.includes(s) || (s === "All" && spec === "All Specializations");
              return (
                <button key={s}
                  onClick={() => { setSpec(s === "All" ? "All Specializations" : `${s} Law`); setPage(1); }}
                  style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? "#3b82f6" : "var(--border-color,#e2e8f0)"}`, background: active ? "#eff6ff" : "var(--card-bg,#fff)", color: active ? "#3b82f6" : "var(--text-muted,#64748b)", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer" }}>
                  {s}
                </button>
              );
            })}
          </div>

          {/* Login notice for guests */}
          {!getToken() && (
            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <span style={{ color: "#92400e" }}>
                <strong>Login required to contact lawyers.</strong>{" "}
                <button onClick={() => router.push("/auth/login?redirect=/browse-lawyers")} style={{ color: "#1d4ed8", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Sign in
                </button>
                {" or "}
                <button onClick={() => router.push("/auth/signup?redirect=/browse-lawyers")} style={{ color: "#1d4ed8", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  create a free account
                </button>
                {" to send messages and make video calls."}
              </span>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14, flexDirection: "column" }}>
              <div style={{ width: 40, height: 40, border: "3px solid var(--border-color,#e2e8f0)", borderTopColor: "#0A1A3F", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "var(--text-muted,#94a3b8)", fontSize: 14 }}>Loading lawyers…</p>
            </div>
          ) : paged.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>👩‍⚖️</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>No lawyers found</h3>
              <p style={{ color: "var(--text-muted,#94a3b8)", fontSize: 14 }}>Try adjusting your filters or search term</p>
              <button onClick={() => { setSpec("All Specializations"); setAvail(false); router.push("/browse-lawyers"); }}
                style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
              {paged.map((l, i) => (
                <LawyerCard key={l._id} lawyer={l} index={i} onMessage={handleMessage} onCall={handleCall} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", background: "var(--card-bg,#fff)", color: "var(--text-muted,#64748b)", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13, fontWeight: 600 }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${n === page ? "#3b82f6" : "var(--border-color,#e2e8f0)"}`, background: n === page ? "#3b82f6" : "var(--card-bg,#fff)", color: n === page ? "#fff" : "var(--text-muted,#64748b)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", background: "var(--card-bg,#fff)", color: "var(--text-muted,#64748b)", cursor: page === pages ? "default" : "pointer", opacity: page === pages ? 0.4 : 1, fontSize: 13, fontWeight: 600 }}>
                Next →
              </button>
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 48, background: "linear-gradient(135deg,#0A1A3F,#1e3a6e)", borderRadius: 24, padding: "40px 32px", textAlign: "center", color: "#fff" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900 }}>Are you a lawyer?</h2>
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.65)", fontSize: 15 }}>Join 500+ legal professionals on LawHelpZone and grow your practice</p>
            <button onClick={() => router.push("/become-a-lawyer")}
              style={{ padding: "13px 32px", borderRadius: 12, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Join as a Lawyer →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}