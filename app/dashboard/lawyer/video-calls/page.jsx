"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { ChevronLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ = () => ({ "Content-Type": "application/json", ...H() });
const genRoom = () => `lhz-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

function VideoCallsContent() {
  const { user } = useAppSelector(s => s.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactParam = searchParams.get("contact");
  const roomParam    = searchParams.get("room");
  const role = user?.role || "client";

  const [activeRoom,   setRoom]        = useState(roomParam || "");
  const [roomInput,    setRoomIn]      = useState("");
  const [allUsers,     setAllUsers]    = useState([]);
  const [contactInfo,  setCI]          = useState(null);
  const [invited,      setInvited]     = useState({});
  const [ready,        setReady]       = useState(false);
  const [recent,       setRecent]      = useState([]);
  const [search,       setSearch]      = useState("");
  const [userTab,      setUserTab]     = useState("all");
  const [autoInvited,  setAutoInvited] = useState(false);
  const [calling,      setCalling]     = useState(false);
  const [isMobile,     setIsMobile]    = useState(false);
  const [showInvite,   setShowInvite]  = useState(false); // mobile: show invite panel

  const myName = user?.name || user?.email || "User";
  const myId   = user?._id  || user?.id;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
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
      await fetch(`${API}/api/notifications`, {
        method: "POST", credentials: "include", headers: HJ(),
        body: JSON.stringify({ userId: id, title: "📹 Video Call Invitation", body: `${myName} is inviting you to a video call.`, type: "call", link: `/dashboard/${u.role || "client"}/video-calls?room=${roomName}` }),
      });
      await fetch(`${API}/api/messages`, {
        method: "POST", credentials: "include", headers: HJ(),
        body: JSON.stringify({ receiverId: id, content: `📹 I'm starting a video call — join me here: ${joinLink}` }),
      });
    } catch {}
  }, [activeRoom, myName]);

  const leaveCall = () => { setRoom(""); setAutoInvited(false); setShowInvite(false); };

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 800); return; }
    fetch(`${API}/api/admin/users?limit=500`, { credentials: "include", headers: HJ() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAllUsers((Array.isArray(d) ? d : d.users || []).filter(u => (u._id || u.id) !== myId)); })
      .catch(() => {});
    if (contactParam) {
      fetch(`${API}/api/admin/users/${contactParam}`, { credentials: "include", headers: HJ() })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setCI(d.user || d); })
        .catch(() => {});
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
    if (!activeRoom || !contactInfo || autoInvited) return;
    setAutoInvited(true);
    inviteUser(contactInfo, activeRoom);
  }, [activeRoom, contactInfo]);

  const jitsiUrl = activeRoom
    ? `https://meet.jit.si/${activeRoom}#` + [
        "config.startWithAudioMuted=false",
        "config.startWithVideoMuted=false",
        "config.prejoinPageEnabled=false",
        "config.disableDeepLinking=true",
        `userInfo.displayName=${encodeURIComponent(myName)}`,
      ].join("&")
    : "";

  const callLink = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/${role}/video-calls?room=${activeRoom}`;
  const ROLE_COLOR = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
  const filtered   = allUsers.filter(u => !search || (u.name||"").toLowerCase().includes(search.toLowerCase()) || (u.role||"").toLowerCase().includes(search.toLowerCase()));
  const tabUsers   = userTab === "all" ? filtered : filtered.filter(u => u.role === userTab);

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}}
        @keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .vc-btn{transition:all 0.2s;cursor:pointer;border:none;}
        .tab-pill{transition:all 0.15s;border:none;cursor:pointer;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;}
        .tab-pill.on{background:#0f172a;color:#fff}.tab-pill:not(.on){background:#f1f5f9;color:#64748b}
        .user-row:hover{background:#f8fafc!important}.user-row{transition:background 0.1s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 0 80px" : "0", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* Calling animation */}
        {calling && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 20 }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#10b981", animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.4 }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📹</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Connecting…</p>
              {contactInfo && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Starting call with <strong>{contactInfo.name || contactInfo.email}</strong></p>}
            </div>
          </div>
        )}

        {/* Pre-call UI */}
        {!activeRoom && !calling && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "#0f172a" }}>📹 Video Calls</h1>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Secure video consultations powered by Jitsi Meet</p>
            </div>

            {/* Cards — stack on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {/* Start Call */}
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", padding: isMobile ? 20 : 28, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>📹</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Start Instant Call</h3>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Create a new room — no download needed.</p>
                {contactInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLOR[contactInfo.role] || "#6366f1", color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{(contactInfo.name || "U").charAt(0).toUpperCase()}</div>
                    <div><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#14532d" }}>Calling: {contactInfo.name || contactInfo.email}</p></div>
                  </div>
                )}
                <button onClick={() => startCall()} className="vc-btn" style={{ width: "100%", padding: 12, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff", animation: "pulse 2s infinite", display: "inline-block" }} /> Start Call Now
                </button>
              </div>

              {/* Join Call */}
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", padding: isMobile ? 20 : 28, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>🔗</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Join a Call</h3>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Enter a room name to join an existing session.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input value={roomInput} onChange={e => setRoomIn(e.target.value)} onKeyDown={e => e.key === "Enter" && roomInput.trim() && startCall()} placeholder="Enter room name…"
                    style={{ flex: 1, padding: "10px 13px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "#f8fafc" }} />
                  <button onClick={() => startCall()} disabled={!roomInput.trim()} className="vc-btn"
                    style={{ padding: "10px 16px", borderRadius: 12, background: roomInput.trim() ? "#3b82f6" : "#e2e8f0", color: roomInput.trim() ? "#fff" : "#94a3b8", fontWeight: 700 }}>Join</button>
                </div>
                {recent.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>🕐 Recent</p>
                    {recent.map(rc => (
                      <button key={rc.room} onClick={() => startCall(rc.room)} className="vc-btn"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 8px", borderRadius: 8, background: "transparent", fontSize: 12, color: "#3b82f6", fontWeight: 600, textAlign: "left", marginBottom: 2 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{rc.room}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, flexShrink: 0, marginLeft: 8 }}>{new Date(rc.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Users list */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: isMobile ? "14px 16px" : "18px 22px", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>👥 Users</h3>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{allUsers.length} total</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 200 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                      style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {[["all","All"],["lawyer","Lawyers"],["client","Clients"],["admin","Admins"]].map(([v,l]) => (
                      <button key={v} className={`tab-pill${userTab===v?" on":""}`} onClick={() => setUserTab(v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ maxHeight: isMobile ? 250 : 300, overflowY: "auto" }}>
                {tabUsers.length === 0 ? (
                  <div style={{ padding: "28px 22px", textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ margin: 0, fontSize: 13 }}>No users found</p>
                  </div>
                ) : tabUsers.map(u => {
                  const dot = ROLE_COLOR[u.role] || "#6366f1";
                  return (
                    <div key={u._id} className="user-row" style={{ padding: isMobile ? "10px 16px" : "12px 22px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: dot, color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        {u.profileImage ? <img src={u.profileImage} style={{ width: 36, height: 36, objectFit: "cover" }} alt="" /> : (u.name||"U").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name||"Unnamed"}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{isMobile ? u.role : `${u.email} · ${u.role}`}</p>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => { const room = startCall(); setTimeout(() => inviteUser(u, room), 300); }} className="vc-btn"
                          style={{ padding: isMobile ? "6px 10px" : "7px 14px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          📹 {isMobile ? "" : "Call & "}Invite
                        </button>
                        <button onClick={() => router.push(`/dashboard/${role}/messages?contact=${u._id}`)} className="vc-btn"
                          style={{ padding: "7px 10px", borderRadius: 10, background: "#eff6ff", color: "#3b82f6", fontWeight: 700, fontSize: 12 }}>💬</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {activeRoom && !calling && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Call Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite", display: "inline-block" }} />
                  <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#0f172a" }}>
                    Live Call {contactInfo ? `with ${contactInfo.name || contactInfo.email}` : ""}
                  </h2>
                </div>
                {!isMobile && <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>Room: {activeRoom}</p>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {isMobile && (
                  <button onClick={() => setShowInvite(p => !p)} className="vc-btn"
                    style={{ padding: "7px 12px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6", fontSize: 12, fontWeight: 700 }}>
                    👥 Invite
                  </button>
                )}
                <button onClick={() => navigator.clipboard?.writeText(callLink)} className="vc-btn"
                  style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600 }}>
                  📋 {isMobile ? "" : "Copy Link"}
                </button>
                <button onClick={leaveCall} className="vc-btn"
                  style={{ padding: "7px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                  📵 Leave
                </button>
              </div>
            </div>

            {autoInvited && contactInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 12 }}>
                <span>✅</span>
                <p style={{ margin: 0, fontSize: 13, color: "#14532d", fontWeight: 600 }}>Invite sent to <strong>{contactInfo.name || contactInfo.email}</strong></p>
              </div>
            )}

            {/* Desktop: side-by-side. Mobile: stacked */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
              gap: 12,
              height: isMobile ? "auto" : "calc(100vh - 230px)",
            }}>
              {/* Jitsi iframe */}
              <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", height: isMobile ? "55vw" : "100%", minHeight: isMobile ? 220 : "auto" }}>
                <iframe src={jitsiUrl} style={{ width: "100%", height: "100%", border: "none" }}
                  allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read; clipboard-write"
                  allowFullScreen title="Video Call" />
              </div>

              {/* Invite Panel — always visible on desktop, toggle on mobile */}
              {(!isMobile || showInvite) && (
                <div style={{
                  display: "flex", flexDirection: "column", gap: 10, overflowY: isMobile ? "visible" : "auto",
                  ...(isMobile ? { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", borderRadius: "20px 20px 0 0", padding: 16, zIndex: 100, maxHeight: "50vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,0.1)" } : {}),
                }}>
                  {isMobile && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Invite to Call</p>
                      <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>✕</button>
                    </div>
                  )}

                  {/* Call Info */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: 14 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Call Info</p>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>You: <strong style={{ color: "#0f172a" }}>{myName}</strong></p>
                    </div>
                    <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#10b981", wordBreak: "break-all" }}>{activeRoom}</p>
                    </div>
                    <button onClick={() => navigator.clipboard?.writeText(callLink)} className="vc-btn"
                      style={{ width: "100%", padding: 9, borderRadius: 10, background: "#eff6ff", color: "#3b82f6", fontWeight: 700, fontSize: 13 }}>
                      📋 Copy Call Link
                    </button>
                  </div>

                  {/* Users to invite */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: 14, flex: 1 }}>
                    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Invite Users</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                      {[...(contactInfo ? [contactInfo] : []), ...allUsers.filter(u => u._id !== contactInfo?._id).slice(0, 15)].map(u => (
                        <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: invited[u._id] ? "#f0fdf4" : "#f8fafc", border: invited[u._id] ? "1px solid #86efac" : "1px solid transparent" }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: ROLE_COLOR[u.role] || "#6366f1", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {(u.name||"U").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{u.role}</p>
                          </div>
                          <button onClick={() => inviteUser(u)} disabled={!!invited[u._id]} className="vc-btn"
                            style={{ padding: "4px 9px", borderRadius: 7, background: invited[u._id] ? "#f0fdf4" : "#10b981", color: invited[u._id] ? "#10b981" : "#fff", border: invited[u._id] ? "1px solid #86efac" : "none", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {invited[u._id] ? "✓" : "Invite"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function VideoCallsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>Loading…</div>}>
      <VideoCallsContent />
    </Suspense>
  );
}