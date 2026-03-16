"use client";
// app/dashboard/lawyer/page.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../store/index";
import {
  Scale, Users, Briefcase, MessageSquare, Bell, Video,
  CheckCircle, AlertTriangle, X, RefreshCw, ChevronRight, Search,
  DollarSign,
} from "lucide-react";
import StripeSetupBanner from "@/components/payment/StripeSetupBanner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
const STATUS = {
  open:          { l: "Open",        c: "#3b82f6", b: "#eff6ff" },
  "in-progress": { l: "In Progress", c: "#f59e0b", b: "#fffbeb" },
  in_progress:   { l: "In Progress", c: "#f59e0b", b: "#fffbeb" },
  closed:        { l: "Closed",      c: "#10b981", b: "#f0fdf4" },
};

function Counter({ to, d = 900 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!to || isNaN(to)) return;
    let s = null;
    const f = (t) => { if (!s) s = t; const p = Math.min((t - s) / d, 1); setV(Math.floor(p * to)); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }, [to]);
  return <>{v}</>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "#fff", border: `1.5px solid ${type === "error" ? "#fca5a5" : "#86efac"}`, color: type === "error" ? "#dc2626" : "#16a34a", borderRadius: 14, padding: "13px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
      {type === "error" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
      {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, opacity: 0.35, color: "inherit" }}><X size={13} /></button>
    </div>
  );
}

export default function LawyerDashboard() {
  const router   = useRouter();
  const { user } = useAppSelector(s => s.auth);

  const [data,        setData]     = useState(null);
  const [avail,       setAvail]    = useState([]);
  const [loading,     setLoading]  = useState(true);
  const [refreshing,  setRef]      = useState(false);
  const [vis,         setVis]      = useState(false);
  const [tab,         setTab]      = useState("my");
  const [userSearch,  setUS]       = useState("");
  const [propCase,    setPropCase] = useState(null);
  const [propNote,    setPropNote] = useState("");
  const [propFee,     setPropFee]  = useState("");
  const [propLoading, setPL]       = useState(false);
  const [toast,       setToast]    = useState(null);

  const [unreadMsgs,   setUnreadMsgs]   = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [latestSender, setLatestSender] = useState(null);

  const pollRef   = useRef(null);
  const badgePoll = useRef(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchBadges = useCallback(async () => {
    if (!tok()) return;
    try {
      const [nRes, mRes] = await Promise.allSettled([
        fetch(`${API}/api/notifications/unread-count`, { credentials: "include", headers: H() }),
        fetch(`${API}/api/messages/contacts`,          { credentials: "include", headers: H() }),
      ]);
      if (nRes.status === "fulfilled" && nRes.value.ok) {
        const d = await nRes.value.json();
        setUnreadNotifs(d.count ?? d.unreadCount ?? 0);
      }
      if (mRes.status === "fulfilled" && mRes.value.ok) {
        const d = await mRes.value.json();
        const contacts = d.contacts || [];
        setUnreadMsgs(contacts.reduce((s, c) => s + (c.unread || 0), 0));
        const latest = contacts.filter(c => c.unread > 0).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        setLatestSender(latest[0]?._id || null);
      }
    } catch {}
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!tok()) return;
    if (!silent) setLoading(true); else setRef(true);
    try {
      const [dashRes, availRes] = await Promise.allSettled([
        fetch(`${API}/api/dashboard`,                  { credentials: "include", headers: H() }),
        fetch(`${API}/api/cases?status=open&limit=20`, { credentials: "include", headers: H() }),
      ]);
      if (dashRes.status === "fulfilled" && dashRes.value.ok) {
        const d = await dashRes.value.json();
        setData(d);
        if (d.stats?.unreadNotifications != null) setUnreadNotifs(d.stats.unreadNotifications);
        if (d.stats?.unreadMessages      != null) setUnreadMsgs(d.stats.unreadMessages);
      }
      if (availRes.status === "fulfilled" && availRes.value.ok) {
        const d = await availRes.value.json();
        setAvail(Array.isArray(d) ? d : (d.cases || []));
      }
    } catch {} finally {
      setLoading(false);
      setRef(false);
      setTimeout(() => setVis(true), 60);
    }
  }, []);

  useEffect(() => {
    if (!tok()) { setLoading(false); setTimeout(() => setVis(true), 50); return; }
    load();
    fetchBadges();
    pollRef.current   = setInterval(() => load(true), 30000);
    badgePoll.current = setInterval(fetchBadges, 10000);
    return () => { clearInterval(pollRef.current); clearInterval(badgePoll.current); };
  }, []);

  const sendProposal = async () => {
    if (!propNote.trim() || !propCase) return;
    setPL(true);
    try {
      const r = await fetch(`${API}/api/cases/${propCase._id}/proposals`, {
        method: "POST", credentials: "include", headers: H(),
        body: JSON.stringify({ message: propNote, fee: Number(propFee) || 0 }),
      });
      if (r.ok) { showToast("Proposal sent successfully"); setPropCase(null); setPropNote(""); setPropFee(""); load(true); }
      else showToast("Failed to send proposal", "error");
    } catch { showToast("Network error", "error"); }
    finally { setPL(false); }
  };

  const stats         = data?.stats || {};
  const myCases       = data?.myCases || [];
  const myClients     = data?.myClients || [];
  const allUsers      = data?.allUsers || [];
  const notifs        = data?.recentNotifications || [];
  const lawyerProfile = data?.lawyerProfile || user?.lawyerProfile || {};
  const isAvail       = lawyerProfile.isAvailable !== false;
  const notifBadge    = unreadNotifs || stats.unreadNotifications || 0;
  const msgBadge      = unreadMsgs   || stats.unreadMessages      || 0;

  const goMessages = () => {
    const base = "/dashboard/lawyer/messages";
    router.push(latestSender ? `${base}?contact=${latestSender}` : base);
  };

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });

  const STATS = [
    { label: "Active Cases",    value: stats.activeCases   || 0, accent: "#10b981", bg: "#f0fdf4", icon: "📁", sub: "Currently handling"    },
    { label: "Cases Closed",    value: stats.closedCases   || 0, accent: "#3b82f6", bg: "#eff6ff", icon: "✅", sub: "Successfully resolved"  },
    { label: "Clients",         value: stats.totalClients  || 0, accent: "#8b5cf6", bg: "#f5f3ff", icon: "👤", sub: "Total relationships"    },
    { label: "Proposals Sent",  value: stats.proposalsSent || 0, accent: "#f59e0b", bg: "#fffbeb", icon: "📨", sub: "Awaiting response"      },
    { label: "Open Cases",      value: stats.openAvailable ?? avail.length, accent: "#06b6d4", bg: "#ecfeff", icon: "🔍", sub: "Available to apply" },
    { label: "Unread Messages", value: msgBadge,                 accent: "#ec4899", bg: "#fdf2f8", icon: "💬", sub: "Needs attention"        },
  ];

  const QUICK = [
    { label: "Messages",      icon: MessageSquare, fn: goMessages,                                                   badge: msgBadge,   color: "#3b82f6", bg: "#eff6ff" },
    { label: "Video Calls",   icon: Video,         fn: () => router.push("/dashboard/lawyer/video-calls"),           badge: 0,          color: "#10b981", bg: "#f0fdf4" },
    { label: "Notifications", icon: Bell,          fn: () => router.push("/dashboard/lawyer/notifications"),         badge: notifBadge, color: "#f59e0b", bg: "#fffbeb" },
    { label: "My Cases",      icon: Scale,         fn: () => router.push("/dashboard/lawyer/cases"),                 badge: 0,          color: "#0A1A3F", bg: "#eef0f7" },
    { label: "My Clients",    icon: Users,         fn: () => router.push("/dashboard/lawyer/clients"),               badge: 0,          color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Earnings",      icon: DollarSign,    fn: () => router.push("/dashboard/lawyer/earnings"),              badge: 0,          color: "#10b981", bg: "#f0fdf4" },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    .ld-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; color: #0f172a; padding: 28px 32px 60px; }
    @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
    @keyframes spin    { to   { transform:rotate(360deg) } }
    @keyframes popIn   { from { transform:scale(0.6); opacity:0 } to { transform:scale(1); opacity:1 } }
    @keyframes pulse2  { 0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0.35) } 70% { box-shadow:0 0 0 8px transparent } }
    .stat-card { background:#fff; border:1px solid #f1f5f9; border-radius:16px; padding:20px 22px 18px; transition:transform 0.18s,box-shadow 0.18s; cursor:default; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--accent); opacity:0.85; }
    .stat-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.08); }
    .qa-btn { background:#fff; border:1px solid #f1f5f9; border-radius:14px; padding:16px 10px 14px; display:flex; flex-direction:column; align-items:center; gap:9px; cursor:pointer; transition:all 0.18s; position:relative; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
    .qa-btn:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.09); border-color:#e2e8f0; }
    .qa-badge { position:absolute; top:7px; right:7px; min-width:17px; height:17px; border-radius:9px; background:#ef4444; color:#fff; font-size:9px; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0 4px; animation:popIn 0.25s cubic-bezier(0.34,1.56,0.64,1); font-family:'DM Mono',monospace; }
    .tab-btn { padding:7px 18px; border-radius:20px; border:1px solid transparent; font-size:12.5px; font-weight:700; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
    .tab-btn.active { background:#0A1A3F; color:#fff; border-color:#0A1A3F; }
    .tab-btn:not(.active) { background:#f1f5f9; color:#64748b; }
    .tab-btn:not(.active):hover { background:#e2e8f0; color:#475569; }
    .case-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid #f8fafc; transition:background 0.1s; }
    .case-row:last-child { border-bottom:none; }
    .case-row:hover { background:#f8fafc; }
    .user-card { background:#f8fafc; border:1px solid #f1f5f9; border-radius:14px; padding:15px; transition:all 0.18s; }
    .user-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.07); border-color:#e2e8f0; }
    .act-btn { flex:1; padding:7px 0; border-radius:8px; font-size:11.5px; font-weight:700; cursor:pointer; transition:opacity 0.15s,transform 0.12s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:5px; border:none; }
    .act-btn:hover { opacity:0.82; transform:scale(0.97); }
    .side-card { background:#fff; border:1px solid #f1f5f9; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.04); }
    .notif-row { padding:11px 18px; border-bottom:1px solid #f8fafc; transition:background 0.1s; }
    .notif-row:last-child { border-bottom:none; }
    .notif-row:hover { background:#f8fafc; }
    .notif-row.unread { border-left:3px solid #f59e0b; background:#fffbeb; }
    .ld-input { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; color:#0f172a; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color 0.15s,background 0.15s; }
    .ld-input:focus { border-color:#94a3b8; background:#fff; }
    .ld-input::placeholder { color:#94a3b8; }
    .online-dot { width:8px; height:8px; border-radius:50%; background:#10b981; animation:pulse2 2s infinite; display:inline-block; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:3px; }
  `;

  if (loading) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{background:#f1f5f9;margin:0;}`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: "#f1f5f9", fontFamily: "sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Loading dashboard…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ld-root" style={{ opacity: vis ? 1 : 0, transition: "opacity 0.4s" }}>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* ── Stripe Setup Banner — shows only if Stripe not connected ── */}
        <StripeSetupBanner />

        {/* ── Proposal Modal ── */}
        {propCase && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: 20 }}
            onClick={() => setPropCase(null)}>
            <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 20, maxWidth: 480, width: "100%", padding: 32, animation: "fadeUp 0.22s ease", boxShadow: "0 32px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans', sans-serif" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Submit Proposal</h3>
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8" }}>Case: <span style={{ color: "#475569", fontWeight: 600 }}>{propCase.title}</span></p>
                </div>
                <button onClick={() => setPropCase(null)} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: "#64748b" }}><X size={14} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Proposed Fee (PKR)</label>
                  <input value={propFee} onChange={e => setPropFee(e.target.value)} type="number" placeholder="e.g. 15,000"
                    className="ld-input" style={{ width: "100%", padding: "11px 14px" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cover Note <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea value={propNote} onChange={e => setPropNote(e.target.value)} rows={5} placeholder="Describe your approach and relevant experience…"
                    className="ld-input" style={{ width: "100%", padding: "11px 14px", resize: "vertical" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={() => setPropCase(null)}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
                <button onClick={sendProposal} disabled={propLoading || !propNote.trim()}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: propLoading || !propNote.trim() ? "#f1f5f9" : "#10b981", color: propLoading || !propNote.trim() ? "#94a3b8" : "#fff", fontWeight: 700, cursor: propLoading || !propNote.trim() ? "default" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                  {propLoading ? "Sending…" : "Send Proposal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30, flexWrap: "wrap", gap: 16, animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(16,185,129,0.25)" }}>
              <Scale size={22} style={{ color: "#fff" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
                  {(user?.name || "Lawyer").split(" ")[0]}'s Dashboard
                </h1>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: isAvail ? "#f0fdf4" : "#fef2f2", color: isAvail ? "#10b981" : "#ef4444", fontSize: 11, fontWeight: 700, border: `1px solid ${isAvail ? "#bbf7d0" : "#fecaca"}` }}>
                  <span className={isAvail ? "online-dot" : ""} style={isAvail ? {} : { width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                  {isAvail ? "Available" : "Unavailable"}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#64748b" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => load(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.15s" }}>
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
            <button onClick={() => router.push("/dashboard/lawyer/earnings")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
              <DollarSign size={13} /> Earnings
            </button>
            <button onClick={() => router.push("/dashboard/lawyer/cases")}
              style={{ padding: "9px 20px", borderRadius: 10, background: "#0A1A3F", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              View Cases
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          {STATS.map((st, i) => (
            <div key={st.label} className="stat-card" style={{ "--accent": st.accent, animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 }}>{st.icon}</div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.04em", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                <Counter to={st.value} />
              </p>
              <p style={{ margin: "5px 0 0", fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{st.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{st.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
          {QUICK.map((q, i) => {
            const Icon = q.icon;
            return (
              <button key={q.label} onClick={q.fn} className="qa-btn" style={{ animation: `fadeUp 0.4s ease ${0.3 + i * 0.05}s both` }}>
                {q.badge > 0 && <span className="qa-badge">{q.badge > 99 ? "99+" : q.badge}</span>}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: q.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: q.color }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151" }}>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 18, marginBottom: 20 }}>

          {/* Left: Tabs panel */}
          <div>
            <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
              {[
                ["my",        "My Cases",  myCases.length],
                ["available", "Available", avail.length],
                ["clients",   "Clients",   myClients.length],
              ].map(([v, l, count]) => (
                <button key={v} className={`tab-btn${tab === v ? " active" : ""}`} onClick={() => setTab(v)}>
                  {l}
                  <span style={{ marginLeft: 6, fontSize: 11, padding: "1px 7px", borderRadius: 20, background: tab === v ? "rgba(255,255,255,0.2)" : "#e2e8f0", color: tab === v ? "#fff" : "#94a3b8", fontWeight: 700 }}>{count}</span>
                </button>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", animation: "fadeUp 0.4s ease 0.15s both" }}>

              {tab === "my" && (
                myCases.length === 0
                  ? <div style={{ padding: "52px 24px", textAlign: "center" }}>
                      <Scale size={34} style={{ color: "#e2e8f0", margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#94a3b8", fontWeight: 700, margin: 0, fontSize: 14 }}>No cases assigned yet</p>
                      <p style={{ color: "#cbd5e1", fontSize: 12, margin: "4px 0 0" }}>Browse available cases and submit proposals</p>
                    </div>
                  : myCases.map((c, i) => {
                      const sc = STATUS[c.status] || STATUS.open;
                      const client = c.clientId || {};
                      return (
                        <div key={c._id || i} className="case-row">
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.c, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#64748b" }}>
                              {client.name || "Client"}
                              {c.category && <> · <span style={{ color: "#94a3b8" }}>{c.category}</span></>}
                              {" · "}{new Date(c.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                          <span style={{ padding: "3px 10px", borderRadius: 20, background: sc.b, color: sc.c, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{sc.l}</span>
                          {client._id && (
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button onClick={() => router.push(`/dashboard/lawyer/messages?contact=${client._id}`)}
                                style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MessageSquare size={13} style={{ color: "#3b82f6" }} />
                              </button>
                              <button onClick={() => router.push(`/dashboard/lawyer/video-calls?contact=${client._id}`)}
                                style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Video size={13} style={{ color: "#10b981" }} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
              )}

              {tab === "available" && (
                avail.length === 0
                  ? <div style={{ padding: "52px 24px", textAlign: "center" }}>
                      <Search size={34} style={{ color: "#e2e8f0", margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#94a3b8", fontWeight: 700, margin: 0, fontSize: 14 }}>No open cases right now</p>
                    </div>
                  : avail.map((c, i) => {
                      const myId = user?._id || user?.id;
                      const hasProposed = c.proposals?.some(p => String(p.lawyerId?._id || p.lawyerId) === String(myId));
                      return (
                        <div key={c._id || i} className="case-row" style={{ alignItems: "flex-start" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{c.title}</p>
                              {c.urgency === "high" && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "#fef2f2", color: "#ef4444", letterSpacing: "0.04em" }}>URGENT</span>
                              )}
                            </div>
                            <p style={{ margin: "0 0 7px", fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>
                              {c.description?.slice(0, 95)}{(c.description?.length || 0) > 95 ? "…" : ""}
                            </p>
                            <div style={{ display: "flex", gap: 12 }}>
                              {c.category && <span style={{ fontSize: 11.5, color: "#3b82f6", fontWeight: 600 }}>{c.category}</span>}
                              {c.budget > 0 && <span style={{ fontSize: 11.5, color: "#10b981", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>PKR {c.budget.toLocaleString()}</span>}
                            </div>
                          </div>
                          <button onClick={() => !hasProposed && setPropCase(c)} disabled={hasProposed}
                            style={{ padding: "7px 16px", borderRadius: 9, background: hasProposed ? "#f0fdf4" : "#10b981", color: hasProposed ? "#10b981" : "#fff", border: hasProposed ? "1px solid #bbf7d0" : "none", fontWeight: 700, fontSize: 12, cursor: hasProposed ? "default" : "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                            {hasProposed ? "✓ Applied" : "Apply"}
                          </button>
                        </div>
                      );
                    })
              )}

              {tab === "clients" && (
                myClients.length === 0
                  ? <div style={{ padding: "52px 24px", textAlign: "center" }}>
                      <Users size={34} style={{ color: "#e2e8f0", margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#94a3b8", fontWeight: 700, margin: 0, fontSize: 14 }}>No clients yet</p>
                    </div>
                  : myClients.map((cl, i) => (
                      <div key={cl._id || i} className="case-row">
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px solid #dbeafe" }}>
                          {cl.profileImage ? <img src={cl.profileImage} style={{ width: 36, height: 36, objectFit: "cover" }} alt="" /> : (cl.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{cl.name || "Client"}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>{cl.email}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => router.push(`/dashboard/lawyer/messages?contact=${cl._id}`)}
                            style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MessageSquare size={13} style={{ color: "#3b82f6" }} />
                          </button>
                          <button onClick={() => router.push(`/dashboard/lawyer/video-calls?contact=${cl._id}`)}
                            style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Video size={13} style={{ color: "#10b981" }} />
                          </button>
                        </div>
                      </div>
                    ))
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Profile card */}
            <div className="side-card" style={{ animation: "fadeUp 0.4s ease 0.2s both" }}>
              <div style={{ background: "linear-gradient(160deg,#064e3b 0%,#065f46 100%)", padding: "20px 18px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "#d1fae5", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
                    {user?.profileImage ? <img src={user.profileImage} style={{ width: 46, height: 46, objectFit: "cover" }} alt="" /> : (user?.name || "L").charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#f0fdf4", letterSpacing: "-0.01em" }}>{user?.name || "Lawyer"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(167,243,208,0.8)" }}>{lawyerProfile.barCouncil || "Bar Member"}</p>
                  </div>
                </div>
                {lawyerProfile.specializations?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {lawyerProfile.specializations.slice(0, 3).map(s => (
                      <span key={s} style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "#a7f3d0", fontSize: 11, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
                <button onClick={() => router.push("/dashboard/lawyer/profile")}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                  ✏️ Edit Profile
                </button>
                <button onClick={() => router.push("/dashboard/lawyer/earnings")}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <DollarSign size={12} /> Earnings
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="side-card" style={{ animation: "fadeUp 0.4s ease 0.3s both" }}>
              <div style={{ padding: "13px 16px 11px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={14} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
                  {notifBadge > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>{notifBadge}</span>
                  )}
                </div>
                <button onClick={() => router.push("/dashboard/lawyer/notifications")}
                  style={{ fontSize: 11.5, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                  View all →
                </button>
              </div>
              {notifs.length === 0
                ? <p style={{ fontSize: 12.5, color: "#94a3b8", textAlign: "center", padding: "20px 0", margin: 0 }}>No recent notifications</p>
                : notifs.slice(0, 4).map((n, i) => (
                  <div key={n._id || i} className={`notif-row${!n.read ? " unread" : ""}`}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: n.read ? 400 : 700, color: n.read ? "#64748b" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10.5, color: "#94a3b8" }}>{new Date(n.createdAt || Date.now()).toLocaleString()}</p>
                  </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="side-card" style={{ padding: "16px 16px 12px", animation: "fadeUp 0.4s ease 0.4s both" }}>
              <p style={{ margin: "0 0 12px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Navigation</p>
              {[
                { label: "My Cases",      path: "/dashboard/lawyer/cases",        icon: Scale     },
                { label: "My Clients",    path: "/dashboard/lawyer/client-list",  icon: Users     },
                { label: "Earnings",      path: "/dashboard/lawyer/earnings",     icon: DollarSign },
                { label: "Stripe Setup",  path: "/dashboard/lawyer/stripe-setup", icon: Briefcase },
                { label: "Notifications", path: "/dashboard/lawyer/notifications",icon: Bell      },
                { label: "Edit Profile",  path: "/dashboard/lawyer/profile",      icon: Briefcase },
              ].map((l, i) => {
                const Icon = l.icon;
                return (
                  <button key={l.path} onClick={() => router.push(l.path)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", background: "none", border: "none", cursor: "pointer", borderBottom: i < 5 ? "1px solid #f8fafc" : "none", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #f1f5f9" }}>
                      <Icon size={13} style={{ color: "#64748b" }} />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", flex: 1, textAlign: "left" }}>{l.label}</span>
                    <ChevronRight size={13} style={{ color: "#cbd5e1" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── All Registered Users ── */}
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", animation: "fadeUp 0.4s ease 0.5s both" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={17} style={{ color: "#10b981" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>All Registered Users</h3>
                <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#94a3b8" }}>{allUsers.length} members — message or call anyone</p>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input value={userSearch} onChange={e => setUS(e.target.value)} placeholder="Search members…"
                className="ld-input" style={{ padding: "8px 12px 8px 30px", width: 210 }} />
            </div>
          </div>

          {filteredUsers.length === 0
            ? <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>No users found</p>
              </div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(205px, 1fr))", gap: 12, padding: "16px 18px" }}>
                {filteredUsers.slice(0, 20).map(u => {
                  const rc = ROLE_C[u.role] || "#6366f1";
                  return (
                    <div key={u._id} className="user-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${rc}14`, color: rc, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: `1.5px solid ${rc}28` }}>
                          {u.profileImage ? <img src={u.profileImage} style={{ width: 38, height: 38, objectFit: "cover" }} alt="" /> : (u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Unnamed"}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: `${rc}14`, color: rc, textTransform: "capitalize", letterSpacing: "0.04em" }}>{u.role}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="act-btn" onClick={() => router.push(`/dashboard/lawyer/messages?contact=${u._id}`)}
                          style={{ background: "#eff6ff", color: "#3b82f6" }}>
                          <MessageSquare size={12} /> Message
                        </button>
                        <button className="act-btn" onClick={() => router.push(`/dashboard/lawyer/video-calls?contact=${u._id}`)}
                          style={{ background: "#f0fdf4", color: "#10b981" }}>
                          <Video size={12} /> Call
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
          {filteredUsers.length > 20 && (
            <div style={{ padding: "13px 20px", borderTop: "1px solid #f8fafc", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 12.5, margin: 0 }}>
                Showing 20 of {filteredUsers.length} — use Messages to find more
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}