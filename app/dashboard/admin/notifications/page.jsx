"use client";
// app/dashboard/[role]/notifications/page.jsx
// Auto-marks ALL notifications as read the moment the page loads.
// Bell badge clears instantly — no manual button needed.
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { selectInitialized } from "../../../../store/slices/authSlice";
import {
  Bell, Check, Info, AlertTriangle, CheckCircle,
  MessageSquare, Video, Trash2, RefreshCw, X, Briefcase,
} from "lucide-react";

const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok   = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const authH = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const TYPE_CFG = {
  info:     { icon: Info,          color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)",  label: "Info"    },
  warning:  { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  label: "Warning" },
  success:  { icon: CheckCircle,   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "Success" },
  message:  { icon: MessageSquare, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  label: "Message" },
  call:     { icon: Video,         color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.2)",   label: "Call"    },
  case:     { icon: Briefcase,     color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)",  label: "Case"    },
  system:   { icon: Bell,          color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)", label: "System"  },
  // extra types from Notification model
  case_update:        { icon: Briefcase,     color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)",  label: "Case"    },
  new_proposal:       { icon: CheckCircle,   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "Proposal"},
  proposal_accepted:  { icon: CheckCircle,   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "Accepted"},
  proposal_rejected:  { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   label: "Rejected"},
  payment_received:   { icon: CheckCircle,   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  label: "Payment" },
  review_received:    { icon: Info,          color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  label: "Review"  },
};

function SkeletonItem() {
  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#e2e8f0", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ width: "42%", height: 13, borderRadius: 6, background: "#e2e8f0", animation: "sk 1.4s ease infinite" }} />
        <div style={{ width: "68%", height: 11, borderRadius: 6, background: "#e2e8f0", animation: "sk 1.4s ease infinite" }} />
        <div style={{ width: "24%", height: 9,  borderRadius: 6, background: "#e2e8f0", animation: "sk 1.4s ease infinite" }} />
      </div>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return "";
  const d = new Date(date), now = new Date(), diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const router      = useRouter();
  const { user }    = useAppSelector(s => s.auth);
  const initialized = useAppSelector(selectInitialized);

  const [notifications, setNotifs]  = useState([]);
  const [loading,       setLoading] = useState(true);
  const [filter,        setFilter]  = useState("all");
  const [typeFilter,    setTypeF]   = useState("all");
  const [vis,           setVis]     = useState(false);
  const [toast,         setToast]   = useState(null);
  const pollRef    = useRef(null);
  const autoReadDone = useRef(false); // ensure we only auto-mark-all once per visit

  const role     = user?.role || "client";
  const basePath = `/dashboard/${role}`;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch notifications ───────────────────────────────────────────
  const fetchNotifs = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API}/api/notifications?limit=50`, {
        credentials: "include", headers: authH(),
      });
      if (r.ok) {
        const d = await r.json();
        setNotifs(Array.isArray(d) ? d : (d.notifications ?? []));
      }
    } catch {}
    finally {
      if (!silent) { setLoading(false); setTimeout(() => setVis(true), 60); }
    }
  }, [user]);

  // ── Auto-mark-all-read once on first load ─────────────────────────
  const autoMarkAllRead = useCallback(async () => {
    if (autoReadDone.current) return;
    autoReadDone.current = true;
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PATCH", credentials: "include", headers: authH(),
      });
      // Update local state so UI reflects read immediately
      setNotifs(p => p.map(n => ({ ...n, read: true })));
    } catch {
      // non-fatal — silently ignore
    }
  }, []);

  useEffect(() => {
    if (!initialized || !user) {
      setLoading(false);
      setTimeout(() => setVis(true), 60);
      return;
    }

    // 1. Fetch notifications
    fetchNotifs().then(() => {
      // 2. After fetching, mark all as read (runs once)
      autoMarkAllRead();
    });

    // 3. Poll silently every 10s to catch new ones
    pollRef.current = setInterval(() => fetchNotifs(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [user, initialized]);

  // ── Actions ───────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PATCH", credentials: "include", headers: authH(),
      });
      setNotifs(p => p.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
    } catch { showToast("Failed to mark as read", "error"); }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/api/notifications/${id}`, {
        method: "DELETE", credentials: "include", headers: authH(),
      });
      setNotifs(p => p.filter(n => n._id !== id && n.id !== id));
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleClick = (n) => {
    const id = n._id || n.id;
    if (!n.read) markRead(id);
    if (n.link)              { router.push(n.link); return; }
    if (n.type === "message") router.push(`${basePath}/messages`);
    else if (n.type === "call") router.push(`${basePath}/video-calls`);
    else if (n.type?.startsWith("case")) router.push(`${basePath}/cases`);
  };

  // ── Filtered list ─────────────────────────────────────────────────
  const displayed = notifications.filter(n => {
    if (filter === "unread" && n.read)   return false;
    if (filter === "read"   && !n.read)  return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const unread   = notifications.filter(n => !n.read).length;
  const allTypes = [...new Set(notifications.map(n => n.type || "info"))];

  const css = `
    @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
    .notif-row{transition:all 0.15s;cursor:pointer;}
    .notif-row:hover{background:#f8fafc!important;transform:translateX(2px);}
    .mark-btn,.del-btn{transition:all 0.15s;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;}
    .mark-btn:hover{color:#10b981!important;background:rgba(16,185,129,0.1)!important;}
    .del-btn:hover{color:#ef4444!important;background:rgba(239,68,68,0.1)!important;}
    .filter-btn{transition:all 0.15s;cursor:pointer;border-radius:20px;font-size:13px;font-weight:600;}
  `;

  return (
    <>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`, color: toast.type === "error" ? "#dc2626" : "#16a34a", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8, animation: "slideIn 0.2s ease" }}>
          {toast.type === "error" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, display: "flex" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={20} style={{ color: "#fff" }} />
              </span>
              Notifications
            </h2>
            <p style={{ margin: "6px 0 0 50px", fontSize: 14, color: "#64748b" }}>
              {notifications.length > 0 ? `${notifications.length} total · all caught up ✓` : "No notifications yet"}
            </p>
          </div>
          <button onClick={() => fetchNotifs(false)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* ── Filter tabs ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {[["all", "All", notifications.length], ["unread", "Unread", unread], ["read", "Read", notifications.length - unread]].map(([v, l, count]) => (
            <button key={v} className="filter-btn" onClick={() => setFilter(v)}
              style={{ padding: "7px 16px", border: `1px solid ${filter === v ? "#3b82f6" : "#e2e8f0"}`, background: filter === v ? "#3b82f6" : "#fff", color: filter === v ? "#fff" : "#64748b" }}>
              {l} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Type filter pills ────────────────────────────────────── */}
        {allTypes.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            <button className="filter-btn" onClick={() => setTypeF("all")}
              style={{ padding: "5px 12px", border: `1px solid ${typeFilter === "all" ? "#64748b" : "#e2e8f0"}`, background: typeFilter === "all" ? "#64748b" : "#fff", color: typeFilter === "all" ? "#fff" : "#64748b", fontSize: 12 }}>
              All Types
            </button>
            {allTypes.map(t => {
              const cfg   = TYPE_CFG[t] || TYPE_CFG.info;
              const count = notifications.filter(n => n.type === t).length;
              return (
                <button key={t} className="filter-btn" onClick={() => setTypeF(t)}
                  style={{ padding: "5px 12px", border: `1px solid ${typeFilter === t ? cfg.color : "#e2e8f0"}`, background: typeFilter === t ? cfg.color : "#fff", color: typeFilter === t ? "#fff" : cfg.color, fontSize: 12 }}>
                  {cfg.label} · {count}
                </button>
              );
            })}
          </div>
        )}

        {/* ── List ─────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          {loading ? (
            [1,2,3,4,5].map(i => <SkeletonItem key={i} />)
          ) : displayed.length === 0 ? (
            <div style={{ padding: "72px 24px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Bell size={32} style={{ color: "#cbd5e1" }} />
              </div>
              <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, margin: "0 0 8px" }}>
                {filter === "unread" ? "No unread notifications" : filter === "read" ? "No read notifications" : "No notifications yet"}
              </p>
              <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
                {filter === "all" ? "Updates from lawyers, clients, and the system will appear here." : ""}
              </p>
            </div>
          ) : (
            displayed.map((n, i) => {
              const id   = n._id || n.id;
              const cfg  = TYPE_CFG[n.type] || TYPE_CFG.info;
              const Icon = cfg.icon;
              return (
                <div key={id} className="notif-row"
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex", gap: 14, padding: "15px 20px",
                    borderBottom: i < displayed.length - 1 ? "1px solid #f8fafc" : "none",
                    background: "transparent",
                    animation: `fd 0.3s ease ${Math.min(i, 8) * 0.04}s both`,
                    alignItems: "flex-start",
                  }}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#0f172a", lineHeight: 1.4 }}>{n.title}</p>
                      <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(n.createdAt || n.created_at)}</span>
                    </div>
                    {(n.body || n.message) && (
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{n.body || n.message}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: "capitalize" }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(n.createdAt || n.created_at || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Delete only — no "mark read" button needed since all are auto-read */}
                  <button className="del-btn" onClick={e => deleteNotif(id, e)} title="Delete"
                    style={{ width: 32, height: 32, background: "transparent", color: "#94a3b8", flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {displayed.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#94a3b8", marginTop: 14 }}>
            Showing {displayed.length} of {notifications.length} notifications
          </p>
        )}
      </div>
    </>
  );
}