"use client";
// ══════════════════════════════════════════════════════════════
// VIDEO CALLS PAGE — admin / lawyer / client
// Place at: app/dashboard/[role]/video-calls/page.jsx
// Features: Jitsi embed, invite ALL registered users, recent calls
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ = () => ({ "Content-Type": "application/json", ...H() });
const genRoom = () => `lhz-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export default function VideoCallsPage() {
  const { user } = useAppSelector(s => s.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactParam = searchParams.get("contact");
  const roomParam = searchParams.get("room");

  const [activeRoom, setRoom] = useState(roomParam || "");
  const [roomInput, setRoomIn] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [contactInfo, setCI] = useState(null);
  const [invited, setInvited] = useState({});
  const [ready, setReady] = useState(false);
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState("");
  const [userTab, setUserTab] = useState("all");
  const myName = user?.name || user?.email || "User";

  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 800); return; }
    // Load all users
    fetch(`${API}/api/admin/users?limit=500`, { credentials: "include", headers: HJ() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAllUsers((Array.isArray(d) ? d : d.users || []).filter(u => u._id !== (user._id || user.id))); })
      .catch(() => {});
    // Load contact
    if (contactParam) {
      fetch(`${API}/api/admin/users/${contactParam}`, { credentials: "include", headers: HJ() })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setCI(d.user || d); })
        .catch(() => {});
    }
    try { setRecent(JSON.parse(localStorage.getItem("recentCalls") || "[]").slice(0, 5)); } catch {}
    setTimeout(() => setReady(true), 80);
  }, [user]);

  const startCall = useCallback((room) => {
    const r = (room || roomInput.trim() || genRoom()).replace(/[^a-zA-Z0-9-_]/g, "-");
    setRoom(r);
    try {
      const entry = { room: r, date: new Date().toISOString() };
      const prev = JSON.parse(localStorage.getItem("recentCalls") || "[]");
      const next = [entry, ...prev.filter(x => x.room !== r)].slice(0, 10);
      localStorage.setItem("recentCalls", JSON.stringify(next));
      setRecent(next.slice(0, 5));
    } catch {}
  }, [roomInput]);

  const inviteUser = useCallback(async (u) => {
    const id = u._id || u.id;
    setInvited(p => ({ ...p, [id]: true }));
    try {
      await fetch(`${API}/api/notifications`, {
        method: "POST", credentials: "include", headers: HJ(),
        body: JSON.stringify({ userId: id, title: "📹 Video Call Invitation", body: `${myName} is inviting you to a video call. Click to join!`, type: "call", link: `/dashboard/${u.role || 'client'}/video-calls?room=${activeRoom}` }),
      });
      await fetch(`${API}/api/messages`, {
        method: "POST", credentials: "include", headers: HJ(),
        body: JSON.stringify({ receiverId: id, content: `📹 Join my video call: ${window.location.origin}/dashboard/${u.role || 'client'}/video-calls?room=${activeRoom}` }),
      });
    } catch {}
  }, [activeRoom, myName]);

  const leaveCall = () => setRoom("");
  const callLink = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/video-calls?room=${activeRoom}`;
  const jitsiUrl = `https://meet.jit.si/${activeRoom}#userInfo.displayName="${encodeURIComponent(myName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  const ROLE_COLOR = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
  const filteredUsers = allUsers.filter(u => !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.role || "").toLowerCase().includes(search.toLowerCase()));
  const lawyers = filteredUsers.filter(u => u.role === "lawyer");
  const clients = filteredUsers.filter(u => u.role === "client");
  const admins = filteredUsers.filter(u => u.role === "admin");

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .vc-hover{transition:all 0.2s;cursor:pointer}
        .vc-hover:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.1)!important}
        .tab-pill{transition:all 0.15s;border:none;cursor:pointer;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700}
        .tab-pill.on{background:#0f172a;color:#fff}
        .tab-pill:not(.on){background:#f1f5f9;color:#64748b}
        .user-row:hover{background:#f8fafc!important}
        .user-row{transition:background 0.1s}
        .inp:focus{border-color:#3b82f6!important;outline:none}
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* IDLE */}
        {!activeRoom && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>📹 Video Calls</h1>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Secure, encrypted video consultations powered by Jitsi Meet</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Start call */}
              <div className="vc-hover" style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>📹</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Start Instant Call</h3>
                <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>Create a new room and invite contacts. Works in your browser — no download needed.</p>
                {contactInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: ROLE_COLOR[contactInfo.role] || "#6366f1", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {(contactInfo.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#14532d" }}>Calling: {contactInfo.name || contactInfo.email}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#16a34a", textTransform: "capitalize" }}>{contactInfo.role}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => startCall()}
                  style={{ width: "100%", padding: 13, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 2s infinite", display: "inline-block" }} />
                  Start Call Now
                </button>
              </div>

              {/* Join existing */}
              <div className="vc-hover" style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>🔗</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Join a Call</h3>
                <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>Enter a room name or paste a link to join an existing call session.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input className="inp" value={roomInput} onChange={e => setRoomIn(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && roomInput.trim() && startCall()}
                    placeholder="Enter room name or paste link…"
                    style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14 }} />
                  <button onClick={() => startCall()} disabled={!roomInput.trim()}
                    style={{ padding: "11px 18px", borderRadius: 12, background: roomInput.trim() ? "#3b82f6" : "#e2e8f0", color: roomInput.trim() ? "#fff" : "#94a3b8", border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                    Join
                  </button>
                </div>
                {recent.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>🕐 Recent Calls</p>
                    {recent.map(rc => (
                      <button key={rc.room} onClick={() => startCall(rc.room)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#3b82f6", fontWeight: 600, textAlign: "left", marginBottom: 2 }}>
                        <span>{rc.room}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>{new Date(rc.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All Users to invite */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>👥 Registered Users — Start a Call</h3>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{allUsers.length} users</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                    <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                      style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["all", "All"], ["lawyer", "Lawyers"], ["client", "Clients"], ["admin", "Admins"]].map(([v, l]) => (
                      <button key={v} className={`tab-pill${userTab === v ? " on" : ""}`} onClick={() => setUserTab(v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {(userTab === "all" ? filteredUsers : userTab === "lawyer" ? lawyers : userTab === "client" ? clients : admins).map(u => {
                  const dot = ROLE_COLOR[u.role] || "#6366f1";
                  return (
                    <div key={u._id} className="user-row" style={{ padding: "12px 22px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: dot, color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        {u.profileImage ? <img src={u.profileImage} style={{ width: 38, height: 38, objectFit: "cover" }} alt="" /> : (u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name || "Unnamed"}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{u.email} · <span style={{ textTransform: "capitalize" }}>{u.role}</span></p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { startCall(); setTimeout(() => inviteUser(u), 500); }}
                          style={{ padding: "7px 14px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          📹 Call & Invite
                        </button>
                        <button onClick={() => router.push(`../messages?contact=${u._id}`)}
                          style={{ padding: "7px 12px", borderRadius: 10, background: "#eff6ff", color: "#3b82f6", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          💬
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(userTab === "all" ? filteredUsers : userTab === "lawyer" ? lawyers : userTab === "client" ? clients : admins).length === 0 && (
                  <div style={{ padding: "32px 22px", textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ margin: 0, fontSize: 13 }}>No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* IN CALL */}
        {activeRoom && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite", display: "inline-block" }} />
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Live Call</h2>
                </div>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>Room: {activeRoom}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { navigator.clipboard?.writeText(callLink); }}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  📋 Copy Link
                </button>
                <button onClick={leaveCall}
                  style={{ padding: "8px 18px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  📵 Leave Call
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, height: "calc(100vh - 200px)" }}>
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <iframe src={jitsiUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="camera; microphone; fullscreen; display-capture; autoplay" title="Video Call" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                {/* Call info */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Call Info</p>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>You: <strong style={{ color: "#0f172a" }}>{myName}</strong></p>
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#10b981", wordBreak: "break-all" }}>{callLink.length > 50 ? callLink.slice(0, 47) + "…" : callLink}</p>
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(callLink)}
                    style={{ width: "100%", padding: 9, borderRadius: 10, background: "#eff6ff", color: "#3b82f6", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    📋 Copy Call Link
                  </button>
                </div>

                {/* Invite users */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: 16, flex: 1 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Invite to Call</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                    {contactInfo && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "#f8fafc" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: ROLE_COLOR[contactInfo.role] || "#6366f1", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {(contactInfo.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{contactInfo.name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{contactInfo.role}</p>
                        </div>
                        <button onClick={() => inviteUser(contactInfo)} disabled={!!invited[contactInfo._id]}
                          style={{ padding: "5px 10px", borderRadius: 8, background: invited[contactInfo._id] ? "#f0fdf4" : "#10b981", color: invited[contactInfo._id] ? "#10b981" : "#fff", border: invited[contactInfo._id] ? "1px solid #86efac" : "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          {invited[contactInfo._id] ? "✓ Sent" : "Invite"}
                        </button>
                      </div>
                    )}
                    {allUsers.filter(u => u._id !== contactInfo?._id).slice(0, 20).map(u => (
                      <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "#f8fafc" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: ROLE_COLOR[u.role] || "#6366f1", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{u.role}</p>
                        </div>
                        <button onClick={() => inviteUser(u)} disabled={!!invited[u._id]}
                          style={{ padding: "4px 9px", borderRadius: 7, background: invited[u._id] ? "#f0fdf4" : "#10b981", color: invited[u._id] ? "#10b981" : "#fff", border: invited[u._id] ? "1px solid #86efac" : "none", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                          {invited[u._id] ? "✓" : "Invite"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: 14 }}>
                  <button onClick={() => router.push(`../messages?contact=${contactParam || ""}`)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    💬 Send Link via Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}