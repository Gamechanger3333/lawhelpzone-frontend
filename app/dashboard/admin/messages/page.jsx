"use client";
// app/dashboard/[role]/messages/page.jsx
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Phone, Video, User, X, Send, Paperclip, Smile,
  Search, Plus, ChevronLeft,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
const EMOJIS = ["😊","😂","👍","❤️","🙏","✅","🔥","💯","⚖️","📋","💼","📞","✉️","🎉","🤝","📌","👋","🌟","💪","🎯"];

const fmt = (d) => {
  try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};
const fmtDay = (d) => {
  try {
    const n = new Date(), t = new Date(d);
    if (n.toDateString() === t.toDateString()) return "Today";
    const y = new Date(n); y.setDate(n.getDate() - 1);
    return y.toDateString() === t.toDateString() ? "Yesterday" : t.toLocaleDateString();
  } catch { return ""; }
};

function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "var(--sk,#e2e8f0)", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

function Avatar({ user: u, size = 40 }) {
  const bg = ROLE_C[u?.role] || "#6366f1";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
      {u?.profileImage
        ? <img src={u.profileImage} style={{ width: size, height: size, objectFit: "cover" }} alt="" />
        : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function ProfileModal({ user: u, onClose, onMessage, onCall }) {
  if (!u) return null;
  const rc = ROLE_C[u.role] || "#6366f1";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--sidebar-bg,#fff)", borderRadius: 22, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "scIn 0.3s ease", border: "1px solid var(--border-color,#e2e8f0)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-color,#e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Profile</h3>
          <button onClick={onClose} style={{ background: "var(--input-bg,#f1f5f9)", border: "none", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", color: "var(--text-muted,#64748b)" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: rc, color: "#fff", fontSize: 30, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `3px solid ${rc}40` }}>
            {u.profileImage ? <img src={u.profileImage} style={{ width: 80, height: 80, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{u.name || "User"}</p>
            <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text-muted,#64748b)" }}>{u.email}</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role || "user"}</span>
          </div>
          {u.phone && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📞 {u.phone}</p>}
          {u.city && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📍 {u.city}{u.country ? `, ${u.country}` : ""}</p>}
          {u.role === "lawyer" && u.lawyerProfile?.specializations?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
              {u.lawyerProfile.specializations.slice(0, 4).map(s => (
                <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac" }}>{s}</span>
              ))}
            </div>
          )}
          {u.createdAt && <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#94a3b8)" }}>Member since {new Date(u.createdAt).toLocaleDateString()}</p>}
          <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
            <button onClick={onMessage} style={{ flex: 1, padding: 11, borderRadius: 12, background: rc, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💬 Message</button>
            <button onClick={onCall}    style={{ flex: 1, padding: 11, borderRadius: 12, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📹 Video Call</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewConvPanel({ onClose, onSelect, myId }) {
  const [users,   setUsers]  = useState([]);
  const [search,  setSearch] = useState("");
  const [loading, setL]      = useState(true);

  useEffect(() => {
    const load = async () => {
      setL(true);
      try {
        const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setUsers(d.allUsers || []); return; }
        const r2 = await fetch(`${API}/api/admin/users?limit=200`, { credentials: "include", headers: HJ() });
        if (r2.ok) { const d = await r2.json(); setUsers(d.users || []); return; }
        const r3 = await fetch(`${API}/api/lawyers?limit=50`, { credentials: "include", headers: HJ() });
        if (r3.ok) { const d = await r3.json(); setUsers(d.lawyers || []); }
      } catch {} finally { setL(false); }
    };
    load();
  }, []);

  const filtered = users.filter(u => {
    if (u._id === myId) return false;
    const q = search.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 300, height: "100vh", background: "var(--sidebar-bg,#fff)", borderRight: "1px solid var(--border-color,#e2e8f0)", display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.12)", animation: "slideIn 0.25s ease" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border-color,#e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>New Conversation</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#64748b)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted,#94a3b8)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Skeleton w={36} h={36} r={18} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <Skeleton w="55%" h={11} /><Skeleton w="75%" h={9} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 14px", textAlign: "center", color: "var(--text-muted,#94a3b8)" }}>
              <p style={{ margin: 0, fontSize: 13 }}>No users found</p>
            </div>
          ) : filtered.map(u => {
            const rc = ROLE_C[u.role] || "#6366f1";
            return (
              <div key={u._id} onClick={() => onSelect(u)}
                style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar user={u} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#94a3b8)" }}>{u.email}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize", flexShrink: 0 }}>{u.role}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
  if (!r.ok) throw new Error("Upload failed");
  const d = await r.json();
  return { url: d.url || d.fileUrl, name: file.name, size: file.size, type: file.type };
}

// ── Inner content that uses useSearchParams ──────────────────────────────────
function MessagesContent() {
  const { user }     = useAppSelector(s => s.auth);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const contactParam = searchParams?.get("contact");

  const [contacts,    setContacts]   = useState([]);
  const [activeId,    setActiveId]   = useState(null);
  const [activeInfo,  setActiveInfo] = useState(null);
  const [messages,    setMsgs]       = useState([]);
  const [text,        setText]       = useState("");
  const [search,      setSearch]     = useState("");
  const [loadC,       setLoadC]      = useState(true);
  const [loadM,       setLoadM]      = useState(false);
  const [sending,     setSend]       = useState(false);
  const [uploading,   setUpload]     = useState(false);
  const [ready,       setReady]      = useState(false);
  const [showEmoji,   setEmoji]      = useState(false);
  const [showNewConv, setShowNew]    = useState(false);
  const [profileUser, setProfileU]   = useState(null);

  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  const fetchUserInfo = useCallback(async (id) => {
    try {
      const r = await fetch(`${API}/api/users/${id}`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; }
    } catch {}
    try {
      const r = await fetch(`${API}/api/lawyers/${id}`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); const u = d.lawyer || d; if (u?._id) return u; }
    } catch {}
    try {
      const r = await fetch(`${API}/api/admin/users/${id}`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; }
    } catch {}
    try {
      const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); return (d.allUsers || []).find(u => u._id === id) || null; }
    } catch {}
    return null;
  }, []);

  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoadC(true);
    try {
      const r = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); setContacts(d.contacts || []); }
    } catch {}
    if (!silent) { setLoadC(false); setTimeout(() => setReady(true), 80); }
  }, []);

  const loadMsgs = useCallback(async (contactId, silent = false) => {
    if (!contactId) return;
    if (!silent) setLoadM(true);
    try {
      const r = await fetch(`${API}/api/messages/${contactId}`, { credentials: "include", headers: HJ() });
      if (r.ok) {
        const d = await r.json();
        setMsgs(d.messages || []);
        fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, []);

  const sendMsg = useCallback(async (attachment = null) => {
    const content = text.trim();
    if (!content && !attachment) return;
    const receiverId = activeId || contactParam;
    if (!receiverId) return;
    setText("");
    setSend(true);
    const opt = {
      _id: `opt-${Date.now()}`, senderId: myId, receiverId, content,
      createdAt: new Date().toISOString(), pending: true,
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: attachment.type?.startsWith("image/") ? "image" : "file" } : {}),
    };
    setMsgs(p => [...p, opt]);
    try {
      const body = { receiverId, content };
      if (attachment) { body.fileUrl = attachment.url; body.fileName = attachment.name; body.type = attachment.type?.startsWith("image/") ? "image" : "file"; }
      const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        setMsgs(p => p.map(m => m._id === opt._id ? (d.message || d) : m));
        if (!activeId && contactParam) setActiveId(contactParam);
        loadContacts(true);
      } else {
        setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content);
      }
    } catch { setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content); }
    finally { setSend(false); }
  }, [text, activeId, contactParam, myId]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUpload(true);
    try { const att = await uploadFile(file); await sendMsg(att); }
    catch { alert("File upload failed."); }
    finally { setUpload(false); }
  };

  const selectContact = (c) => {
    setActiveId(c._id); setActiveInfo(c); setSearch(""); setShowNew(false);
  };

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 500); return; }
    loadContacts();
    pollRef.current = setInterval(() => loadContacts(true), 8000);
    return () => clearInterval(pollRef.current);
  }, [user]);

  useEffect(() => {
    if (!contactParam && !activeId && contacts.length > 0) {
      selectContact(contacts[0]);
    }
  }, [contacts.length, contactParam, activeId]);

  useEffect(() => {
    if (!contactParam) return;
    const init = async () => {
      const found = contacts.find(c => c._id === contactParam);
      if (found) { setActiveId(contactParam); setActiveInfo(found); return; }
      const info = await fetchUserInfo(contactParam);
      if (info) { setActiveId(contactParam); setActiveInfo(info); }
    };
    init();
  }, [contactParam, contacts.length]);

  useEffect(() => {
    if (!activeId) return;
    loadMsgs(activeId);
    const t = setInterval(() => { loadMsgs(activeId, true); loadContacts(true); }, 3000);
    return () => clearInterval(t);
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loadC) setTimeout(() => setReady(true), 80); }, [loadC]);

  const filteredContacts = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const grouped = messages.reduce((acc, msg) => {
    const day = fmtDay(msg.createdAt || Date.now());
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const activeName = activeInfo?.name || activeInfo?.email || "Chat";
  const activeDot  = ROLE_C[activeInfo?.role] || "#6366f1";
  const showChat   = !!(activeId);
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  return (
    <>
      <style>{`
        :root{--sk:#e2e8f0;--chat-bg:#f8fafc;--sidebar-bg:#ffffff;--header-bg:#ffffff;--input-bg:#f8fafc;--input-border:#e2e8f0;--conv-hover:#f1f5f9;--border-color:#e2e8f0;--bubble-other-bg:#ffffff;--bubble-other-color:#0f172a;--day-bg:#f8fafc;--text-heading:#0f172a;--text-muted:#64748b;--text-primary:#374151;}
        .dark{--sk:#1e293b;--chat-bg:#0a0f1a;--sidebar-bg:#0f172a;--header-bg:#0f172a;--input-bg:#1e293b;--input-border:#334155;--conv-hover:#1a2234;--border-color:#334155;--bubble-other-bg:#1e293b;--bubble-other-color:#f1f5f9;--day-bg:#1e293b;--text-heading:#f1f5f9;--text-muted:#94a3b8;--text-primary:#e2e8f0;}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes scIn{from{transform:scale(0.95) translateY(14px);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideIn{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
        .msg-b{animation:fd 0.18s ease;}.conv-row{transition:background 0.12s;cursor:pointer;}.conv-row:hover{background:var(--conv-hover)!important;}.conv-row.active-c{background:var(--conv-hover)!important;border-left:3px solid #3b82f6!important;}.msg-inp:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}.send-btn:not(:disabled):hover{opacity:.85;}.send-btn:disabled{opacity:.45;cursor:not-allowed;}.icon-btn:hover{opacity:.75;transform:scale(1.08);}.icon-btn{transition:all .15s;}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
      `}</style>

      <div style={{ height: "calc(100vh - 112px)", display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>
        {/* SIDEBAR */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", background: "var(--sidebar-bg)", borderRight: "1px solid var(--border-color)", flexShrink: 0 }}>
          <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading)" }}>Messages</h2>
              <button className="icon-btn" onClick={() => setShowNew(true)} title="New conversation"
                style={{ width: 32, height: 32, borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid var(--input-border)", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadC ? (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Skeleton w={42} h={42} r={21} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      <Skeleton w="50%" h={12} /><Skeleton w="70%" h={10} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {pendingInSidebar && (
                  <div className={`conv-row${activeId === contactParam ? " active-c" : ""}`}
                    onClick={() => selectContact(activeInfo)}
                    style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${activeId === contactParam ? "#3b82f6" : "transparent"}` }}>
                    <Avatar user={activeInfo} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-heading)" }}>{activeInfo.name || activeInfo.email}</span>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>New conversation</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${ROLE_C[activeInfo.role] || "#6366f1"}18`, color: ROLE_C[activeInfo.role] || "#6366f1" }}>{activeInfo.role || "user"}</span>
                  </div>
                )}
                {filteredContacts.length === 0 && !pendingInSidebar ? (
                  <div style={{ padding: "36px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No conversations yet</p>
                    <p style={{ margin: "6px 0 14px", fontSize: 12 }}>Click + to start a new conversation</p>
                    <button onClick={() => setShowNew(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New Conversation</button>
                  </div>
                ) : filteredContacts.map(contact => {
                  const dot   = ROLE_C[contact.role] || "#6366f1";
                  const isAct = activeId === contact._id;
                  return (
                    <div key={contact._id} className={`conv-row${isAct ? " active-c" : ""}`}
                      onClick={() => selectContact(contact)}
                      style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isAct ? "#3b82f6" : "transparent"}` }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar user={contact} size={42} />
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: contact.isOnline ? "#10b981" : "#94a3b8", border: "2px solid var(--sidebar-bg)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: contact.unread > 0 ? 800 : 600, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{contact.name || contact.email || "Unknown"}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, marginLeft: 4 }}>{contact.lastMessageAt ? fmt(contact.lastMessageAt) : ""}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: 12, color: contact.unread > 0 ? "var(--text-heading)" : "var(--text-muted)", fontWeight: contact.unread > 0 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{contact.lastMessage || "Start chatting…"}</p>
                          {contact.unread > 0 && (
                            <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4, padding: "0 4px" }}>{contact.unread}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        {showChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--chat-bg)", minWidth: 0 }}>
            <div style={{ padding: "12px 20px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div onClick={() => setProfileU(activeInfo)} style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
                <Avatar user={activeInfo} size={42} />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: activeInfo?.isOnline ? "#10b981" : "#94a3b8", border: "2px solid var(--header-bg)" }} />
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setProfileU(activeInfo)}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading)" }}>{activeName}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                  {activeInfo?.isOnline ? "● Online" : "● Last seen recently"} · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role || "user"}</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="icon-btn" onClick={() => router.push(`/dashboard/${role}/video-calls?contact=${activeId}`)} title="Video Call"
                  style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={16} style={{ color: "#10b981" }} />
                </button>
                <button className="icon-btn" onClick={() => setProfileU(activeInfo)} title="View Profile"
                  style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
              {loadM ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3,4].map((x, j) => (
                    <div key={x} style={{ display: "flex", justifyContent: j % 2 ? "flex-end" : "flex-start" }}>
                      <Skeleton w={`${32 + j * 12}%`} h={44} r={14} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14, animation: "pop 0.4s ease" }}>👋</div>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--text-heading)" }}>Start the conversation</p>
                  <p style={{ fontSize: 14, margin: 0 }}>Say hello to {activeName}!</p>
                </div>
              ) : Object.entries(grouped).map(([day, dayMsgs]) => (
                <div key={day}>
                  <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border-color)" }} />
                    <span style={{ background: "var(--chat-bg)", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                  </div>
                  {dayMsgs.map((msg, i) => {
                    const mine  = String(msg.senderId?._id || msg.senderId) === myId;
                    const isImg = msg.type === "image";
                    return (
                      <div key={msg._id || i} className="msg-b"
                        style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4, alignItems: "flex-end", gap: 6 }}>
                        {!mine && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {activeName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ maxWidth: "68%" }}>
                          <div style={{ padding: isImg ? 4 : "10px 14px", borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: mine ? "#3b82f6" : "var(--bubble-other-bg)", color: mine ? "#fff" : "var(--bubble-other-color)", border: mine ? "none" : "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: msg.pending ? 0.6 : 1, transition: "opacity 0.2s" }}>
                            {msg.content && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>{msg.content}</p>}
                            {msg.fileUrl && (isImg ? (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                <img src={msg.fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: 220, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover", marginTop: msg.content ? 6 : 0 }} />
                              </a>
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)", marginTop: msg.content ? 6 : 0 }}>
                                <Paperclip size={16} />
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{msg.fileName || "File"}</p>
                                  <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Download</p>
                                </div>
                              </a>
                            ))}
                          </div>
                          <p style={{ margin: "2px 4px 0", fontSize: 10, color: "var(--text-muted)", textAlign: mine ? "right" : "left" }}>
                            {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                            {mine && !msg.pending && <span style={{ marginLeft: 3 }}>{msg.read ? " ✓✓" : " ✓"}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {showEmoji && (
              <div style={{ padding: "10px 16px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { setText(p => p + e); setEmoji(false); inputRef.current?.focus(); }}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", transition: "transform 0.1s" }}
                    onMouseEnter={el => el.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={el => el.currentTarget.style.transform = "scale(1)"}>{e}</button>
                ))}
              </div>
            )}

            <div style={{ padding: "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
              <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()} title="Attach file"
                style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {uploading ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Paperclip size={15} style={{ color: "var(--text-muted)" }} />}
              </button>
              <button className="icon-btn" onClick={() => setEmoji(p => !p)} title="Emoji"
                style={{ width: 36, height: 36, borderRadius: 10, background: showEmoji ? "#eff6ff" : "var(--input-bg)", border: `1px solid ${showEmoji ? "#3b82f6" : "var(--border-color)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smile size={16} style={{ color: showEmoji ? "#3b82f6" : "var(--text-muted)" }} />
              </button>
              <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={`Message ${activeName}… (Enter to send, Shift+Enter for new line)`}
                rows={1} className="msg-inp"
                style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: "1px solid var(--input-border)", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: "var(--input-bg)", color: "var(--text-primary)", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit" }} />
              <button onClick={() => sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                style={{ height: 36, padding: "0 16px", borderRadius: 12, background: text.trim() ? "#3b82f6" : "var(--input-bg)", color: text.trim() ? "#fff" : "var(--text-muted)", border: text.trim() ? "none" : "1px solid var(--border-color)", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <><Send size={15} /><span style={{ fontSize: 13 }}>Send</span></>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chat-bg)", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(59,130,246,0.3)", animation: "pop 0.4s ease", fontSize: 44 }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-heading)", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Your messages</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>{contacts.length > 0 ? "Select a conversation from the sidebar" : "Start your first conversation"}</p>
            </div>
            <button onClick={() => setShowNew(true)} style={{ marginTop: 4, padding: "12px 28px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}>
              <Plus size={16} />New Conversation
            </button>
            {contacts.length > 0 && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{contacts.length} conversation{contacts.length !== 1 ? "s" : ""} in your inbox</p>}
          </div>
        )}
      </div>

      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileU(null)} onMessage={() => { setProfileU(null); inputRef.current?.focus(); }} onCall={() => { setProfileU(null); router.push(`/dashboard/${role}/video-calls?contact=${profileUser._id}`); }} />}
      {showNewConv && <NewConvPanel myId={myId} onClose={() => setShowNew(false)} onSelect={(u) => { selectContact(u); setActiveId(u._id); setActiveInfo(u); }} />}
    </>
  );
}

// ── Default Export wrapped in Suspense ────────────────────────────────────────
export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100vh - 112px)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <MessagesContent />
    </Suspense>
  );
}