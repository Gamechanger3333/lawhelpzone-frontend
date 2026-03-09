"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { Phone, Video, User, X, Send, Paperclip, Smile, Search, Plus, ChevronLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

// Fix image URLs — replace localhost:5000 with Railway backend
const fixUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://localhost:5000") || url.startsWith("http://localhost:3000")) {
    return url.replace(/http:\/\/localhost:\d+/, API);
  }
  return url;
};

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
  return <div style={{ width: w, height: h, borderRadius: r, background: "#e2e8f0", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

function Avatar({ user: u, size = 40 }) {
  const bg = ROLE_C[u?.role] || "#6366f1";
  const imgSrc = fixUrl(u?.profileImage);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
      {imgSrc
        ? <img src={imgSrc} style={{ width: size, height: size, objectFit: "cover" }} alt="" onError={e => { e.target.style.display = "none"; }} />
        : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
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
  const [showSidebar, setShowSidebar]= useState(true); // mobile: show sidebar or chat
  const [isMobile,    setIsMobile]   = useState(false);

  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchUserInfo = useCallback(async (id) => {
    try {
      const r = await fetch(`${API}/api/users/${id}`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; }
    } catch {}
    try {
      const r = await fetch(`${API}/api/admin/users/${id}`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; }
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
    if (isMobile) setShowSidebar(false); // on mobile, switch to chat view
  };

  const goBack = () => {
    if (isMobile) setShowSidebar(true);
  };

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 500); return; }
    loadContacts();
    const poll = setInterval(() => loadContacts(true), 8000);
    return () => clearInterval(poll);
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

  // On mobile, show either sidebar OR chat
  const showSidebarPanel = isMobile ? showSidebar : true;
  const showChatPanel    = isMobile ? !showSidebar : true;

  return (
    <>
      <style>{`
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
        .msg-b{animation:fd 0.18s ease;}
        .conv-row{transition:background 0.12s;cursor:pointer;}
        .conv-row:hover{background:#f1f5f9;}
        .conv-row.active-c{background:#eff6ff;border-left:3px solid #3b82f6!important;}
        .msg-inp:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}
        .send-btn:not(:disabled):hover{opacity:.85;}
        .send-btn:disabled{opacity:.45;cursor:not-allowed;}
        .icon-btn:hover{opacity:.75;transform:scale(1.08);}
        .icon-btn{transition:all .15s;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        @keyframes newConvSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}
      `}</style>

      <div style={{
        height: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 112px)",
        display: "flex",
        borderRadius: isMobile ? 0 : 20,
        overflow: "hidden",
        border: isMobile ? "none" : "1px solid #e2e8f0",
        boxShadow: isMobile ? "none" : "0 4px 24px rgba(0,0,0,0.07)",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.4s",
        position: "relative",
      }}>

        {/* SIDEBAR */}
        {showSidebarPanel && (
          <div style={{
            width: isMobile ? "100%" : 300,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRight: isMobile ? "none" : "1px solid #e2e8f0",
            flexShrink: 0,
          }}>
            <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Messages</h2>
                <button className="icon-btn" onClick={() => setShowNew(true)}
                  style={{ width: 32, height: 32, borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
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
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{activeInfo.name || activeInfo.email}</span>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>New conversation</p>
                      </div>
                    </div>
                  )}
                  {filteredContacts.length === 0 && !pendingInSidebar ? (
                    <div style={{ padding: "36px 14px", textAlign: "center", color: "#94a3b8" }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>No conversations yet</p>
                      <p style={{ margin: "6px 0 14px", fontSize: 12 }}>Click + to start a new conversation</p>
                      <button onClick={() => setShowNew(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New Conversation</button>
                    </div>
                  ) : filteredContacts.map(contact => {
                    const isAct = activeId === contact._id;
                    return (
                      <div key={contact._id} className={`conv-row${isAct ? " active-c" : ""}`}
                        onClick={() => selectContact(contact)}
                        style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isAct ? "#3b82f6" : "transparent"}` }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Avatar user={contact} size={42} />
                          <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: contact.isOnline ? "#10b981" : "#94a3b8", border: "2px solid #fff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: contact.unread > 0 ? 800 : 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{contact.name || contact.email || "Unknown"}</span>
                            <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, marginLeft: 4 }}>{contact.lastMessageAt ? fmt(contact.lastMessageAt) : ""}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ margin: 0, fontSize: 12, color: contact.unread > 0 ? "#0f172a" : "#94a3b8", fontWeight: contact.unread > 0 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{contact.lastMessage || "Start chatting…"}</p>
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
        )}

        {/* CHAT AREA */}
        {showChatPanel && (
          showChat ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc", minWidth: 0 }}>
              {/* Header */}
              <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 0 }}>
                {isMobile && (
                  <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: "#64748b" }}>
                    <ChevronLeft size={22} />
                  </button>
                )}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar user={activeInfo} size={isMobile ? 36 : 42} />
                  <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: activeInfo?.isOnline ? "#10b981" : "#94a3b8", border: "2px solid #fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                    {activeInfo?.isOnline ? "● Online" : "● Last seen recently"}
                    {!isMobile && <span style={{ color: "#94a3b8" }}> · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role || "user"}</span></span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 6 : 8 }}>
                  <button className="icon-btn" onClick={() => router.push(`/dashboard/${role}/video-calls?contact=${activeId}`)}
                    style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={isMobile ? 14 : 16} style={{ color: "#10b981" }} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 10px" : "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
                {loadM ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1,2,3,4].map((x, j) => (
                      <div key={x} style={{ display: "flex", justifyContent: j % 2 ? "flex-end" : "flex-start" }}>
                        <Skeleton w={`${32 + j * 12}%`} h={44} r={14} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#94a3b8", padding: "40px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, animation: "pop 0.4s ease" }}>👋</div>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>Start the conversation</p>
                    <p style={{ fontSize: 14, margin: 0 }}>Say hello to {activeName}!</p>
                  </div>
                ) : Object.entries(grouped).map(([day, dayMsgs]) => (
                  <div key={day}>
                    <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#e2e8f0" }} />
                      <span style={{ background: "#f8fafc", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "#94a3b8", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                    </div>
                    {dayMsgs.map((msg, i) => {
                      const mine  = String(msg.senderId?._id || msg.senderId) === myId;
                      const isImg = msg.type === "image";
                      const fileUrl = fixUrl(msg.fileUrl);
                      return (
                        <div key={msg._id || i} className="msg-b"
                          style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4, alignItems: "flex-end", gap: 6 }}>
                          {!mine && (
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {activeName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ maxWidth: isMobile ? "80%" : "68%" }}>
                            <div style={{ padding: isImg ? 4 : "10px 14px", borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: mine ? "#3b82f6" : "#fff", color: mine ? "#fff" : "#0f172a", border: mine ? "none" : "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: msg.pending ? 0.6 : 1 }}>
                              {msg.content && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>{msg.content}</p>}
                              {fileUrl && (isImg ? (
                                <a href={fileUrl} target="_blank" rel="noreferrer">
                                  <img src={fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: isMobile ? 180 : 220, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover", marginTop: msg.content ? 6 : 0 }} />
                                </a>
                              ) : (
                                <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "#f8fafc", textDecoration: "none", color: mine ? "#fff" : "#0f172a", marginTop: msg.content ? 6 : 0 }}>
                                  <Paperclip size={14} />
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{msg.fileName || "File"}</p>
                                    <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Download</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                            <p style={{ margin: "2px 4px 0", fontSize: 10, color: "#94a3b8", textAlign: mine ? "right" : "left" }}>
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

              {/* Emoji Picker */}
              {showEmoji && (
                <div style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { setText(p => p + e); setEmoji(false); inputRef.current?.focus(); }}
                      style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>{e}</button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" />
                <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()}
                  style={{ width: 34, height: 34, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {uploading ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Paperclip size={14} style={{ color: "#94a3b8" }} />}
                </button>
                <button className="icon-btn" onClick={() => setEmoji(p => !p)}
                  style={{ width: 34, height: 34, borderRadius: 10, background: showEmoji ? "#eff6ff" : "#f8fafc", border: `1px solid ${showEmoji ? "#3b82f6" : "#e2e8f0"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Smile size={15} style={{ color: showEmoji ? "#3b82f6" : "#94a3b8" }} />
                </button>
                <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder={isMobile ? `Message ${activeName}…` : `Message ${activeName}… (Enter to send)`}
                  rows={1} className="msg-inp"
                  style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: "#f8fafc", transition: "border-color 0.15s", fontFamily: "inherit" }} />
                <button onClick={() => sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                  style={{ height: 36, padding: "0 14px", borderRadius: 12, background: text.trim() ? "#3b82f6" : "#f1f5f9", color: text.trim() ? "#fff" : "#94a3b8", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <><Send size={14} />{!isMobile && <span style={{ fontSize: 13 }}>Send</span>}</>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, animation: "pop 0.4s ease" }}>💬</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#0f172a", fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>Your messages</p>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{contacts.length > 0 ? "Select a conversation" : "Start your first conversation"}</p>
              </div>
              <button onClick={() => setShowNew(true)} style={{ marginTop: 4, padding: "11px 24px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={16} />New Conversation
              </button>
            </div>
          )
        )}
      </div>

      {/* New Conversation Panel */}
      {showNewConv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", backdropFilter: "blur(3px)" }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ width: isMobile ? "85%" : 300, height: "100vh", background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.12)", animation: "newConvSlide 0.25s ease" }}>
            <div style={{ padding: "16px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>New Conversation</h3>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}><X size={18} /></button>
            </div>
            <NewUserList myId={myId} onSelect={(u) => { selectContact(u); setActiveId(u._id); setActiveInfo(u); setShowNew(false); }} />
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
    const load = async () => {
      setL(true);
      try {
        const r = await fetch(`${API}/api/admin/users?limit=200`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setUsers(d.users || []); return; }
        const r2 = await fetch(`${API}/api/lawyers?limit=50`, { credentials: "include", headers: HJ() });
        if (r2.ok) { const d = await r2.json(); setUsers(d.lawyers || []); }
      } catch {} finally { setL(false); }
    };
    load();
  }, []);

  const filtered = users.filter(u => {
    if (u._id === myId) return false;
    const q = search.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  return (
    <>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
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
          <div style={{ padding: "32px 14px", textAlign: "center", color: "#94a3b8" }}>
            <p style={{ margin: 0, fontSize: 13 }}>No users found</p>
          </div>
        ) : filtered.map(u => {
          const rc = ROLE_C[u.role] || "#6366f1";
          return (
            <div key={u._id} onClick={() => onSelect(u)}
              style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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