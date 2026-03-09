"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { Video, X, Send, Paperclip, Smile, Search, Plus, ChevronLeft, Edit2, Trash2, Reply, MoreVertical, Check, CheckCheck } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const fixUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://localhost:5000") || url.startsWith("http://localhost:3000")) {
    return url.replace(/http:\/\/localhost:\d+/, API);
  }
  return url;
};

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
const EMOJIS = ["😊","😂","👍","❤️","🙏","✅","🔥","💯","⚖️","📋","💼","📞","✉️","🎉","🤝","📌","👋","🌟","💪","🎯"];
const REACTIONS = ["👍","❤️","😂","😮","😢","🙏"];

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
  return <div style={{ width: w, height: h, borderRadius: r, background: "#e2e8f0", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

function Avatar({ user: u, size = 40, online }) {
  const bg = ROLE_C[u?.role] || "#6366f1";
  const imgSrc = fixUrl(u?.profileImage);
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgSrc ? <img src={imgSrc} style={{ width: size, height: size, objectFit: "cover" }} alt="" onError={e => { e.target.style.display = "none"; }} /> : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
      </div>
      {online !== undefined && <span style={{ position: "absolute", bottom: 0, right: 0, width: Math.max(size * 0.26, 8), height: Math.max(size * 0.26, 8), borderRadius: "50%", background: online ? "#10b981" : "#94a3b8", border: "2px solid #fff" }} />}
    </div>
  );
}

async function uploadFile(file) {
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
  if (!r.ok) throw new Error("Upload failed");
  const d = await r.json();
  return { url: d.url || d.fileUrl, name: file.name, size: file.size, type: file.type };
}

function MsgMenu({ msg, isMine, onDelete, onEdit, onReply, onReact, onMarkUnread, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const item = (icon, label, action, color = "#0f172a") => (
    <button onClick={() => { action(); onClose(); }}
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color, fontWeight: 600, textAlign: "left" }}
      onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div ref={ref} style={{ position: "absolute", zIndex: 999, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", minWidth: 170, overflow: "hidden", animation: "popIn 0.15s ease" }}>
      <div style={{ display: "flex", gap: 2, padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
        {REACTIONS.map(r => (
          <button key={r} onClick={() => { onReact(r); onClose(); }}
            style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", transition: "transform 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>{r}</button>
        ))}
      </div>
      {item(<Reply size={14} />, "Reply", onReply)}
      {isMine && item(<Edit2 size={14} />, "Edit", onEdit)}
      {item(<Search size={14} />, "Mark as Unread", onMarkUnread)}
      {isMine && item(<Trash2 size={14} />, "Delete", onDelete, "#ef4444")}
    </div>
  );
}

function MessagesContent() {
  const { user } = useAppSelector(s => s.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactParam = searchParams?.get("contact");

  const [contacts,     setContacts]   = useState([]);
  const [activeId,     setActiveId]   = useState(null);
  const [activeInfo,   setActiveInfo] = useState(null);
  const [messages,     setMsgs]       = useState([]);
  const [text,         setText]       = useState("");
  const [search,       setSearch]     = useState("");
  const [msgSearch,    setMsgSearch]  = useState("");
  const [showMsgSrch,  setShowMsgSrch]= useState(false);
  const [loadC,        setLoadC]      = useState(true);
  const [loadM,        setLoadM]      = useState(false);
  const [sending,      setSend]       = useState(false);
  const [uploading,    setUpload]     = useState(false);
  const [ready,        setReady]      = useState(false);
  const [showEmoji,    setEmoji]      = useState(false);
  const [showNewConv,  setShowNew]    = useState(false);
  const [showSidebar,  setShowSidebar]= useState(true);
  const [isMobile,     setIsMobile]   = useState(false);
  const [menuMsg,      setMenuMsg]    = useState(null);
  const [replyTo,      setReplyTo]    = useState(null);
  const [editingMsg,   setEditing]    = useState(null);
  const [isTyping,     setIsTyping]   = useState(false);
  const [onlineUsers,  setOnline]     = useState({});
  const [unreadMsgs,   setUnread]     = useState(new Set());

  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchUserInfo = useCallback(async (id) => {
    for (const url of [`${API}/api/users/${id}`, `${API}/api/admin/users/${id}`]) {
      try { const r = await fetch(url, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; } } catch {}
    }
    return null;
  }, []);

  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoadC(true);
    try {
      const r = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: HJ() });
      if (r.ok) {
        const d = await r.json(); const list = d.contacts || [];
        setContacts(list);
        const online = {}; list.forEach(c => { if (c.isOnline) online[c._id] = true; });
        setOnline(p => ({ ...p, ...online }));
      }
    } catch {}
    if (!silent) { setLoadC(false); setTimeout(() => setReady(true), 80); }
  }, []);

  const loadMsgs = useCallback(async (contactId, silent = false) => {
    if (!contactId) return;
    if (!silent) setLoadM(true);
    try {
      const r = await fetch(`${API}/api/messages/${contactId}`, { credentials: "include", headers: HJ() });
      if (r.ok) {
        const d = await r.json(); setMsgs(d.messages || []);
        if (!silent) fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, []);

  const deleteMsg = useCallback(async (msgId) => {
    setMsgs(p => p.filter(m => m._id !== msgId));
    try { await fetch(`${API}/api/messages/${msgId}`, { method: "DELETE", credentials: "include", headers: HJ() }); }
    catch { loadMsgs(activeId, true); }
  }, [activeId]);

  const submitEdit = useCallback(async () => {
    if (!editingMsg || !text.trim()) return;
    const newText = text.trim();
    setMsgs(p => p.map(m => m._id === editingMsg._id ? { ...m, content: newText, edited: true } : m));
    setText(""); setEditing(null);
    try { await fetch(`${API}/api/messages/${editingMsg._id}`, { method: "PATCH", credentials: "include", headers: HJ(), body: JSON.stringify({ content: newText }) }); }
    catch { loadMsgs(activeId, true); }
  }, [editingMsg, text, activeId]);

  const addReaction = useCallback(async (msgId, emoji) => {
    setMsgs(p => p.map(m => {
      if (m._id !== msgId) return m;
      const r = { ...(m.reactions || {}) };
      if (!r[emoji]) r[emoji] = [];
      if (r[emoji].includes(myId)) { r[emoji] = r[emoji].filter(id => id !== myId); if (!r[emoji].length) delete r[emoji]; }
      else r[emoji] = [...r[emoji], myId];
      return { ...m, reactions: r };
    }));
    try { await fetch(`${API}/api/messages/${msgId}/react`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ emoji }) }); }
    catch {}
  }, [myId]);

  const sendMsg = useCallback(async (attachment = null) => {
    const content = text.trim();
    if (!content && !attachment) return;
    if (editingMsg) { submitEdit(); return; }
    const receiverId = activeId || contactParam;
    if (!receiverId) return;
    setText(""); setReplyTo(null); setSend(true);
    const opt = { _id: `opt-${Date.now()}`, senderId: myId, receiverId, content, createdAt: new Date().toISOString(), pending: true,
      ...(replyTo ? { replyTo: { _id: replyTo._id, content: replyTo.content } } : {}),
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: attachment.type?.startsWith("image/") ? "image" : "file" } : {}),
    };
    setMsgs(p => [...p, opt]);
    try {
      const body = { receiverId, content };
      if (replyTo) body.replyToId = replyTo._id;
      if (attachment) { body.fileUrl = attachment.url; body.fileName = attachment.name; body.type = attachment.type?.startsWith("image/") ? "image" : "file"; }
      const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json(); setMsgs(p => p.map(m => m._id === opt._id ? (d.message || d) : m));
        if (!activeId && contactParam) setActiveId(contactParam); loadContacts(true);
      } else { setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content); }
    } catch { setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content); }
    finally { setSend(false); }
  }, [text, activeId, contactParam, myId, replyTo, editingMsg]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setUpload(true);
    try { await sendMsg(await uploadFile(file)); } catch { alert("Upload failed."); } finally { setUpload(false); }
  };

  const selectContact = (c) => {
    setActiveId(c._id); setActiveInfo(c); setSearch(""); setShowNew(false);
    setMsgSearch(""); setShowMsgSrch(false); setReplyTo(null); setEditing(null);
    if (isMobile) setShowSidebar(false);
  };

  const cancelAction = () => { setEditing(null); setReplyTo(null); setText(""); };

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 500); return; }
    loadContacts();
    const poll = setInterval(() => loadContacts(true), 8000);
    return () => clearInterval(poll);
  }, [user]);

  useEffect(() => { if (!contactParam && !activeId && contacts.length > 0) selectContact(contacts[0]); }, [contacts.length, contactParam, activeId]);

  useEffect(() => {
    if (!contactParam) return;
    const init = async () => {
      const found = contacts.find(c => c._id === contactParam);
      if (found) { setActiveId(contactParam); setActiveInfo(found); if (isMobile) setShowSidebar(false); return; }
      const info = await fetchUserInfo(contactParam);
      if (info) { setActiveId(contactParam); setActiveInfo(info); if (isMobile) setShowSidebar(false); }
    };
    init();
  }, [contactParam, contacts.length]);

  useEffect(() => {
    if (!activeId) return;
    loadMsgs(activeId);
    const t = setInterval(() => { loadMsgs(activeId, true); loadContacts(true); }, 3000);
    const tp = setInterval(async () => {
      try { const r = await fetch(`${API}/api/messages/${activeId}/typing-status`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); setIsTyping(!!d.isTyping); } } catch {}
    }, 2500);
    return () => { clearInterval(t); clearInterval(tp); };
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loadC) setTimeout(() => setReady(true), 80); }, [loadC]);

  const filteredContacts = contacts.filter(c => !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()));
  const displayMsgs = msgSearch ? messages.filter(m => (m.content || "").toLowerCase().includes(msgSearch.toLowerCase())) : messages;
  const grouped = displayMsgs.reduce((acc, msg) => { const day = fmtDay(msg.createdAt || Date.now()); if (!acc[day]) acc[day] = []; acc[day].push(msg); return acc; }, {});

  const activeName   = activeInfo?.name || activeInfo?.email || "Chat";
  const activeDot    = ROLE_C[activeInfo?.role] || "#6366f1";
  const activeOnline = onlineUsers[activeId] || activeInfo?.isOnline || false;
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  return (
    <>
      <style>{`
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.88) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        .msg-b{animation:fd 0.16s ease;}
        .conv-row{transition:background 0.12s;cursor:pointer;}
        .conv-row:hover{background:#f1f5f9;}
        .conv-row.active-c{background:#eff6ff!important;border-left:3px solid #3b82f6!important;}
        .msg-inp:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}
        .send-btn:not(:disabled):hover{opacity:.85;}
        .send-btn:disabled{opacity:.45;cursor:not-allowed;}
        .icon-btn:hover{opacity:.75;transform:scale(1.08);}
        .icon-btn{transition:all .15s;}
        .msg-wrap:hover .msg-actions{opacity:1!important;}
        .typing-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;margin:0 2px;animation:typing 1.2s infinite;}
        .typing-dot:nth-child(2){animation-delay:0.2s}.typing-dot:nth-child(3){animation-delay:0.4s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
      `}</style>

      <div style={{ height: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 112px)", display: "flex", borderRadius: isMobile ? 0 : 20, overflow: "hidden", border: isMobile ? "none" : "1px solid #e2e8f0", boxShadow: isMobile ? "none" : "0 4px 24px rgba(0,0,0,0.07)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* SIDEBAR */}
        {(isMobile ? showSidebar : true) && (
          <div style={{ width: isMobile ? "100%" : 300, display: "flex", flexDirection: "column", background: "#fff", borderRight: isMobile ? "none" : "1px solid #e2e8f0", flexShrink: 0 }}>
            <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Messages</h2>
                <button className="icon-btn" onClick={() => setShowNew(true)} style={{ width: 32, height: 32, borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} /></button>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadC ? (
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}><Skeleton w={42} h={42} r={21} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Skeleton w="50%" h={12} /><Skeleton w="70%" h={10} /></div></div>)}
                </div>
              ) : (
                <>
                  {pendingInSidebar && (
                    <div className={`conv-row${activeId === contactParam ? " active-c" : ""}`} onClick={() => selectContact(activeInfo)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${activeId === contactParam ? "#3b82f6" : "transparent"}` }}>
                      <Avatar user={activeInfo} size={42} online={onlineUsers[activeInfo?._id]} />
                      <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{activeInfo.name || activeInfo.email}</span><p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>New conversation</p></div>
                    </div>
                  )}
                  {filteredContacts.length === 0 && !pendingInSidebar ? (
                    <div style={{ padding: "36px 14px", textAlign: "center", color: "#94a3b8" }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>No conversations yet</p>
                      <button onClick={() => setShowNew(true)} style={{ marginTop: 10, padding: "9px 18px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New Conversation</button>
                    </div>
                  ) : filteredContacts.map(c => {
                    const isAct = activeId === c._id;
                    const isOnline = onlineUsers[c._id] || c.isOnline;
                    const hasUnread = unreadMsgs.has(c._id) || c.unread > 0;
                    return (
                      <div key={c._id} className={`conv-row${isAct ? " active-c" : ""}`} onClick={() => selectContact(c)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isAct ? "#3b82f6" : "transparent"}` }}>
                        <Avatar user={c} size={42} online={isOnline} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: hasUnread ? 800 : 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name || c.email || "Unknown"}</span>
                            <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, marginLeft: 4 }}>{c.lastMessageAt ? fmt(c.lastMessageAt) : ""}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ margin: 0, fontSize: 12, color: hasUnread ? "#0f172a" : "#94a3b8", fontWeight: hasUnread ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {isAct && isTyping ? <span style={{ color: "#10b981", fontStyle: "italic" }}>typing…</span> : (c.lastMessage || "Start chatting…")}
                            </p>
                            {(c.unread > 0) && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4, padding: "0 4px" }}>{c.unread}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {(isMobile ? !showSidebar : true) && (
          activeId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc", minWidth: 0 }}>
              {/* Header */}
              <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {isMobile && <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#64748b", padding: 4 }}><ChevronLeft size={22} /></button>}
                <Avatar user={activeInfo} size={isMobile ? 36 : 42} online={activeOnline} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeName}</p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                    {isTyping ? <span style={{ color: "#10b981" }}>typing…</span> : <span style={{ color: activeOnline ? "#10b981" : "#94a3b8" }}>{activeOnline ? "● Online" : "● Offline"}</span>}
                    {!isMobile && <span style={{ color: "#94a3b8" }}> · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role}</span></span>}
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setShowMsgSrch(p => !p)} style={{ width: 32, height: 32, borderRadius: 10, background: showMsgSrch ? "#eff6ff" : "#f8fafc", border: `1px solid ${showMsgSrch ? "#3b82f6" : "#e2e8f0"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Search size={14} style={{ color: showMsgSrch ? "#3b82f6" : "#94a3b8" }} />
                </button>
                <button className="icon-btn" onClick={() => router.push(`/dashboard/${role}/video-calls?contact=${activeId}`)} style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={14} style={{ color: "#10b981" }} />
                </button>
              </div>

              {/* Message search */}
              {showMsgSrch && (
                <div style={{ padding: "8px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search in this conversation…" autoFocus style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
                  </div>
                  {msgSearch && <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{displayMsgs.length} found</span>}
                  <button onClick={() => { setShowMsgSrch(false); setMsgSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={15} /></button>
                </div>
              )}

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 8px" : "16px 20px", display: "flex", flexDirection: "column", gap: 2 }} onClick={() => setMenuMsg(null)}>
                {loadM ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1,2,3,4].map((x, j) => <div key={x} style={{ display: "flex", justifyContent: j % 2 ? "flex-end" : "flex-start" }}><Skeleton w={`${32+j*12}%`} h={44} r={14} /></div>)}
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  msgSearch
                    ? <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8" }}><p>No results for "{msgSearch}"</p></div>
                    : <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8", padding: "40px 20px" }}><div style={{ fontSize: 48, marginBottom: 12, animation: "pop 0.4s ease" }}>👋</div><p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>Say hello to {activeName}!</p></div>
                ) : Object.entries(grouped).map(([day, dayMsgs]) => (
                  <div key={day}>
                    <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#e2e8f0" }} />
                      <span style={{ background: "#f8fafc", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "#94a3b8", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                    </div>
                    {dayMsgs.map((msg, i) => {
                      const mine = String(msg.senderId?._id || msg.senderId) === myId;
                      const fileUrl = fixUrl(msg.fileUrl);
                      const isImg = msg.type === "image";
                      const reactions = msg.reactions || {};
                      const hasR = Object.keys(reactions).length > 0;

                      return (
                        <div key={msg._id || i} className="msg-wrap" style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: hasR ? 22 : 5, alignItems: "flex-end", gap: 5, position: "relative" }}>
                          {!mine && <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: hasR ? 18 : 0 }}>{activeName.charAt(0).toUpperCase()}</div>}

                          <div style={{ maxWidth: isMobile ? "82%" : "68%", position: "relative" }}>
                            {msg.replyTo && (
                              <div style={{ padding: "5px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(59,130,246,0.12)" : "#f1f5f9", borderLeft: `3px solid ${mine ? "#3b82f6" : "#94a3b8"}`, marginBottom: -2 }}>
                                <p style={{ margin: 0, fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↩ {msg.replyTo.content || "Attachment"}</p>
                              </div>
                            )}
                            <div className="msg-b" style={{ padding: isImg ? 4 : "10px 14px", borderRadius: msg.replyTo ? (mine ? "0 14px 4px 14px" : "14px 0 14px 4px") : (mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px"), background: mine ? "#3b82f6" : "#fff", color: mine ? "#fff" : "#0f172a", border: mine ? "none" : "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: msg.pending ? 0.6 : 1 }}>
                              {msg.content && (
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>
                                  {msgSearch ? msg.content.split(new RegExp(`(${msgSearch})`, "gi")).map((part, idx) =>
                                    part.toLowerCase() === msgSearch.toLowerCase() ? <mark key={idx} style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{part}</mark> : part
                                  ) : msg.content}
                                  {msg.edited && <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 6 }}>(edited)</span>}
                                </p>
                              )}
                              {fileUrl && (isImg
                                ? <a href={fileUrl} target="_blank" rel="noreferrer"><img src={fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: isMobile ? 180 : 220, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover", marginTop: msg.content ? 6 : 0 }} /></a>
                                : <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "#f8fafc", textDecoration: "none", color: mine ? "#fff" : "#0f172a", marginTop: msg.content ? 6 : 0 }}><Paperclip size={13} /><div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{msg.fileName || "File"}</p><p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Download</p></div></a>
                              )}
                            </div>

                            {/* Reactions */}
                            {hasR && (
                              <div style={{ position: "absolute", bottom: -20, [mine ? "right" : "left"]: 0, display: "flex", gap: 3, flexWrap: "wrap" }}>
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                                    style={{ padding: "2px 6px", borderRadius: 10, background: users.includes(myId) ? "#dbeafe" : "#f1f5f9", border: `1px solid ${users.includes(myId) ? "#93c5fd" : "#e2e8f0"}`, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3, transition: "transform 0.1s" }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                    {emoji}{users.length > 1 && <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{users.length}</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            <p style={{ margin: `${hasR ? 22 : 2}px 4px 0`, fontSize: 10, color: "#94a3b8", textAlign: mine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start", gap: 3 }}>
                              {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                              {mine && !msg.pending && (msg.read ? <CheckCheck size={11} style={{ color: "#3b82f6" }} /> : <Check size={11} />)}
                            </p>
                          </div>

                          {/* Hover actions */}
                          {!msg.pending && (
                            <div className="msg-actions" style={{ opacity: 0, display: "flex", gap: 3, alignItems: "center", marginBottom: hasR ? 18 : 0, flexDirection: mine ? "row" : "row-reverse" }}>
                              <button onClick={(e) => { e.stopPropagation(); setMenuMsg({ msg, x: e.clientX, y: e.clientY }); }}
                                style={{ width: 26, height: 26, borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                                <MoreVertical size={12} style={{ color: "#64748b" }} />
                              </button>
                            </div>
                          )}

                          {menuMsg?.msg._id === msg._id && (
                            <div style={{ position: "fixed", left: Math.min(menuMsg.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 200), top: Math.min(menuMsg.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 260), zIndex: 999 }}>
                              <MsgMenu msg={msg} isMine={mine}
                                onDelete={() => deleteMsg(msg._id)}
                                onEdit={() => { setEditing(msg); setText(msg.content); inputRef.current?.focus(); }}
                                onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                onReact={(emoji) => addReaction(msg._id, emoji)}
                                onMarkUnread={() => setUnread(p => new Set([...p, msg._id]))}
                                onClose={() => setMenuMsg(null)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeName.charAt(0).toUpperCase()}</div>
                    <div style={{ padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 2 }}>
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Emoji */}
              {showEmoji && (
                <div style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {EMOJIS.map(e => <button key={e} onClick={() => { setText(p => p + e); setEmoji(false); inputRef.current?.focus(); }} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>{e}</button>)}
                </div>
              )}

              {/* Reply/Edit bar */}
              {(replyTo || editingMsg) && (
                <div style={{ padding: "8px 14px", background: "#eff6ff", borderTop: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: editingMsg ? "#f59e0b" : "#3b82f6" }}>{editingMsg ? "✏️ Editing message" : "↩ Replying to"}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(editingMsg || replyTo)?.content || "Attachment"}</p>
                  </div>
                  <button onClick={cancelAction} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={16} /></button>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" />
                <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ width: 34, height: 34, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {uploading ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Paperclip size={14} style={{ color: "#94a3b8" }} />}
                </button>
                <button className="icon-btn" onClick={() => setEmoji(p => !p)} style={{ width: 34, height: 34, borderRadius: 10, background: showEmoji ? "#eff6ff" : "#f8fafc", border: `1px solid ${showEmoji ? "#3b82f6" : "#e2e8f0"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Smile size={15} style={{ color: showEmoji ? "#3b82f6" : "#94a3b8" }} />
                </button>
                <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMsg ? submitEdit() : sendMsg(); } if (e.key === "Escape") cancelAction(); }}
                  placeholder={editingMsg ? "Edit message…" : replyTo ? "Write a reply…" : `Message ${activeName}…`}
                  rows={1} className="msg-inp"
                  style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: `1px solid ${editingMsg ? "#f59e0b" : "#e2e8f0"}`, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: editingMsg ? "#fffbeb" : "#f8fafc", transition: "border-color 0.15s", fontFamily: "inherit" }} />
                <button onClick={() => editingMsg ? submitEdit() : sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                  style={{ height: 36, padding: "0 14px", borderRadius: 12, background: text.trim() ? (editingMsg ? "#f59e0b" : "#3b82f6") : "#f1f5f9", color: text.trim() ? "#fff" : "#94a3b8", border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : editingMsg ? <Check size={16} /> : <><Send size={14} />{!isMobile && <span style={{ fontSize: 13 }}>Send</span>}</>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, animation: "pop 0.4s ease" }}>💬</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#0f172a", fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>Your messages</p>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Select a conversation or start a new one</p>
              </div>
              <button onClick={() => setShowNew(true)} style={{ padding: "11px 24px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={16} />New Conversation
              </button>
            </div>
          )
        )}
      </div>

      {/* New Convo Panel */}
      {showNewConv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, backdropFilter: "blur(3px)" }} onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ width: isMobile ? "85%" : 300, height: "100vh", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.12)", animation: "slideIn 0.25s ease" }}>
            <div style={{ padding: "16px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>New Conversation</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}><X size={18} /></button>
            </div>
            <NewUserList myId={myId} onSelect={(u) => { selectContact(u); setShowNew(false); }} />
          </div>
        </div>
      )}
    </>
  );
}

function NewUserList({ myId, onSelect }) {
  const [users,   setUsers]  = useState([]);
  const [search,  setSearch] = useState("");
  const [loading, setL]      = useState(true);

  useEffect(() => {
    (async () => {
      setL(true);
      try {
        const r = await fetch(`${API}/api/admin/users?limit=200`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setUsers(d.users || []); }
        else {
          const r2 = await fetch(`${API}/api/lawyers?limit=50`, { credentials: "include", headers: HJ() });
          if (r2.ok) { const d = await r2.json(); setUsers(d.lawyers || []); }
        }
      } catch {} finally { setL(false); }
    })();
  }, []);

  const filtered = users.filter(u => u._id !== myId && (!search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}><Skeleton w={36} h={36} r={18} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Skeleton w="55%" h={11} /><Skeleton w="75%" h={9} /></div></div>)}</div>
          : filtered.length === 0 ? <div style={{ padding: "32px 14px", textAlign: "center", color: "#94a3b8" }}><p style={{ margin: 0, fontSize: 13 }}>No users found</p></div>
          : filtered.map(u => {
            const rc = ROLE_C[u.role] || "#6366f1";
            return (
              <div key={u._id} onClick={() => onSelect(u)} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar user={u} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{u.email}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize", flexShrink: 0 }}>{u.role}</span>
              </div>
            );
          })}
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100vh - 112px)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <MessagesContent />
    </Suspense>
  );
}