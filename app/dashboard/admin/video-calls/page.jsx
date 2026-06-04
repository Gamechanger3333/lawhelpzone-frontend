"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";

// ── Constants ──────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ROLE_COLOR = {
  admin:  "bg-red-500",
  lawyer: "bg-emerald-500",
  client: "bg-blue-500",
};

const TABS = [
  { value: "all",    label: "All" },
  { value: "lawyer", label: "Lawyers" },
  { value: "client", label: "Clients" },
  { value: "admin",  label: "Admins" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...authHeaders(),
});

const generateRoomId = () =>
  `lhz-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const sanitizeRoom = (name) => name.replace(/[^a-zA-Z0-9-_]/g, "-");

const buildJitsiUrl = (room, displayName) =>
  `https://meet.jit.si/${room}#config.startWithAudioMuted=false` +
  `&config.startWithVideoMuted=false` +
  `&config.prejoinPageEnabled=false` +
  `&config.disableDeepLinking=true` +
  `&userInfo.displayName=${encodeURIComponent(displayName)}`;

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const colorClass = ROLE_COLOR[user?.role] || "bg-indigo-500";

  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
      {user?.profileImage ? (
        <img
          src={user.profileImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        (user?.name || "U").charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ── UserRow ────────────────────────────────────────────────────────────────────
function UserRow({ user, isMobile, onCall, onMessage }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <Avatar user={user} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user.name || "Unnamed"}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {isMobile ? user.role : `${user.email || ""} · ${user.role}`}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onCall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors active:scale-95"
        >
          📹{!isMobile && " Call"}
        </button>
        <button
          onClick={onMessage}
          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold transition-colors active:scale-95"
        >
          💬
        </button>
      </div>
    </div>
  );
}

// ── InvitePanel ────────────────────────────────────────────────────────────────
function InvitePanel({ activeRoom, allUsers, contactInfo, invited, onInvite }) {
  const [copied, setCopied] = useState(false);

  const callLink = useMemo(() =>
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/client/video-calls?room=${activeRoom}`
      : "",
    [activeRoom]
  );

  const handleCopy = () => {
    navigator.clipboard?.writeText(callLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const users = [
    ...(contactInfo ? [contactInfo] : []),
    ...allUsers.filter((u) => u._id !== contactInfo?._id).slice(0, 20),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Room info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Room</p>
        <p className="text-xs font-mono text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg break-all mb-3">
          {activeRoom}
        </p>
        <button
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            copied
              ? "bg-emerald-50 text-emerald-600"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          {copied ? "✓ Copied!" : "📋 Copy Call Link"}
        </button>
      </div>

      {/* Invite list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Invite to Call
        </p>
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No users available</p>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  invited[u._id]
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-gray-50 border border-transparent"
                }`}
              >
                <Avatar user={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {u.name || u.email}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize">{u.role}</p>
                </div>
                <button
                  onClick={() => onInvite(u)}
                  disabled={!!invited[u._id]}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    invited[u._id]
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {invited[u._id] ? "✓ Sent" : "Invite"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── CallingScreen ──────────────────────────────────────────────────────────────
function CallingScreen({ contactInfo }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-up">
      <div className="relative w-20 h-20">
        <div className="absolute inset-[-10px] rounded-full border-2 border-emerald-400 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">
          📹
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-gray-900">Connecting…</p>
        {contactInfo && (
          <p className="text-sm text-gray-500 mt-1">
            Calling <strong>{contactInfo.name || contactInfo.email}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

// ── VideoCallsContent ──────────────────────────────────────────────────────────
function VideoCallsContent() {
  const { user }     = useAppSelector((s) => s.auth);
  const searchParams = useSearchParams();
  const router       = useRouter();

  const contactParam = searchParams.get("contact");
  const roomParam    = searchParams.get("room");
  const role         = user?.role || "client";
  const myName       = user?.name || user?.email || "User";
  const myId         = String(user?._id || user?.id || "");

  const [activeRoom,   setActiveRoom]   = useState(roomParam || "");
  const [roomInput,    setRoomInput]    = useState("");
  const [allUsers,     setAllUsers]     = useState([]);
  const [contactInfo,  setContactInfo]  = useState(null);
  const [invited,      setInvited]      = useState({});
  const [ready,        setReady]        = useState(false);
  const [recentCalls,  setRecentCalls]  = useState([]);
  const [search,       setSearch]       = useState("");
  const [activeTab,    setActiveTab]    = useState("all");
  const [autoInvited,  setAutoInvited]  = useState(false);
  const [calling,      setCalling]      = useState(false);
  const [showInvPanel, setShowInvPanel] = useState(false);
  const [linkCopied,   setLinkCopied]   = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);

  // ── Responsive detection ───────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }

    // Fetch users list
    fetch(`${API}/api/messages/users?limit=100`, {
      credentials: "include",
      headers: jsonHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const list = Array.isArray(data) ? data : data.users || [];
        setAllUsers(list.filter((u) => String(u._id || u.id) !== myId));
      })
      .catch(() => {});

    // Fetch contact info if coming from messages
    if (contactParam) {
      const tryFetch = async () => {
        for (const url of [
          `${API}/api/users/${contactParam}`,
          `${API}/api/lawyers/${contactParam}`,
        ]) {
          try {
            const r = await fetch(url, { credentials: "include", headers: jsonHeaders() });
            if (r.ok) {
              const data = await r.json();
              if (data) {
                setContactInfo(data.user || data.lawyer || data);
                break;
              }
            }
          } catch {}
        }
      };
      tryFetch();
    }

    // Load recent calls from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("recentCalls") || "[]");
      setRecentCalls(stored.slice(0, 5));
    } catch {}

    setReady(true);
  }, [user]);

  // ── Auto-start call when coming from contact param ─────────────────────────
  useEffect(() => {
    if (!ready || activeRoom || !contactParam) return;
    const room = sanitizeRoom(roomParam || generateRoomId());
    setActiveRoom(room);
    saveRecentCall(room);
    setCalling(true);
    setTimeout(() => setCalling(false), 600);
  }, [ready]);

  // ── Auto-invite contact when call starts ───────────────────────────────────
  useEffect(() => {
    if (!activeRoom || !contactInfo || autoInvited) return;
    setAutoInvited(true);
    sendInvite(contactInfo, activeRoom);
  }, [activeRoom, contactInfo]);

  // ── Memoized Jitsi URL ─────────────────────────────────────────────────────
  const jitsiUrl = useMemo(
    () => (activeRoom ? buildJitsiUrl(activeRoom, myName) : ""),
    [activeRoom, myName]
  );

  // ── Filtered users ─────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        !query ||
        (u.name || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query) ||
        (u.role || "").toLowerCase().includes(query)
    );
  }, [allUsers, search]);

  const tabUsers = useMemo(
    () =>
      activeTab === "all"
        ? filteredUsers
        : filteredUsers.filter((u) => u.role === activeTab),
    [filteredUsers, activeTab]
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveRecentCall = (room) => {
    try {
      const entry = { room, date: new Date().toISOString() };
      const prev  = JSON.parse(localStorage.getItem("recentCalls") || "[]");
      const next  = [entry, ...prev.filter((x) => x.room !== room)].slice(0, 10);
      localStorage.setItem("recentCalls", JSON.stringify(next));
      setRecentCalls(next.slice(0, 5));
    } catch {}
  };

  const startCall = useCallback(
    (roomName) => {
      const room = sanitizeRoom(roomName || roomInput.trim() || generateRoomId());
      setActiveRoom(room);
      saveRecentCall(room);
      return room;
    },
    [roomInput]
  );

  const sendInvite = useCallback(
    async (targetUser, room) => {
      const userId   = targetUser._id || targetUser.id;
      const roomName = room || activeRoom;
      if (!roomName || !userId) return;

      setInvited((prev) => ({ ...prev, [userId]: true }));

      const joinLink = `${window.location.origin}/dashboard/${targetUser.role || "client"}/video-calls?room=${roomName}`;

      try {
        await fetch(`${API}/api/messages`, {
          method: "POST",
          credentials: "include",
          headers: jsonHeaders(),
          body: JSON.stringify({
            receiverId: userId,
            content: `📹 Join my video call: ${joinLink}`,
          }),
        });
        await fetch(`${API}/api/notifications`, {
          method: "POST",
          credentials: "include",
          headers: jsonHeaders(),
          body: JSON.stringify({
            userId,
            title: "📹 Video Call Invitation",
            body:  `${myName} invites you to a call`,
            type:  "call",
            link:  `/dashboard/${targetUser.role || "client"}/video-calls?room=${roomName}`,
          }),
        });
      } catch {}
    },
    [activeRoom, myName]
  );

  const leaveCall = () => {
    setActiveRoom("");
    setAutoInvited(false);
    setShowInvPanel(false);
  };

  const copyCallLink = () => {
    const link = `${window.location.origin}/dashboard/${role}/video-calls?room=${activeRoom}`;
    navigator.clipboard?.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // ── Calling animation screen ───────────────────────────────────────────────
  if (calling) return <CallingScreen contactInfo={contactInfo} />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>

      {/* ══ PRE-CALL SCREEN ══════════════════════════════════════════════════ */}
      {!activeRoom && (
        <div className="animate-fade-up space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">📹 Video Calls</h1>
            <p className="text-sm text-gray-500 mt-1">Secure video consultations · Jitsi Meet</p>
          </div>

          {/* Action cards */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {/* Start Instant Call */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl mb-3 shadow-md shadow-emerald-100">
                📹
              </div>
              <h3 className="text-base font-extrabold text-gray-900 mb-1">Start Instant Call</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Create a new room — no download needed.
              </p>

              {contactInfo && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                  <Avatar user={contactInfo} size="sm" />
                  <p className="text-sm font-semibold text-emerald-800">
                    Calling: {contactInfo.name || contactInfo.email}
                  </p>
                </div>
              )}

              <button
                onClick={() => startCall()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-[0.98]"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Start Call Now
              </button>
            </div>

            {/* Join a Call */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl mb-3 shadow-md shadow-blue-100">
                🔗
              </div>
              <h3 className="text-base font-extrabold text-gray-900 mb-1">Join a Call</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Enter a room name to join an existing session.
              </p>

              <div className="flex gap-2 mb-3">
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && roomInput.trim() && startCall()}
                  placeholder="Room name…"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  onClick={() => startCall()}
                  disabled={!roomInput.trim()}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                    roomInput.trim()
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Join
                </button>
              </div>

              {recentCalls.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    🕐 Recent
                  </p>
                  {recentCalls.map((rc) => (
                    <button
                      key={rc.room}
                      onClick={() => startCall(rc.room)}
                      className="flex items-center justify-between w-full px-1 py-1.5 rounded-lg text-xs text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
                    >
                      <span className="truncate flex-1 text-left">{rc.room}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {new Date(rc.date).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Users list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* List header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">👥 Users</h3>
                <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                  {allUsers.length} total
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Role tabs */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {TABS.map(({ value, label }) => {
                  const count =
                    value === "all"
                      ? allUsers.length
                      : allUsers.filter((u) => u.role === value).length;
                  return (
                    <button
                      key={value}
                      onClick={() => setActiveTab(value)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeTab === value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List body */}
            <div className={`overflow-y-auto ${isMobile ? "max-h-72" : "max-h-96"}`}>
              {tabUsers.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm text-gray-400 font-semibold">No users found</p>
                </div>
              ) : (
                tabUsers.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    isMobile={isMobile}
                    onCall={() => {
                      const room = startCall();
                      setTimeout(() => sendInvite(u, room), 300);
                    }}
                    onMessage={() =>
                      router.push(`/dashboard/${role}/messages?contact=${u._id}`)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ ACTIVE CALL SCREEN ═══════════════════════════════════════════════ */}
      {activeRoom && (
        <div className="animate-fade-up">
          {/* Call header */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className={`font-extrabold text-gray-900 truncate ${isMobile ? "text-sm" : "text-base"}`}>
                  🔴 Live{contactInfo ? ` · ${contactInfo.name || contactInfo.email}` : ""}
                </p>
                {!isMobile && (
                  <p className="text-xs text-gray-400 font-mono">{activeRoom}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {isMobile && (
                <button
                  onClick={() => setShowInvPanel((p) => !p)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold transition-all active:scale-95"
                >
                  👥 Invite
                </button>
              )}
              <button
                onClick={copyCallLink}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                  linkCopied
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {linkCopied ? "✓ Copied!" : isMobile ? "📋" : "📋 Copy Link"}
              </button>
              <button
                onClick={leaveCall}
                className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs font-bold transition-all active:scale-95 hover:bg-red-100"
              >
                📵{!isMobile && " Leave"}
              </button>
            </div>
          </div>

          {/* Auto-invite confirmation banner */}
          {autoInvited && contactInfo && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
              <span>✅</span>
              <p className="text-sm text-emerald-800 font-semibold">
                Invite sent to <strong>{contactInfo.name || contactInfo.email}</strong>
              </p>
            </div>
          )}

          {/* Layout: mobile = stacked, desktop = side by side */}
          {isMobile ? (
            <div>
              {/* 16:9 responsive iframe */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-black" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={jitsiUrl}
                  className="absolute inset-0 w-full h-full border-none"
                  allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read; clipboard-write"
                  allowFullScreen
                  title="Video Call"
                />
              </div>

              {/* Bottom sheet invite panel */}
              {showInvPanel && (
                <div
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowInvPanel(false)}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[72vh] flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-extrabold text-gray-900">Invite to Call</p>
                      <button
                        onClick={() => setShowInvPanel(false)}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 pb-8">
                      <InvitePanel
                        activeRoom={activeRoom}
                        allUsers={allUsers}
                        contactInfo={contactInfo}
                        invited={invited}
                        onInvite={sendInvite}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
              {/* Jitsi iframe */}
              <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-black">
                <iframe
                  src={jitsiUrl}
                  className="w-full h-full border-none"
                  allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read; clipboard-write"
                  allowFullScreen
                  title="Video Call"
                />
              </div>

              {/* Invite panel */}
              <div className="w-72 overflow-y-auto">
                <InvitePanel
                  activeRoom={activeRoom}
                  allUsers={allUsers}
                  contactInfo={contactInfo}
                  invited={invited}
                  onInvite={sendInvite}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page export with Suspense ──────────────────────────────────────────────────
export default function VideoCallsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-3 h-[60vh]">
          <div className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-blue-500 animate-spin" />
          <span className="text-sm text-gray-400">Loading…</span>
        </div>
      }
    >
      <VideoCallsContent />
    </Suspense>
  );
}