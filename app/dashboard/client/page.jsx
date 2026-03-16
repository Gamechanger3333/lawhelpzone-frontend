"use client";
// app/dashboard/client/page.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../store/index";
import {
  Briefcase, MessageSquare, Bell, TrendingUp, Plus, Video,
  CheckCircle, AlertCircle, Scale, Star, ChevronRight, RefreshCw,
  X, FileText, UserCheck, Users, ArrowRight, Search,
} from "lucide-react";
import CheckoutModal from "@/app/components/payment/CheckoutModal";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const CATS = [
  "Criminal Law","Family Law","Business Law","Real Estate",
  "Personal Injury","Estate Planning","Employment Law","Tax Law",
];

// ── Inline pay button — fits inside compact card layouts ─────────────────────
function PayButtonInline({ lawyerId, lawyerName, amount, caseId }) {
  const [open, setOpen] = useState(false);
  if (!amount || Number(amount) <= 0) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "4px 10px", borderRadius: 7,
          background: "#2563eb", color: "#fff",
          border: "none", fontSize: 11, fontWeight: 700,
          cursor: "pointer", display: "inline-flex",
          alignItems: "center", gap: 4, whiteSpace: "nowrap",
        }}
      >
        💳 Pay ${Number(amount).toFixed(0)}
      </button>
      <CheckoutModal
        isOpen={open}
        onClose={() => setOpen(false)}
        lawyerId={lawyerId}
        lawyerName={lawyerName}
        amount={Number(amount)}
        caseId={caseId}
        onSuccess={() => setOpen(false)}
      />
    </>
  );
}

function Counter({ to, dur = 900 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!to) return;
    let s = null;
    const f = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, [to]);
  return <>{v}</>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${type === "error" ? "#fca5a5" : "#86efac"}`, color: type === "error" ? "#dc2626" : "#16a34a", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}{msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, opacity: 0.5 }}><X size={13} /></button>
    </div>
  );
}

function NewCaseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", category: "Criminal Law", location: "", country: "Pakistan", budget: "", deadline: "", urgency: "medium" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!form.title || !form.description) return setError("Title and description are required");
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/cases`, { method: "POST", credentials: "include", headers: hdrs(), body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0 }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed");
      onCreated(d.case || d);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,26,63,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", animation: "modalIn 0.3s ease" }}>
        <style>{`@keyframes modalIn{from{transform:scale(0.95) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`}</style>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", borderRadius: "24px 24px 0 0", zIndex: 1 }}>
          <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Create New Case</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Post your legal issue to find the right lawyer</p></div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: 10, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Case Title *</label><input style={inp} placeholder="e.g. Contract Dispute with Employer" value={form.title} onChange={set("title")} /></div>
          <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Description *</label><textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} placeholder="Describe your legal issue..." value={form.description} onChange={set("description")} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Category</label><select style={inp} value={form.category} onChange={set("category")}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Urgency</label><select style={inp} value={form.urgency} onChange={set("urgency")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Location</label><input style={inp} placeholder="City, Province" value={form.location} onChange={set("location")} /></div>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Country</label><input style={inp} value={form.country} onChange={set("country")} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Budget (PKR)</label><input style={inp} type="number" placeholder="50000" value={form.budget} onChange={set("budget")} /></div>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Deadline</label><input style={inp} type="date" value={form.deadline} onChange={set("deadline")} /></div>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "10px 14px", borderRadius: 8, margin: 0 }}>{error}</p>}
          <button onClick={submit} disabled={loading} style={{ padding: 14, borderRadius: 12, background: loading ? "#94a3b8" : "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Creating…" : "Create Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalsModal({ c, onClose, onAccepted }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const accept = async (lawyerId) => {
    setLoading(lawyerId);
    try {
      const r = await fetch(`${API}/api/cases/${c._id}/accept`, { method: "POST", credentials: "include", headers: hdrs(), body: JSON.stringify({ lawyerId }) });
      if (r.ok) { onAccepted(c._id, lawyerId); onClose(); }
    } catch {} finally { setLoading(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Proposals — {c.title}</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {(!c.proposals || c.proposals.length === 0)
            ? <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ color: "#94a3b8" }}>No proposals yet. Lawyers will be notified!</p></div>
            : c.proposals.map((p, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 14, padding: 16, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#10b981", color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {(p.lawyerId?.name || "L").charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{p.lawyerId?.name || "Lawyer"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : ""}</p>
                  </div>
                  {p.fee > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>PKR {p.fee.toLocaleString()}</span>}
                </div>
                {p.message && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{p.message}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.status === "open" && (
                    <button onClick={() => accept(p.lawyerId?._id || p.lawyerId)} disabled={!!loading}
                      style={{ flex: 1, minWidth: 80, padding: 10, borderRadius: 10, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      {loading === (p.lawyerId?._id || p.lawyerId) ? "Accepting…" : "Accept ✓"}
                    </button>
                  )}
                  <button onClick={() => router.push(`/dashboard/client/messages?contact=${p.lawyerId?._id || p.lawyerId}`)}
                    style={{ padding: "10px 14px", borderRadius: 10, background: "#eff6ff", color: "#3b82f6", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💬 Chat</button>
                  {/* Pay button inside proposal if fee is set */}
                  {p.fee > 0 && (
                    <PayButtonInline
                      lawyerId={p.lawyerId?._id || p.lawyerId}
                      lawyerName={p.lawyerId?.name || "Lawyer"}
                      amount={p.fee}
                      caseId={c._id}
                    />
                  )}
                </div>
                {p.status === "accepted" && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#16a34a", fontWeight: 700, textAlign: "center" }}>✓ Accepted</p>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user, profile } = useAppSelector(s => s.auth);

  const [data,       setData]     = useState(null);
  const [loading,    setLoading]  = useState(true);
  const [refreshing, setRef]      = useState(false);
  const [vis,        setVis]      = useState(false);
  const [showModal,  setShowM]    = useState(false);
  const [propCase,   setPropCase] = useState(null);
  const [toast,      setToast]    = useState(null);
  const [lwSearch,   setLS]       = useState("");

  const [unreadMsgs,      setUnreadMsgs]      = useState(0);
  const [unreadNotifs,    setUnreadNotifs]    = useState(0);
  const [latestMsgSender, setLatestMsgSender] = useState(null);

  const pollRef   = useRef(null);
  const badgePoll = useRef(null);

  const name  = profile?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "there";
  const hr    = new Date().getHours();
  const greet = hr < 12 ? "morning" : hr < 17 ? "afternoon" : "evening";

  const fetchBadges = useCallback(async () => {
    if (!tok()) return;
    try {
      const [nRes, mRes] = await Promise.allSettled([
        fetch(`${API}/api/notifications/unread-count`, { credentials: "include", headers: hdrs() }),
        fetch(`${API}/api/messages/contacts`,          { credentials: "include", headers: hdrs() }),
      ]);
      if (nRes.status === "fulfilled" && nRes.value.ok) {
        const d = await nRes.value.json();
        setUnreadNotifs(d.count ?? d.unreadCount ?? 0);
      }
      if (mRes.status === "fulfilled" && mRes.value.ok) {
        const d = await mRes.value.json();
        const contacts = d.contacts || [];
        setUnreadMsgs(contacts.reduce((s, c) => s + (c.unread || 0), 0));
        const latest = contacts
          .filter(c => c.unread > 0)
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        setLatestMsgSender(latest[0]?._id || null);
      }
    } catch {}
  }, []);

  const loadAll = useCallback(async (silent = false) => {
    if (!tok()) return;
    if (!silent) setLoading(true); else setRef(true);
    try {
      const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: hdrs() });
      if (r.ok) {
        const d = await r.json();
        setData(d);
        if (d.stats?.unreadNotifications != null) setUnreadNotifs(d.stats.unreadNotifications);
        if (d.stats?.unreadMessages      != null) setUnreadMsgs(d.stats.unreadMessages);
      }
    } catch {} finally {
      setLoading(false);
      setRef(false);
      setTimeout(() => setVis(true), 50);
    }
  }, []);

  useEffect(() => {
    if (!tok()) { setLoading(false); setTimeout(() => setVis(true), 50); return; }
    loadAll();
    fetchBadges();
    pollRef.current   = setInterval(() => loadAll(true), 30000);
    badgePoll.current = setInterval(fetchBadges, 10000);
    return () => { clearInterval(pollRef.current); clearInterval(badgePoll.current); };
  }, []);

  const stats      = data?.stats || {};
  const cases      = data?.recentCases || [];
  const myLawyers  = data?.myLawyers || [];
  const allLawyers = data?.allLawyers || [];
  const notifs     = data?.recentNotifications || [];

  const notifBadge = unreadNotifs || stats.unreadNotifications || 0;
  const msgBadge   = unreadMsgs   || stats.unreadMessages      || 0;

  const filteredLawyers = allLawyers.filter(l => {
    const q = lwSearch.toLowerCase();
    return !q || (l.name || "").toLowerCase().includes(q) || (l.lawyerProfile?.specializations?.[0] || "").toLowerCase().includes(q);
  });

  const STATUS_C = {
    open:          { l: "Open",        c: "#3b82f6", b: "#eff6ff" },
    "in-progress": { l: "In Progress", c: "#f59e0b", b: "#fffbeb" },
    closed:        { l: "Closed",      c: "#10b981", b: "#f0fdf4" },
    rejected:      { l: "Rejected",    c: "#ef4444", b: "#fef2f2" },
  };

  const STATS = [
    { label: "Active Cases", value: stats.activeCases   || 0, icon: Briefcase,     c: "#3b82f6", b: "#eff6ff" },
    { label: "Total Cases",  value: stats.totalCases    || 0, icon: FileText,      c: "#8b5cf6", b: "#f5f3ff" },
    { label: "Resolved",     value: stats.resolvedCases || 0, icon: CheckCircle,   c: "#10b981", b: "#f0fdf4" },
    { label: "Unread Msgs",  value: msgBadge,                 icon: MessageSquare, c: "#f59e0b", b: "#fffbeb" },
  ];

  const goMessages = () => {
    const base = "/dashboard/client/messages";
    router.push(latestMsgSender ? `${base}?contact=${latestMsgSender}` : base);
  };

  const QUICK = [
    { label: "New Case",       icon: Plus,          color: "#0A1A3F", fn: () => setShowM(true),                                        badge: 0 },
    { label: "Messages",       icon: MessageSquare, color: "#3b82f6", fn: goMessages,                                                  badge: msgBadge },
    { label: "Video Call",     icon: Video,         color: "#10b981", fn: () => router.push("/dashboard/client/video-calls"),          badge: 0 },
    { label: "Notifications",  icon: Bell,          color: "#f59e0b", fn: () => router.push("/dashboard/client/notifications"),        badge: notifBadge },
    { label: "My Cases",       icon: Briefcase,     color: "#8b5cf6", fn: () => router.push("/dashboard/client/cases"),                badge: stats.activeCases || 0 },
    { label: "Browse Lawyers", icon: Users,         color: "#06b6d4", fn: () => router.push("/browse-lawyers"),                        badge: 0 },
  ];

  const css = `
    @keyframes fd{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}
    .ch{transition:all 0.2s;cursor:pointer}.ch:hover{transform:translateY(-2px)!important;box-shadow:0 10px 28px rgba(0,0,0,0.1)!important}
    .rh{transition:background 0.12s;cursor:pointer}.rh:hover{background:#f8fafc!important}
    .qbtn{transition:all 0.18s;border:1px solid #f1f5f9;cursor:pointer;border-radius:16px;padding:18px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
    .qbtn:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important}
    .qbadge{position:absolute;top:8px;right:8px;min-width:17px;height:17px;border-radius:9px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;animation:badgePop 0.3s ease}
  `;

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "#0A1A3F", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#64748b", fontSize: 14 }}>Loading your dashboard…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)", transition: "all 0.5s ease" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Good {greet}, {name}! 👋</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => loadAll(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={() => setShowM(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> New Case
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 16, marginBottom: 28 }}>
        {STATS.map((st, i) => (
          <div key={st.label} className="ch" style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", animation: `fd 0.5s ease ${i * 0.08}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: st.b, display: "flex", alignItems: "center", justifyContent: "center" }}><st.icon size={18} style={{ color: st.c }} /></div>
              <TrendingUp size={13} style={{ color: "#10b981" }} />
            </div>
            <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><Counter to={st.value} /></p>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#64748b" }}>{st.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
        {QUICK.map((q, i) => (
          <button key={q.label} onClick={q.fn} className="qbtn" style={{ animation: `fd 0.5s ease ${0.3 + i * 0.06}s both`, position: "relative" }}>
            {q.badge > 0 && <span className="qbadge">{q.badge > 9 ? "9+" : q.badge}</span>}
            <div style={{ width: 46, height: 46, borderRadius: 14, background: q.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${q.color}40` }}><q.icon size={21} style={{ color: "#fff" }} /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Cases + Right sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 20, marginBottom: 20 }}>

        {/* My Cases */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden", animation: "fd 0.5s ease 0.5s both" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Scale size={16} style={{ color: "#3b82f6" }} /></div>
              <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>My Cases</h3><p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{cases.length} total</p></div>
            </div>
            <button onClick={() => router.push("/dashboard/client/cases")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all <ChevronRight size={13} /></button>
          </div>
          {cases.length === 0
            ? <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Briefcase size={40} style={{ color: "#e2e8f0", display: "block", margin: "0 auto 14px" }} />
                <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>No cases yet.</p>
                <button onClick={() => setShowM(true)} style={{ padding: "10px 24px", borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Create Case</button>
              </div>
            : cases.map((c, i) => {
                const sc = STATUS_C[c.status] || STATUS_C.open;
                const proposals = c.proposals?.length || 0;
                return (
                  <div key={c._id} className="rh" style={{ padding: "13px 22px", borderBottom: i < cases.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: sc.b, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={15} style={{ color: sc.c }} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{c.category} · {new Date(c.createdAt || c.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.b, color: sc.c }}>{sc.l}</span>
                        {proposals > 0 && c.status === "open" && (
                          <button onClick={e => { e.stopPropagation(); setPropCase(c); }} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", cursor: "pointer" }}>
                            {proposals} proposal{proposals !== 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Assigned lawyer card with PAY BUTTON ── */}
                    {c.assignedLawyerId && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {(c.assignedLawyerId.name || "L").charAt(0)}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#14532d" }}>{c.assignedLawyerId.name || "Your Lawyer"}</p>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button onClick={() => router.push(`/dashboard/client/messages?contact=${c.assignedLawyerId._id || c.assignedLawyerId}`)} style={{ padding: "4px 10px", borderRadius: 7, background: "#10b981", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>💬 Msg</button>
                          <button onClick={() => router.push(`/dashboard/client/video-calls?contact=${c.assignedLawyerId._id || c.assignedLawyerId}`)} style={{ padding: "4px 10px", borderRadius: 7, background: "#fff", color: "#10b981", border: "1px solid #86efac", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📹 Call</button>
                          {/* ← PAY BUTTON: only shown if lawyer has a fee set */}
                          <PayButtonInline
                            lawyerId={c.assignedLawyerId._id || c.assignedLawyerId}
                            lawyerName={c.assignedLawyerId.name || "Lawyer"}
                            amount={c.assignedLawyerId.lawyerProfile?.consultationFee}
                            caseId={c._id}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Notifications */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "fd 0.5s ease 0.6s both" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={15} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
                {notifBadge > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#fef3c7", color: "#d97706" }}>{notifBadge}</span>}
              </div>
              <button onClick={() => router.push("/dashboard/client/notifications")} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>All →</button>
            </div>
            {notifs.length === 0
              ? <p style={{ padding: "20px 18px", color: "#94a3b8", fontSize: 13, textAlign: "center", margin: 0 }}>No notifications yet</p>
              : notifs.slice(0, 4).map((n, i) => (
                <div key={n._id || n.id} style={{ padding: "11px 18px", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", background: n.read ? "transparent" : "#fffbeb" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: n.read ? 400 : 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>{new Date(n.createdAt || n.created_at || Date.now()).toLocaleString()}</p>
                </div>
              ))}
          </div>

          {/* Success rate */}
          <div style={{ background: "linear-gradient(135deg,#0A1A3F,#1e3a6e)", borderRadius: 20, padding: "20px 22px", color: "#fff", animation: "fd 0.5s ease 0.7s both" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Success Rate</p>
            <p style={{ margin: "0 0 14px", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
              {stats.totalCases > 0 ? Math.round((stats.resolvedCases / stats.totalCases) * 100) : 0}%
            </p>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, height: 7, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 20, background: "linear-gradient(90deg,#60a5fa,#34d399)", width: stats.totalCases > 0 ? `${(stats.resolvedCases / stats.totalCases) * 100}%` : "0%", transition: "width 1.2s ease" }} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{stats.resolvedCases || 0} of {stats.totalCases || 0} cases resolved</p>
          </div>

          {/* My Lawyers with PAY BUTTON */}
          {myLawyers.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "fd 0.5s ease 0.8s both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserCheck size={15} style={{ color: "#10b981" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>My Lawyers</span>
                </div>
                <button onClick={() => router.push("/dashboard/client/my-lawyer")} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>All →</button>
              </div>
              {myLawyers.slice(0, 3).map(l => (
                <div key={l._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f8fafc", flexWrap: "wrap" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10b981", color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {l.profileImage ? <img src={l.profileImage} style={{ width: 32, height: 32, objectFit: "cover" }} alt="" /> : (l.name || "L").charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{l.lawyerProfile?.specializations?.[0] || "Lawyer"}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => router.push(`/dashboard/client/messages?contact=${l._id}`)} style={{ width: 26, height: 26, borderRadius: 6, background: "#eff6ff", border: "none", cursor: "pointer", fontSize: 12 }}>💬</button>
                    <button onClick={() => router.push(`/dashboard/client/video-calls?contact=${l._id}`)} style={{ width: 26, height: 26, borderRadius: 6, background: "#f0fdf4", border: "none", cursor: "pointer", fontSize: 12 }}>📹</button>
                    {/* ← PAY BUTTON in "My Lawyers" sidebar */}
                    <PayButtonInline
                      lawyerId={l._id}
                      lawyerName={l.name}
                      amount={l.lawyerProfile?.consultationFee}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Registered Lawyers with PAY BUTTON */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: "fd 0.5s ease 0.9s both" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={16} style={{ color: "#3b82f6" }} /></div>
            <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>All Registered Lawyers</h3><p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Browse & contact any lawyer directly</p></div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input value={lwSearch} onChange={e => setLS(e.target.value)} placeholder="Search lawyers…" style={{ padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
            </div>
            <button onClick={() => router.push("/browse-lawyers")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Browse all <ArrowRight size={14} /></button>
          </div>
        </div>
        {filteredLawyers.length === 0
          ? <div style={{ padding: "40px", textAlign: "center" }}><p style={{ color: "#94a3b8", margin: 0 }}>No lawyers registered yet</p></div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, padding: "16px 18px" }}>
              {filteredLawyers.slice(0, 16).map(l => (
                <div key={l._id} className="ch" style={{ background: "#f8fafc", borderRadius: 14, padding: 14, border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#0A1A3F,#1e3a6e)", color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {l.profileImage ? <img src={l.profileImage} style={{ width: 40, height: 40, objectFit: "cover" }} alt="" /> : (l.name || "L").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#3b82f6" }}>{l.lawyerProfile?.specializations?.[0] || "General Law"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 10 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= (l.lawyerProfile?.rating || 5) ? "#f59e0b" : "#e2e8f0", fill: s <= (l.lawyerProfile?.rating || 5) ? "#f59e0b" : "transparent" }} />)}
                    <span style={{ fontSize: 10, color: "#64748b", marginLeft: 3 }}>{l.lawyerProfile?.rating || "5.0"}</span>
                    {l.lawyerProfile?.consultationFee > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#10b981" }}>
                        ${l.lawyerProfile.consultationFee}/consult
                      </span>
                    )}
                  </div>
                  {/* ── 3 action buttons: Msg, Call, Pay ── */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button onClick={() => router.push(`/dashboard/client/messages?contact=${l._id}`)} style={{ flex: 1, minWidth: 50, padding: "7px 0", borderRadius: 8, background: "#0A1A3F", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>💬 Msg</button>
                    <button onClick={() => router.push(`/dashboard/client/video-calls?contact=${l._id}`)} style={{ flex: 1, minWidth: 50, padding: "7px 0", borderRadius: 8, background: "#f0fdf4", color: "#10b981", border: "1px solid #bbf7d0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📹 Call</button>
                    {/* ← PAY BUTTON on each lawyer card */}
                    {l.lawyerProfile?.consultationFee > 0 && (
                      <PayButtonInline
                        lawyerId={l._id}
                        lawyerName={l.name}
                        amount={l.lawyerProfile.consultationFee}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
        }
        {filteredLawyers.length > 16 && (
          <div style={{ padding: "14px 18px", borderTop: "1px solid #f8fafc", textAlign: "center" }}>
            <button onClick={() => router.push("/browse-lawyers")} style={{ padding: "9px 24px", borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Browse all {filteredLawyers.length} lawyers →
            </button>
          </div>
        )}
      </div>

      {showModal && <NewCaseModal onClose={() => setShowM(false)} onCreated={c => {
        setData(p => ({ ...p, recentCases: [c, ...(p?.recentCases || [])], stats: { ...(p?.stats || {}), activeCases: (p?.stats?.activeCases || 0) + 1, totalCases: (p?.stats?.totalCases || 0) + 1 } }));
        setShowM(false);
        setToast({ msg: "Case created! Lawyers will see it now.", type: "success" });
      }} />}
      {propCase && <ProposalsModal c={propCase} onClose={() => setPropCase(null)} onAccepted={(cid, lid) => {
        setData(p => ({ ...p, recentCases: (p?.recentCases || []).map(c => c._id === cid ? { ...c, status: "in-progress", assignedLawyerId: lid } : c) }));
        setPropCase(null);
        setToast({ msg: "Lawyer accepted!", type: "success" });
      }} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}