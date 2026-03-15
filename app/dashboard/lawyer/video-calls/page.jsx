"use client";
// v2026-03-14-FIXED — fully responsive, mobile-first video calls page
// Fixes: proper mobile layout, iframe scales correctly, invite panel as bottom sheet

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H  = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ = () => ({ "Content-Type": "application/json", ...H() });
const genRoom = () => `lhz-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
const ROLE_COLOR = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };

// ── InvitePanel ───────────────────────────────────────────────────────────────
function InvitePanel({ myName, activeRoom, allUsers, contactInfo, invited, inviteUser, isMobile }) {
  const callLink = typeof window !== "undefined" ? `${window.location.origin}/dashboard/client/video-calls?room=${activeRoom}` : "";
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(callLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const users = [...(contactInfo ? [contactInfo] : []), ...allUsers.filter(u => u._id !== contactInfo?._id).slice(0, 20)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Room card */}
      <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, border: "1px solid var(--border-color,#e2e8f0)", padding: 14 }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase" }}>Room</p>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontFamily: "monospace", color: "#10b981", background: "#f0fdf4", padding: "6px 10px", borderRadius: 8, wordBreak: "break-all" }}>{activeRoom}</p>
        <button onClick={copy} style={{ width: "100%", padding: 9, borderRadius: 10, background: copied ? "#f0fdf4" : "#eff6ff", color: copied ? "#10b981" : "#3b82f6", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>
          {copied ? "✓ Copied!" : "📋 Copy Call Link"}
        </button>
      </div>

      {/* Users list */}
      <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, border: "1px solid var(--border-color,#e2e8f0)", padding: 14 }}>
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase" }}>Invite to Call</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isMobile ? 280 : 360, overflowY: "auto" }}>
          {users.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#94a3b8)", textAlign: "center", padding: "16px 0" }}>No users available</p>
          )}
          {users.map(u => (
            <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: invited[u._id] ? "#f0fdf4" : "var(--input-bg,#f8fafc)", border: `1px solid ${invited[u._id] ? "#86efac" : "transparent"}`, transition: "all 0.15s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: ROLE_COLOR[u.role] || "#6366f1", color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {u.profileImage
                  ? <img src={u.profileImage} style={{ width: 34, height: 34, objectFit: "cover" }} alt="" onError={e => e.target.style.display = "none"} />
                  : (u.name || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted,#94a3b8)", textTransform: "capitalize" }}>{u.role}</p>
              </div>
              <button onClick={() => inviteUser(u)} disabled={!!invited[u._id]}
                style={{ padding: "5px 12px", borderRadius: 8, background: invited[u._id] ? "#f0fdf4" : "#10b981", color: invited[u._id] ? "#10b981" : "#fff", border: invited[u._id] ? "1px solid #86efac" : "none", fontSize: 11, fontWeight: 700, cursor: invited[u._id] ? "default" : "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                {invited[u._id] ? "✓ Sent" : "Invite"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function VideoCallsContent() {
  const { user }     = useAppSelector(s => s.auth);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const contactParam = searchParams.get("contact");
  const roomParam    = searchParams.get("room");
  const role         = user?.role || "client";
  const myName       = user?.name || user?.email || "User";
  const myId         = String(user?._id || user?.id || "");

  const [activeRoom,  setRoom]    = useState(roomParam || "");
  const [roomInput,   setRoomIn]  = useState("");
  const [allUsers,    setUsers]   = useState([]);
  const [contactInfo, setCI]      = useState(null);
  const [invited,     setInvited] = useState({});
  const [ready,       setReady]   = useState(false);
  const [recent,      setRecent]  = useState([]);
  const [search,      setSearch]  = useState("");
  const [userTab,     setTab]     = useState("all");
  const [autoInv,     setAutoInv] = useState(false);
  const [calling,     setCalling] = useState(false);
  const [showInv,     setShowInv] = useState(false);
  const [copied,      setCopied]  = useState(false);
  const [isMobile,    setMobile]  = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const saveRecent = (room) => {
    try {
      const entry = { room, date: new Date().toISOString() };
      const prev  = JSON.parse(localStorage.getItem("recentCalls") || "[]");
      const next  = [entry, ...prev.filter(x => x.room !== room)].slice(0, 10);
      localStorage.setItem("recentCalls", JSON.stringify(next));
      setRecent(next.slice(0, 5));
    } catch {}
  };

  const startCall = useCallback((room) => {
    const r = (room || roomInput.trim() || genRoom()).replace(/[^a-zA-Z0-9-_]/g, "-");
    setRoom(r); saveRecent(r); return r;
  }, [roomInput]);

  const inviteUser = useCallback(async (u, room) => {
    const id = u._id || u.id;
    const roomName = room || activeRoom;
    if (!roomName || !id) return;
    setInvited(p => ({ ...p, [id]: true }));
    const joinLink = `${window.location.origin}/dashboard/${u.role || "client"}/video-calls?room=${roomName}`;
    try {
      await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ receiverId: id, content: `📹 Join my video call: ${joinLink}` }) });
      await fetch(`${API}/api/notifications`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ userId: id, title: "📹 Video Call Invitation", body: `${myName} invites you to a call`, type: "call", link: `/dashboard/${u.role || "client"}/video-calls?room=${roomName}` }) });
    } catch {}
  }, [activeRoom, myName]);

  const leaveCall = () => { setRoom(""); setAutoInv(false); setShowInv(false); };

  const copyLink = () => {
    const link = `${window.location.origin}/dashboard/${role}/video-calls?room=${activeRoom}`;
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 800); return; }
    fetch(`${API}/api/messages/users?limit=500`, { credentials: "include", headers: HJ() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsers((Array.isArray(d) ? d : d.users || []).filter(u => String(u._id || u.id) !== myId)); })
      .catch(() => {});
    if (contactParam) {
      (async () => {
        for (const url of [`${API}/api/users/${contactParam}`, `${API}/api/lawyers/${contactParam}`]) {
          try { const r = await fetch(url, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); if (d) { setCI(d.user || d.lawyer || d); break; } } } catch {}
        }
      })();
    }
    try { setRecent(JSON.parse(localStorage.getItem("recentCalls") || "[]").slice(0, 5)); } catch {}
    setTimeout(() => setReady(true), 80);
  }, [user]);

  useEffect(() => {
    if (!ready || activeRoom || !contactParam) return;
    setCalling(true);
    const room = (roomParam || genRoom()).replace(/[^a-zA-Z0-9-_]/g, "-");
    setRoom(room); saveRecent(room);
    setTimeout(() => setCalling(false), 600);
  }, [ready]);

  useEffect(() => {
    if (!activeRoom || !contactInfo || autoInv) return;
    setAutoInv(true); inviteUser(contactInfo, activeRoom);
  }, [activeRoom, contactInfo]);

  const jitsiUrl = activeRoom
    ? `https://meet.jit.si/${activeRoom}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent(myName)}`
    : "";

  const filtered = allUsers.filter(u =>
    !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role  || "").toLowerCase().includes(search.toLowerCase())
  );
  const tabUsers = userTab === "all" ? filtered : filtered.filter(u => u.role === userTab);

  // ── Calling animation ─────────────────────────────────────────────────────
  if (calling) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
        <style>{`@keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid #10b981", animation: "ping 1.4s ease-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📹</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Connecting…</p>
          {contactInfo && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-muted,#64748b)" }}>Calling <strong>{contactInfo.name || contactInfo.email}</strong></p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .vc-btn{transition:all 0.18s;cursor:pointer;border:none;outline:none;}
        .vc-btn:active{transform:scale(0.95);}
        .tab-pill{transition:all 0.15s;border:none;cursor:pointer;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0;}
        .tab-pill.on{background:#3b82f6;color:#fff;}
        .tab-pill:not(.on){background:var(--input-bg,#f1f5f9);color:var(--text-muted,#64748b);}
        .urow{transition:background 0.1s;}
        .urow:hover{background:var(--conv-hover,#f8fafc)!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        ::-webkit-scrollbar:horizontal{display:none}

        /* ── Responsive Jitsi iframe ── */
        .vc-iframe-wrap{
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border-color,#e2e8f0);
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          background: #000;
        }
        .vc-iframe-wrap iframe{
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
      `}</style>

      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ══════════════ PRE-CALL SCREEN ══════════════ */}
        {!activeRoom && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Page title */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>📹 Video Calls</h1>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted,#64748b)", fontSize: 13 }}>Secure video consultations · Jitsi Meet</p>
            </div>

            {/* Action cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {/* Start Instant Call */}
              <div style={{ background: "var(--card-bg,#fff)", borderRadius: 18, border: "1px solid var(--border-color,#e2e8f0)", padding: isMobile ? 18 : 22, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>📹</div>
                <h3 style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Start Instant Call</h3>
                <p style={{ margin: "0 0 14px", color: "var(--text-muted,#64748b)", fontSize: 13, lineHeight: 1.6 }}>Create a new room — no download needed.</p>
                {contactInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLOR[contactInfo.role] || "#6366f1", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{(contactInfo.name || "U").charAt(0).toUpperCase()}</div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#14532d" }}>Calling: {contactInfo.name || contactInfo.email}</p>
                  </div>
                )}
                <button onClick={() => startCall()} className="vc-btn" style={{ width: "100%", padding: "13px 20px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite", display: "inline-block" }} /> Start Call Now
                </button>
              </div>

              {/* Join a Call */}
              <div style={{ background: "var(--card-bg,#fff)", borderRadius: 18, border: "1px solid var(--border-color,#e2e8f0)", padding: isMobile ? 18 : 22, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>🔗</div>
                <h3 style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Join a Call</h3>
                <p style={{ margin: "0 0 14px", color: "var(--text-muted,#64748b)", fontSize: 13, lineHeight: 1.6 }}>Enter a room name to join an existing session.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: recent.length ? 12 : 0 }}>
                  <input value={roomInput} onChange={e => setRoomIn(e.target.value)} onKeyDown={e => e.key === "Enter" && roomInput.trim() && startCall()} placeholder="Room name…"
                    style={{ flex: 1, padding: "10px 13px", borderRadius: 11, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 14, outline: "none", background: "var(--input-bg,#f8fafc)", color: "var(--text-primary,#0f172a)" }} />
                  <button onClick={() => startCall()} disabled={!roomInput.trim()} className="vc-btn" style={{ padding: "10px 16px", borderRadius: 11, background: roomInput.trim() ? "#3b82f6" : "var(--input-bg,#e2e8f0)", color: roomInput.trim() ? "#fff" : "var(--text-muted,#94a3b8)", fontWeight: 700 }}>Join</button>
                </div>
                {recent.length > 0 && (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase" }}>🕐 Recent</p>
                    {recent.map(rc => (
                      <button key={rc.room} onClick={() => startCall(rc.room)} className="vc-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 4px", borderRadius: 8, background: "transparent", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{rc.room}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted,#94a3b8)", flexShrink: 0, marginLeft: 8 }}>{new Date(rc.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Users list */}
            <div style={{ background: "var(--card-bg,#fff)", borderRadius: 18, border: "1px solid var(--border-color,#e2e8f0)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-color,#e2e8f0)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>👥 Users</h3>
                  <span style={{ fontSize: 11, color: "var(--text-muted,#64748b)", fontWeight: 600, background: "var(--input-bg,#f1f5f9)", padding: "2px 8px", borderRadius: 20 }}>{allUsers.length} total</span>
                </div>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                    style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" }}>
                  {[["all","All"],["lawyer","Lawyers"],["client","Clients"],["admin","Admins"]].map(([v, l]) => (
                    <button key={v} className={`tab-pill${userTab === v ? " on" : ""}`} onClick={() => setTab(v)}>
                      {l} ({v === "all" ? allUsers.length : allUsers.filter(u => u.role === v).length})
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight: isMobile ? 300 : 360, overflowY: "auto" }}>
                {tabUsers.length === 0 ? (
                  <div style={{ padding: "28px 18px", textAlign: "center" }}>
                    <p style={{ fontSize: 32, margin: "0 0 6px" }}>🔍</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#94a3b8)", fontWeight: 600 }}>No users found</p>
                  </div>
                ) : tabUsers.map(u => {
                  const dot = ROLE_COLOR[u.role] || "#6366f1";
                  return (
                    <div key={u._id} className="urow" style={{ padding: isMobile ? "10px 14px" : "11px 18px", borderBottom: "1px solid var(--border-color,#f1f5f9)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: dot, color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: `2px solid ${dot}30` }}>
                        {u.profileImage ? <img src={u.profileImage} style={{ width: 38, height: 38, objectFit: "cover" }} alt="" onError={e => e.target.style.display = "none"} /> : (u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Unnamed"}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#94a3b8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isMobile ? u.role : `${u.email || ""} · ${u.role}`}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { const room = startCall(); setTimeout(() => inviteUser(u, room), 300); }} className="vc-btn"
                          style={{ padding: isMobile ? "7px 10px" : "7px 13px", borderRadius: 9, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          📹{!isMobile && " Call"}
                        </button>
                        <button onClick={() => router.push(`/dashboard/${role}/messages?contact=${u._id}`)} className="vc-btn"
                          style={{ padding: "7px 11px", borderRadius: 9, background: "#eff6ff", color: "#3b82f6", fontWeight: 700, fontSize: 13 }}>💬</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ACTIVE CALL SCREEN ══════════════ */}
        {activeRoom && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Header bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite", display: "inline-block", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    🔴 Live{contactInfo ? ` · ${contactInfo.name || contactInfo.email}` : ""}
                  </p>
                  {!isMobile && <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#64748b)", fontFamily: "monospace" }}>{activeRoom}</p>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {isMobile && (
                  <button onClick={() => setShowInv(p => !p)} className="vc-btn" style={{ padding: "7px 11px", borderRadius: 9, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6", fontSize: 12, fontWeight: 700 }}>
                    👥 Invite
                  </button>
                )}
                <button onClick={copyLink} className="vc-btn" style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid var(--border-color,#e2e8f0)", background: copied ? "#f0fdf4" : "var(--card-bg,#fff)", color: copied ? "#10b981" : "var(--text-muted,#64748b)", fontSize: 12, fontWeight: 600 }}>
                  {copied ? "✓ Copied!" : isMobile ? "📋" : "📋 Copy Link"}
                </button>
                <button onClick={leaveCall} className="vc-btn" style={{ padding: "7px 13px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                  📵{!isMobile && " Leave"}
                </button>
              </div>
            </div>

            {/* Invite sent banner */}
            {autoInv && contactInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 10 }}>
                <span>✅</span>
                <p style={{ margin: 0, fontSize: 13, color: "#14532d", fontWeight: 600 }}>Invite sent to <strong>{contactInfo.name || contactInfo.email}</strong></p>
              </div>
            )}

            {/* ── RESPONSIVE LAYOUT ── */}
            {isMobile ? (
              /* ─ Mobile: full-width iframe, invite as bottom sheet ─ */
              <div>
                {/* Jitsi iframe — full width, 16:9 ratio */}
                <div className="vc-iframe-wrap" style={{ width: "100%", height: 0, paddingBottom: "56.25%", position: "relative" }}>
                  <iframe
                    src={jitsiUrl}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                    allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read; clipboard-write"
                    allowFullScreen
                    title="Video Call"
                  />
                </div>

                {/* Mobile invite bottom sheet */}
                {showInv && (
                  <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} onClick={() => setShowInv(false)}>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--card-bg,#fff)", borderRadius: "20px 20px 0 0", maxHeight: "72vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 -8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
                      <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--border-color,#e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Invite to Call</p>
                        <button onClick={() => setShowInv(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted,#64748b)" }}>✕</button>
                      </div>
                      <div style={{ overflowY: "auto", flex: 1, padding: "12px 14px 32px" }}>
                        <InvitePanel myName={myName} activeRoom={activeRoom} allUsers={allUsers} contactInfo={contactInfo} invited={invited} inviteUser={inviteUser} isMobile={true} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─ Desktop: side-by-side iframe + invite panel ─ */
              <div style={{ display: "flex", gap: 14, height: "calc(100vh - 220px)", minHeight: 500 }}>
                {/* Jitsi iframe */}
                <div className="vc-iframe-wrap" style={{ flex: 1, height: "100%" }}>
                  <iframe
                    src={jitsiUrl}
                    allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read; clipboard-write"
                    allowFullScreen
                    title="Video Call"
                  />
                </div>
                {/* Invite panel */}
                <div style={{ width: 280, display: "flex", flexDirection: "column", overflowY: "auto" }}>
                  <InvitePanel myName={myName} activeRoom={activeRoom} allUsers={allUsers} contactInfo={contactInfo} invited={invited} inviteUser={inviteUser} isMobile={false} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function VideoCallsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#64748b", fontSize: 14 }}>Loading…</span>
      </div>
    }>
      <VideoCallsContent />
    </Suspense>
  );
}