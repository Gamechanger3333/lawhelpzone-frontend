"use client";
// app/dashboard/admin/page.jsx
// ── CHANGE FROM ORIGINAL: ──────────────────────────────────────────────────
//  1. Added CreditCard import from lucide-react
//  2. Replaced "Activity Log" in QUICK array with "Payments" → /dashboard/admin/payments
// ── Everything else is identical to the original. ──────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../store/index";
import {
  Shield, Users, Briefcase, BarChart3, TrendingUp, RefreshCw,
  UserCheck, Scale, ArrowRight, MessageSquare, Settings,
  X, Search, Video, Trash2, CheckCircle, AlertTriangle, Bell,
  Send, CreditCard,                                              // ← CreditCard added
} from "lucide-react";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
const STATUS = {
  open:          { l: "Open",        c: "#3b82f6", b: "#eff6ff" },
  "in-progress": { l: "In Progress", c: "#f59e0b", b: "#fffbeb" },
  closed:        { l: "Closed",      c: "#10b981", b: "#f0fdf4" },
};

function Counter({ to, d = 900 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!to) return;
    let s = null;
    const f = (t) => { if (!s) s = t; const p = Math.min((t - s) / d, 1); setV(Math.floor(p * to)); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }, [to]);
  return <>{v}</>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${type === "error" ? "#fca5a5" : "#86efac"}`, color: type === "error" ? "#dc2626" : "#16a34a", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}{msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, opacity: 0.5 }}><X size={13} /></button>
    </div>
  );
}

function BroadcastModal({ onClose, onSent }) {
  const [form, setForm] = useState({ title: "", body: "", type: "info" });
  const [loading, setL] = useState(false);
  const send = async () => {
    if (!form.title || !form.body) return;
    setL(true);
    try {
      const r = await fetch(`${API}/api/admin/broadcast`, { method: "POST", credentials: "include", headers: hdrs(), body: JSON.stringify(form) });
      if (r.ok) { onSent(); onClose(); }
    } catch {} finally { setL(false); }
  };
  const typeIcons = { info: "ℹ️", warning: "⚠️", success: "✅", message: "💬" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "mIn 0.3s ease" }}>
        <style>{`@keyframes mIn{from{transform:scale(0.95) translateY(20px);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>📢 Broadcast to All Users</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>Send notification to every registered user</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["info", "warning", "success", "message"].map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: `2px solid ${form.type === t ? "#0A1A3F" : "#e2e8f0"}`, background: form.type === t ? "#0A1A3F" : "#f8fafc", color: form.type === t ? "#fff" : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 16 }}>{typeIcons[t]}</span>{t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Message *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3} placeholder="Message to broadcast..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
          </div>
          <button onClick={send} disabled={loading || !form.title || !form.body}
            style={{ padding: 12, borderRadius: 12, background: (form.title && form.body) ? "#ef4444" : "#e2e8f0", color: (form.title && form.body) ? "#fff" : "#94a3b8", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Send size={15} />{loading ? "Sending…" : "Send to All Users"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseModal({ c, lawyers, onClose, onAssign }) {
  const router = useRouter();
  const [sel, setSel] = useState(c.assignedLawyerId?._id || "");
  const [loading, setL] = useState(false);
  const s = STATUS[c.status] || STATUS.open;
  const assign = async () => {
    if (!sel) return; setL(true);
    try {
      const r = await fetch(`${API}/api/cases/${c._id}/assign`, { method: "POST", credentials: "include", headers: hdrs(), body: JSON.stringify({ lawyerId: sel }) });
      if (r.ok) { onAssign(); onClose(); }
    } catch {} finally { setL(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "mIn 0.3s ease" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Case Details</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.title}</h4>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: s.b, color: s.c, flexShrink: 0 }}>{s.l}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{c.description?.slice(0, 120)}{c.description?.length > 120 ? "…" : ""}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase" }}>Client</p>
              <p style={{ margin: "4px 0", fontSize: 14, fontWeight: 700, color: "#1e40af" }}>{c.clientId?.name || "Unknown"}</p>
              {c.clientId?._id && <button onClick={() => { onClose(); router.push(`/dashboard/admin/messages?contact=${c.clientId._id}`); }} style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={11} />Message</button>}
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#86efac", textTransform: "uppercase" }}>Lawyer</p>
              <p style={{ margin: "4px 0", fontSize: 14, fontWeight: 700, color: "#14532d" }}>{c.assignedLawyerId?.name || "Unassigned"}</p>
              {c.assignedLawyerId?._id && <button onClick={() => { onClose(); router.push(`/dashboard/admin/messages?contact=${c.assignedLawyerId._id}`); }} style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={11} />Message</button>}
            </div>
          </div>
          <div style={{ background: "#fefce8", borderRadius: 12, padding: 16, border: "1px solid #fef08a" }}>
            <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#713f12" }}>{c.assignedLawyerId ? "Re-assign Lawyer" : "Assign Lawyer"}</p>
            <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", marginBottom: 10, outline: "none" }} value={sel} onChange={e => setSel(e.target.value)}>
              <option value="">-- Select a lawyer --</option>
              {lawyers.map(l => <option key={l._id} value={l._id}>{l.name || l.email}</option>)}
            </select>
            <button onClick={assign} disabled={!sel || loading} style={{ width: "100%", padding: 12, borderRadius: 10, background: sel ? "#0A1A3F" : "#e2e8f0", color: sel ? "#fff" : "#94a3b8", border: "none", fontWeight: 700, fontSize: 14, cursor: sel ? "pointer" : "not-allowed" }}>
              {loading ? "Assigning…" : c.assignedLawyerId ? "Re-assign" : "Assign Case"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserModal({ u, onClose, onDelete }) {
  const router = useRouter();
  const rc = ROLE_C[u.role] || "#64748b";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "mIn 0.3s ease" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>User Details</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: rc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, overflow: "hidden" }}>
            {u.profileImage ? <img src={u.profileImage} style={{ width: 72, height: 72, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#0f172a" }}>{u.name || "Unnamed"}</p>
            <p style={{ margin: "4px 0", fontSize: 13, color: "#64748b" }}>{u.email}</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role}</span>
          </div>
          <div style={{ width: "100%", background: "#f8fafc", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left" }}>
            {[
              { l: "Joined",   v: new Date(u.createdAt || Date.now()).toLocaleDateString() },
              { l: "Status",   v: u.suspended ? "⛔ Suspended" : "✅ Active" },
              { l: "Verified", v: u.emailVerified ? "✓ Yes" : "Pending" },
              { l: "ID",       v: (u._id || "").slice(-8) },
            ].map(({ l, v }) => (
              <div key={l}><p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{l}</p><p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#374151" }}>{v}</p></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={() => { onClose(); router.push(`/dashboard/admin/messages?contact=${u._id}`); }}
              style={{ flex: 1, padding: 11, borderRadius: 12, background: "#0A1A3F", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MessageSquare size={14} />Message
            </button>
            <button onClick={() => { onClose(); router.push(`/dashboard/admin/video-calls?contact=${u._id}`); }}
              style={{ flex: 1, padding: 11, borderRadius: 12, background: "#10b981", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Video size={14} />Call
            </button>
          </div>
          <button onClick={() => { onClose(); onDelete(u); }}
            style={{ width: "100%", padding: 10, borderRadius: 12, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Trash2 size={14} />Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ u, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Trash2 size={24} style={{ color: "#ef4444" }} /></div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Delete User?</h3>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>Permanently delete <strong>{u?.name || u?.email}</strong>? Cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 12, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, profile } = useAppSelector(s => s.auth);

  const [dashData,    setDashData]  = useState(null);
  const [lawyers,     setLawyers]   = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [refreshing,  setRef]       = useState(false);
  const [vis,         setVis]       = useState(false);
  const [selCase,     setSelCase]   = useState(null);
  const [selUser,     setSelUser]   = useState(null);
  const [delTarget,   setDel]       = useState(null);
  const [delLoading,  setDelL]      = useState(false);
  const [userSearch,  setUS]        = useState("");
  const [toast,       setToast]     = useState(null);
  const [showBroadcast, setBcast]   = useState(false);

  const [unreadMsgs,      setUnreadMsgs]      = useState(0);
  const [unreadNotifs,    setUnreadNotifs]    = useState(0);
  const [latestMsgSender, setLatestMsgSender] = useState(null);

  const pollRef   = useRef(null);
  const badgePoll = useRef(null);

  const name = profile?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Admin";
  const showToast = (msg, type = "success") => setToast({ msg, type });

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
        setDashData(d);
        if (d.stats?.unreadNotifications != null) setUnreadNotifs(d.stats.unreadNotifications);
        if (d.stats?.unreadMessages      != null) setUnreadMsgs(d.stats.unreadMessages);
      }
      const lr = await fetch(`${API}/api/lawyers?limit=100`, { credentials: "include", headers: hdrs() });
      if (lr.ok) { const ld = await lr.json(); if (ld.lawyers?.length) setLawyers(ld.lawyers); }
    } catch {} finally { setLoading(false); setRef(false); setTimeout(() => setVis(true), 50); }
  }, []);

  useEffect(() => {
    if (!tok()) { setLoading(false); setTimeout(() => setVis(true), 50); return; }
    loadAll();
    fetchBadges();
    pollRef.current   = setInterval(() => loadAll(true), 30000);
    badgePoll.current = setInterval(fetchBadges,         10000);
    return () => { clearInterval(pollRef.current); clearInterval(badgePoll.current); };
  }, []);

  const handleDelete = async () => {
    if (!delTarget) return;
    setDelL(true);
    try {
      const r = await fetch(`${API}/api/admin/users/${delTarget._id}`, { method: "DELETE", credentials: "include", headers: hdrs() });
      if (r.ok) { setDashData(p => p ? { ...p, recentUsers: (p.recentUsers || []).filter(u => u._id !== delTarget._id) } : p); showToast(`${delTarget.name || "User"} deleted`); }
      else showToast("Delete failed", "error");
    } catch { showToast("Delete failed", "error"); }
    finally { setDelL(false); setDel(null); }
  };

  const stats       = dashData?.stats || {};
  const recentUsers = dashData?.recentUsers || [];
  const recentCases = dashData?.recentCases || [];
  const notifs      = dashData?.recentNotifications || [];
  if (dashData?.lawyers?.length && !lawyers.length) setLawyers(dashData.lawyers);

  const notifBadge = unreadNotifs || stats.unreadNotifications || 0;
  const msgBadge   = unreadMsgs   || stats.unreadMessages      || 0;

  const filteredUsers = recentUsers.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const goMessages = () => {
    const base = "/dashboard/admin/messages";
    router.push(latestMsgSender ? `${base}?contact=${latestMsgSender}` : base);
  };

  // ── CHANGE: "Activity Log" replaced with "Payments" ──────────────────────
  const QUICK = [
    { l: "User Management", icon: Users,         c: "#ef4444", fn: () => router.push("/dashboard/admin/user-management") },
    { l: "System Settings", icon: Settings,      c: "#f59e0b", fn: () => router.push("/dashboard/admin/system-settings") },
    { l: "Messages",        icon: MessageSquare, c: "#3b82f6", fn: goMessages,                                             badge: msgBadge },
    { l: "Notifications",   icon: Bell,          c: "#8b5cf6", fn: () => router.push("/dashboard/admin/notifications"),    badge: notifBadge },
    { l: "All Cases",       icon: Scale,         c: "#10b981", fn: () => router.push("/dashboard/admin/Admincases") },
    { l: "Payments",        icon: CreditCard,    c: "#2563eb", fn: () => router.push("/dashboard/admin/payments") },  // ← CHANGED
  ];

  const css = `
    @keyframes fd{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}
    .ch:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.09)!important}
    .ch{transition:all 0.2s ease!important}
    .rh:hover{background:#f8fafc!important}
    .rh{transition:background 0.12s}
    .ib:hover{filter:brightness(0.9)}
    .ib{transition:all 0.15s}
    .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:600px 100%;animation:pulse 1.4s ease infinite;border-radius:8px;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .qbtn{transition:all 0.18s;border:1px solid #f1f5f9;cursor:pointer;border-radius:16px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
    .qbtn:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important}
    .qbadge{position:absolute;top:6px;right:6px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1;animation:badgePop 0.3s ease}
  `;

  if (loading && !vis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTopColor: "#ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#64748b", fontSize: 14 }}>Loading admin dashboard…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease" }}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Admin Dashboard 🛡️</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Welcome, {name}! Full platform control.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setBcast(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Bell size={14} />Broadcast
          </button>
          <button onClick={() => router.push("/dashboard/admin/payments")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <CreditCard size={14} />Payments
          </button>
          <button onClick={() => loadAll(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />Refresh
          </button>
          <button onClick={() => router.push("/dashboard/admin/user-management")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#ef4444", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Users size={14} />Manage Users
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { l: "Total Users",      v: stats.totalUsers      || 0, icon: Users,      c: "#ef4444", b: "#fef2f2" },
          { l: "Lawyers",          v: stats.totalLawyers    || 0, icon: Briefcase,  c: "#10b981", b: "#f0fdf4" },
          { l: "Clients",          v: stats.totalClients    || 0, icon: UserCheck,  c: "#3b82f6", b: "#eff6ff" },
          { l: "Cases This Month", v: stats.thisMonthCases  || 0, icon: BarChart3,  c: "#f59e0b", b: "#fffbeb" },
          { l: "Open Cases",       v: stats.openCases       || 0, icon: Scale,      c: "#8b5cf6", b: "#f5f3ff" },
          { l: "System Health",    v: stats.systemHealth    || "99.9%", icon: Shield, c: "#10b981", b: "#f0fdf4" },
        ].map((s, i) => (
          <div key={s.l} className="ch" style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", animation: `fd 0.4s ease ${i * 0.07}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.b, display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon size={18} style={{ color: s.c }} /></div>
              <TrendingUp size={13} style={{ color: "#10b981" }} />
            </div>
            <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
              {loading ? <span className="skel" style={{ display: "inline-block", width: 60, height: 26 }} /> : typeof s.v === "number" ? <Counter to={s.v} /> : s.v}
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 28 }}>
        {QUICK.map((q, i) => (
          <button key={q.l} onClick={q.fn} className="qbtn ch" style={{ animation: `fd 0.4s ease ${0.3 + i * 0.06}s both`, position: "relative" }}>
            {q.badge > 0 && <span className="qbadge">{q.badge > 99 ? "99+" : q.badge}</span>}
            <div style={{ width: 44, height: 44, borderRadius: 13, background: q.c, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${q.c}40` }}>
              <q.icon size={20} style={{ color: "#fff" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{q.l}</span>
          </button>
        ))}
      </div>

      {/* Main 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Recent Cases */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden", animation: "fd 0.5s ease 0.4s both" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}><Scale size={16} style={{ color: "#ef4444" }} /></div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Cases</span>
            </div>
            <button onClick={() => router.push("/dashboard/admin/Admincases")} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>View all <ArrowRight size={12} /></button>
          </div>
          {loading ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skel" style={{ height: 56 }} />)}</div>
          ) : recentCases.length === 0 ? (
            <div style={{ padding: "40px 22px", textAlign: "center" }}><Scale size={32} style={{ color: "#e2e8f0", display: "block", margin: "0 auto 10px" }} /><p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>No cases yet</p></div>
          ) : recentCases.map((c, i) => {
            const s = STATUS[c.status] || STATUS.open;
            return (
              <div key={c._id} className="rh" style={{ padding: "12px 22px", borderBottom: i < recentCases.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSelCase(c)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.b, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Scale size={14} style={{ color: s.c }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{c.clientId?.name || "Client"} • {c.category}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: s.b, color: s.c }}>{s.l}</span>
                  <span style={{ fontSize: 10, color: "#cbd5e1" }}>{c.assignedLawyerId ? "✓ Assigned" : "Unassigned"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Users */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden", animation: "fd 0.5s ease 0.5s both" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={16} style={{ color: "#ef4444" }} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Users</span>
              </div>
              <button onClick={() => router.push("/dashboard/admin/user-management")} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>All users <ArrowRight size={12} /></button>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8" }} />
              <input style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8, border: "1px solid #f1f5f9", fontSize: 12, outline: "none", background: "#f8fafc", boxSizing: "border-box", color: "#374151" }}
                placeholder="Filter users…" value={userSearch} onChange={e => setUS(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 48 }} />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: "40px 22px", textAlign: "center" }}><Users size={32} style={{ color: "#e2e8f0", display: "block", margin: "0 auto 10px" }} /><p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>No users found</p></div>
          ) : filteredUsers.map((u, i) => {
            const rc = ROLE_C[u.role] || "#64748b";
            return (
              <div key={u._id} style={{ padding: "10px 22px", borderBottom: i < filteredUsers.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => setSelUser(u)} style={{ width: 34, height: 34, borderRadius: "50%", background: rc, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", overflow: "hidden" }}>
                  {u.profileImage ? <img src={u.profileImage} style={{ width: 34, height: 34, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
                </div>
                <div onClick={() => setSelUser(u)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Unnamed"}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize", flexShrink: 0 }}>{u.role}</span>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button className="ib" onClick={() => router.push(`/dashboard/admin/messages?contact=${u._id}`)} title="Message"
                    style={{ width: 28, height: 28, borderRadius: 7, background: "#eff6ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageSquare size={12} style={{ color: "#3b82f6" }} />
                  </button>
                  <button className="ib" onClick={() => router.push(`/dashboard/admin/video-calls?contact=${u._id}`)} title="Video Call"
                    style={{ width: 28, height: 28, borderRadius: 7, background: "#f0fdf4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={12} style={{ color: "#10b981" }} />
                  </button>
                  <button className="ib" onClick={() => setDel(u)} title="Delete"
                    style={{ width: 28, height: 28, borderRadius: 7, background: "#fef2f2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={12} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications preview */}
      {notifs.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24, animation: "fd 0.5s ease 0.6s both" }}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={15} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Recent Notifications</span>
              {notifBadge > 0 && <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "#ef4444", color: "#fff" }}>{notifBadge}</span>}
            </div>
            <button onClick={() => router.push("/dashboard/admin/notifications")} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>All →</button>
          </div>
          {notifs.slice(0, 3).map((n, i) => (
            <div key={n._id || i} style={{ padding: "10px 22px", borderBottom: i < 2 ? "1px solid #f8fafc" : "none", background: n.read ? "transparent" : "#fffbeb", cursor: "pointer" }}
              onClick={() => { if (n.link) router.push(n.link); else if (n.type === "message" && n.meta?.senderId) router.push(`/dashboard/admin/messages?contact=${n.meta.senderId}`); else router.push("/dashboard/admin/notifications"); }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0f172a" }}>{n.title}</p>
              {(n.body || n.message) && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{n.body || n.message}</p>}
              <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>{new Date(n.createdAt || Date.now()).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {showBroadcast && <BroadcastModal onClose={() => setBcast(false)} onSent={() => showToast("Broadcast sent to all users!")} />}
      {selCase && <CaseModal c={selCase} lawyers={lawyers} onClose={() => setSelCase(null)} onAssign={() => { loadAll(true); showToast("Case assigned successfully!"); }} />}
      {selUser && <UserModal u={selUser} onClose={() => setSelUser(null)} onDelete={u => { setSelUser(null); setDel(u); }} />}
      {delTarget && <DeleteModal u={delTarget} onClose={() => setDel(null)} onConfirm={handleDelete} loading={delLoading} />}
    </div>
  );
}