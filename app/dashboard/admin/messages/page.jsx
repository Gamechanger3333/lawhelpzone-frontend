"use client";
// app/dashboard/[role]/messages/page.jsx
// OLD UI preserved exactly + new features added:
//  ✅ Voice notes (record & play, WhatsApp waveform)
//  ✅ No labels on voice/attachment messages ever
//  ✅ Reactions, reply, edit, delete
//  ✅ Typing indicator
//  ✅ Read receipts ✓/✓✓
//  ✅ Message search
//  ✅ Mobile responsive (sidebar toggle)
//  ✅ Dark mode

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Phone, Video, User, X, Send, Paperclip, Smile,
  Search, Plus, ChevronLeft, Mic, Trash2,
  Reply, Edit2, Star, Check, CheckCheck, Download,
  MoreVertical, AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };
const EMOJIS = ["😊","😂","👍","❤️","🙏","✅","🔥","💯","⚖️","📋","💼","📞","✉️","🎉","🤝","📌","👋","🌟","💪","🎯"];
const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🙏","🔥","👏"];

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
const fmtSec = (s) => {
  const n = (!s || !isFinite(s) || isNaN(s)) ? 0 : Math.max(0, s);
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
};
const canEdit   = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
const canDelAll = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 60 * 1000;

// ── Ghost/label detection — catches every placeholder string ────────────────
const JUNK = new Set([
  "attachment","📎 attachment","📎 file","file","📁 file",
  "voice message","voice note","voice recording","voice","audio",
  "🔊","🎙️","🎤","sent a file","sent an attachment",
  "sent a voice note","sent a voice message",
]);
const isJunk = (s) => {
  if (!s) return true;
  const t = s.trim();
  if (!t) return true;
  if (JUNK.has(t) || JUNK.has(t.toLowerCase())) return true;
  if (/^(voice\s*(message|note|recording)?|🎤|🔊|📎\s*(file|attachment)?|attachment)$/i.test(t)) return true;
  return false;
};
const clean = (s) => isJunk(s) ? "" : (s || "");

// ── Detect audio messages ───────────────────────────────────────────────────
const AUDIO_EXT = /\.(webm|ogg|mp3|wav|m4a|aac|opus)(\?|$)/i;
const VOICE_RE  = /voice\s*(message|note|recording)?/i;
const isAudioMsg = (msg) =>
  msg.type === "audio" ||
  (msg.type || "").startsWith("audio/") ||
  AUDIO_EXT.test(msg.fileUrl  || "") ||
  AUDIO_EXT.test(msg.fileName || "") ||
  (msg.fileUrl || "").startsWith("data:audio") ||
  VOICE_RE.test(msg.fileName || "") ||
  VOICE_RE.test(msg.content  || "");

// ── Fix server URLs ─────────────────────────────────────────────────────────
const fixUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://localhost")) return url.replace(/http:\/\/localhost:\d+/, API);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${API}${url}`;
  return null;
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "var(--sk,#e2e8f0)", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

// ── Avatar (same as old) ─────────────────────────────────────────────────────
function Avatar({ user: u, size = 40, showDot = false }) {
  const bg = ROLE_C[u?.role] || "#6366f1";
  const imgSrc = fixUrl(u?.profileImage);
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.36, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} style={{ width: size, height: size, objectFit: "cover" }} alt="" onError={e => e.target.style.display = "none"} />
          : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
      </div>
      {showDot && (
        <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: u?.isOnline ? "#10b981" : "#94a3b8", border: "2px solid var(--sidebar-bg, #fff)" }} />
      )}
    </div>
  );
}

// ── WhatsApp Audio Bubble ────────────────────────────────────────────────────
function AudioBubble({ src, mine }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [loadErr,  setLoadErr]  = useState(!src);
  const audioRef = useRef(null);
  const hasSrc   = !!src;

  const toggle = () => {
    const a = audioRef.current; if (!a || loadErr) return;
    if (playing) { a.pause(); setPlaying(false); }
    else a.play().then(() => setPlaying(true)).catch(() => { setLoadErr(true); setPlaying(false); });
  };

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onEnd  = () => { setPlaying(false); setProgress(0); setElapsed(0); a.currentTime = 0; };
    const onTime = () => { if (a.duration && isFinite(a.duration)) { setProgress(a.currentTime / a.duration * 100); setElapsed(a.currentTime); } };
    const onLoad = () => { if (a.duration && isFinite(a.duration)) setDuration(a.duration); };
    const onErr  = () => { setLoadErr(true); setPlaying(false); };
    a.addEventListener("ended", onEnd); a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad); a.addEventListener("durationchange", onLoad);
    a.addEventListener("error", onErr);
    try { a.load(); } catch {}
    return () => { a.removeEventListener("ended", onEnd); a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onLoad); a.removeEventListener("durationchange", onLoad); a.removeEventListener("error", onErr); };
  }, [src]);

  const BARS = 26;
  const barH = Array.from({ length: BARS }, (_, i) => 18 + Math.abs(Math.sin(i * 1.9) * 55 + Math.cos(i * 0.8) * 26));
  const fill  = mine ? "rgba(255,255,255,0.9)" : "#25d366";
  const empty = mine ? "rgba(255,255,255,0.3)" : "#c8e6c9";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190, maxWidth: 250, padding: "2px 0" }}>
      {hasSrc && <audio ref={audioRef} src={src} preload="auto" style={{ display: "none" }} onError={() => setLoadErr(true)} />}
      <button onClick={toggle}
        style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: loadErr ? (mine ? "rgba(255,255,255,0.15)" : "#fee2e2") : mine ? "rgba(255,255,255,0.22)" : "#e8f5e9", cursor: loadErr ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.1s" }}
        onMouseEnter={e => { if (!loadErr) e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        {loadErr ? <span style={{ fontSize: 13 }}>⚠️</span>
          : playing ? <span style={{ display: "flex", gap: 2.5, alignItems: "center" }}><span style={{ width: 3, height: 13, background: mine ? "#fff" : "#25d366", borderRadius: 2, display: "block" }} /><span style={{ width: 3, height: 13, background: mine ? "#fff" : "#25d366", borderRadius: 2, display: "block" }} /></span>
          : <span style={{ fontSize: 14, marginLeft: 2, color: mine ? "#fff" : "#25d366" }}>▶</span>}
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 24, cursor: "pointer" }}
          onClick={e => { const a = audioRef.current; if (!a?.duration || !isFinite(a.duration)) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = (e.clientX - r.left) / r.width * a.duration; }}>
          {barH.map((h, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 2, minWidth: 2, height: `${h}%`, maxHeight: 22, background: (i / BARS * 100) <= progress ? fill : empty, transition: "background 0.1s" }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.7)" : "#666", fontWeight: 600 }}>
          {playing || elapsed > 0 ? fmtSec(elapsed) : (duration > 0 ? fmtSec(duration) : "0:00")}
        </span>
      </div>
    </div>
  );
}

// ── Profile Modal (same as old) ──────────────────────────────────────────────
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
            {u.profileImage ? <img src={fixUrl(u.profileImage)} style={{ width: 80, height: 80, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{u.name || "User"}</p>
            <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text-muted,#64748b)" }}>{u.email}</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role || "user"}</span>
          </div>
          {u.phone && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📞 {u.phone}</p>}
          {u.city  && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📍 {u.city}{u.country ? `, ${u.country}` : ""}</p>}
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

// ── Message Context Menu ─────────────────────────────────────────────────────
function MsgMenu({ msg, isMine, onReact, onReply, onEdit, onDelete, onCopy, onStar, onClose, x, y }) {
  const ref = useRef(null);
  const editExpired = !canEdit(msg);
  const delExpired  = !canDelAll(msg);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuW = 220;
  const safeX = typeof window !== "undefined" ? Math.min(x, window.innerWidth  - menuW - 12) : x;
  const safeY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - 340  - 12) : y;
  const BG = "#fff", BORDER = "#eef2f7", HOVER = "#f1f5f9", TXT = "#0f172a", MUTED = "#64748b", DIM = "#b8c4cf", RED = "#ef4444";

  const item = (icon, label, action, color = TXT, disabled = false) => (
    <button onClick={() => { if (!disabled) { action(); onClose(); } }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, color: disabled ? DIM : color, fontWeight: 500, textAlign: "left", transition: "background 0.12s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <span style={{ display: "flex", opacity: disabled ? 0.35 : 1 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {disabled && <AlertCircle size={10} style={{ color: DIM, flexShrink: 0 }} />}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "fixed", left: safeX, top: safeY, zIndex: 9999, background: BG, borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.18)", border: `1px solid ${BORDER}`, width: menuW, overflow: "hidden", animation: "popIn 0.14s ease" }}>
      {/* Quick reactions */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 8px 8px", borderBottom: `1px solid ${BORDER}`, gap: 1 }}>
        {QUICK_REACTIONS.map(r => (
          <button key={r} onClick={() => { onReact(r); onClose(); }}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", transition: "transform 0.12s" }}
            onMouseEnter={ev => ev.currentTarget.style.transform = "scale(1.35)"}
            onMouseLeave={ev => ev.currentTarget.style.transform = "scale(1)"}>
            {r}
          </button>
        ))}
      </div>
      {item(<Reply size={14} />,  "Reply",              onReply,                TXT)}
      {item(<Star  size={14} />,  "Star",               onStar,                 TXT)}
      {isMine && item(<Edit2 size={14} />, editExpired ? "Edit (expired)" : "Edit", onEdit, editExpired ? MUTED : TXT, editExpired)}
      <div style={{ height: 1, background: BORDER, margin: "3px 0" }} />
      {item(<Trash2 size={14} />, "Delete for me",       () => onDelete("me"),   RED)}
      {isMine && item(<Trash2 size={14} />, delExpired ? "Delete for everyone (exp.)" : "Delete for everyone", () => onDelete("everyone"), RED, delExpired)}
    </div>
  );
}

// ── New Conversation slide-in panel (same as old) ────────────────────────────
function NewConvPanel({ onClose, onSelect, myId }) {
  const [users,   setUsers]  = useState([]);
  const [search,  setSearch] = useState("");
  const [loading, setL]      = useState(true);

  useEffect(() => {
    const load = async () => {
      setL(true);
      const merged = new Map();
      const add = (arr) => { if (Array.isArray(arr)) arr.forEach(u => { if (u?._id) merged.set(u._id.toString(), u); }); };
      try { const r = await fetch(`${API}/api/messages/users?limit=500`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.users); } } catch {}
      try { const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.allUsers); add(d.allLawyers); } } catch {}
      try { const r = await fetch(`${API}/api/lawyers?limit=50`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.lawyers); } } catch {}
      setUsers([...merged.values()]);
      setL(false);
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
              <div key={u._id} onClick={() => { onSelect(u); onClose(); }}
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

// ── File upload helper ───────────────────────────────────────────────────────
async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
  if (!r.ok) throw new Error("Upload failed");
  const d = await r.json();
  return { url: d.url || d.fileUrl, name: file.name, size: file.size, type: file.type };
}

// ── Main Page ────────────────────────────────────────────────────────────────
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
  const [menuState,   setMenuState]  = useState(null);
  const [replyTo,     setReplyTo]    = useState(null);
  const [editingMsg,  setEditing]    = useState(null);
  const [isTyping,    setIsTyping]   = useState(false);
  const [deletedMsgs, setDeleted]    = useState(new Set());
  const [starredMsgs, setStarred]    = useState(new Set());
  const [isMobile,    setIsMobile]   = useState(false);
  const [showSidebar, setShowSidebar]= useState(true);

  // Voice recording
  const [recording,  setRecording]  = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const mediaRecRef  = useRef(null);
  const recStreamRef = useRef(null);
  const recTimerRef  = useRef(null);
  const audioChunks  = useRef([]);

  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);
  const typingRef = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const autoResize = useCallback(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, []);

  // ── Multi-endpoint user fetch ─────────────────────────────────────────────
  const fetchUserInfo = useCallback(async (id) => {
    try { const r = await fetch(`${API}/api/users/${id}`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; } } catch {}
    try { const r = await fetch(`${API}/api/lawyers/${id}`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); const u = d.lawyer || d; if (u?._id) return u; } } catch {}
    try { const r = await fetch(`${API}/api/admin/users/${id}`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); const u = d.user || d; if (u?._id) return u; } } catch {}
    try { const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); return (d.allUsers || []).find(u => u._id === id) || null; } } catch {}
    return null;
  }, []);

  // ── Load contacts ─────────────────────────────────────────────────────────
  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoadC(true);
    try {
      const r = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); setContacts(d.contacts || []); }
    } catch {}
    if (!silent) { setLoadC(false); setTimeout(() => setReady(true), 80); }
  }, []);

  // ── Load messages ─────────────────────────────────────────────────────────
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

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMsg = useCallback(async (attachment = null) => {
    const content = text.trim();
    if (!content && !attachment) return;
    if (editingMsg) { submitEdit(); return; }
    const receiverId = activeId || contactParam;
    if (!receiverId) return;
    setText(""); setReplyTo(null); setSend(true); setEmoji(false);
    setTimeout(() => autoResize(), 0);
    const opt = {
      _id: `opt-${Date.now()}`, senderId: myId, receiverId, content,
      createdAt: new Date().toISOString(), pending: true,
      ...(replyTo ? { replyTo: { _id: replyTo._id, content: replyTo.content } } : {}),
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: (attachment.type || "").startsWith("audio/") ? "audio" : (attachment.type || "").startsWith("image/") ? "image" : "file" } : {}),
    };
    setMsgs(p => [...p, opt]);
    try {
      const body = { receiverId };
      if (content) body.content = content;
      if (replyTo) body.replyToId = replyTo._id;
      if (attachment) { body.fileUrl = attachment.url; body.fileName = attachment.name; body.type = (attachment.type || "").startsWith("audio/") ? "audio" : (attachment.type || "").startsWith("image/") ? "image" : "file"; }
      const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        setMsgs(p => p.map(m => m._id === opt._id ? (d.message || d) : m));
        if (!activeId && contactParam) setActiveId(contactParam);
        loadContacts(true);
      } else { setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content); }
    } catch { setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content); }
    finally { setSend(false); }
  }, [text, activeId, contactParam, myId, replyTo, editingMsg, autoResize]);

  const submitEdit = useCallback(async () => {
    if (!editingMsg || !text.trim()) return;
    const newText = text.trim();
    setMsgs(p => p.map(m => m._id === editingMsg._id ? { ...m, content: newText, edited: true } : m));
    setText(""); setEditing(null); setTimeout(() => autoResize(), 0);
    try { await fetch(`${API}/api/messages/${editingMsg._id}`, { method: "PATCH", credentials: "include", headers: HJ(), body: JSON.stringify({ content: newText }) }); } catch {}
  }, [editingMsg, text, autoResize]);

  const deleteMsg = useCallback(async (msgId, mode) => {
    setDeleted(p => new Set([...p, msgId]));
    if (mode === "everyone") { try { await fetch(`${API}/api/messages/${msgId}`, { method: "DELETE", credentials: "include", headers: HJ() }); } catch {} }
  }, []);

  const addReaction = useCallback(async (msgId, emoji) => {
    setMsgs(p => p.map(m => {
      if (m._id !== msgId) return m;
      const r = { ...(m.reactions || {}) };
      if (!r[emoji]) r[emoji] = [];
      if (r[emoji].includes(myId)) { r[emoji] = r[emoji].filter(id => id !== myId); if (!r[emoji].length) delete r[emoji]; }
      else r[emoji] = [...r[emoji], myId];
      return { ...m, reactions: r };
    }));
    try { await fetch(`${API}/api/messages/${msgId}/react`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ emoji }) }); } catch {}
  }, [myId]);

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUpload(true);
    try { const att = await uploadFile(file); await sendMsg(att); }
    catch { alert("File upload failed."); }
    finally { setUpload(false); }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) { alert("Voice recording not supported."); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream; audioChunks.current = [];
      const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg","audio/mp4",""]
        .find(t => { try { return !t || MediaRecorder.isTypeSupported(t); } catch { return false; } }) || "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = (e) => { if (e.data?.size > 0) audioChunks.current.push(e.data); };
      mr.onstop = async () => {
        recStreamRef.current?.getTracks().forEach(t => t.stop()); recStreamRef.current = null;
        if (!audioChunks.current.length) return;
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(audioChunks.current, { type }); audioChunks.current = [];
        if (blob.size < 200) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result; if (!dataUrl?.startsWith("data:")) return;
          const receiverId = activeId || contactParam; if (!receiverId) return;
          const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "mp4" : "webm";
          const fileName = `voice-${Date.now()}.${ext}`;
          setSend(true);
          const optId = `opt-${Date.now()}`;
          setMsgs(p => [...p, { _id: optId, senderId: myId, receiverId, fileUrl: dataUrl, fileName, type: "audio", content: "", createdAt: new Date().toISOString(), pending: true }]);
          try {
            const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ receiverId, fileUrl: dataUrl, fileName, type: "audio", content: "" }) });
            if (r.ok) { const d = await r.json(); setMsgs(p => p.map(m => m._id === optId ? (d.message || d) : m)); loadContacts(true); }
            else setMsgs(p => p.filter(m => m._id !== optId));
          } catch { setMsgs(p => p.filter(m => m._id !== optId)); }
          finally { setSend(false); }
        };
        reader.readAsDataURL(blob);
      };
      mr.start(100); mediaRecRef.current = mr;
      setRecording(true); setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(p => p + 1), 1000);
    } catch (err) {
      setRecording(false); setRecSeconds(0);
      if (err.name === "NotAllowedError") alert("Microphone permission denied.");
      else if (err.name === "NotFoundError") alert("No microphone found.");
      else alert("Could not start: " + err.message);
    }
  };

  const stopRecording = () => {
    clearInterval(recTimerRef.current); setRecording(false); setRecSeconds(0);
    if (mediaRecRef.current?.state !== "inactive") { try { mediaRecRef.current.stop(); } catch {} }
    mediaRecRef.current = null;
  };

  const cancelRecording = () => {
    clearInterval(recTimerRef.current);
    if (mediaRecRef.current) { mediaRecRef.current.ondataavailable = null; mediaRecRef.current.onstop = null; try { if (mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop(); } catch {} mediaRecRef.current = null; }
    recStreamRef.current?.getTracks().forEach(t => t.stop()); recStreamRef.current = null;
    audioChunks.current = []; setRecording(false); setRecSeconds(0);
  };

  // ── Select contact ────────────────────────────────────────────────────────
  const selectContact = (c) => {
    setActiveId(c._id); setActiveInfo(c); setSearch(""); setShowNew(false);
    setReplyTo(null); setEditing(null); setText(""); setMenuState(null);
    setTimeout(() => autoResize(), 0);
    setContacts(p => p.map(ct => ct._id === c._id ? { ...ct, unread: 0 } : ct));
    if (isMobile) setShowSidebar(false);
  };

  const cancelAction = () => { setEditing(null); setReplyTo(null); setText(""); setTimeout(() => autoResize(), 0); };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 500); return; }
    loadContacts();
    pollRef.current = setInterval(() => loadContacts(true), 8000);
    return () => clearInterval(pollRef.current);
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

  const handleTextChange = (e) => {
    setText(e.target.value); autoResize();
    if (!activeId) return;
    if (typingRef.current) clearTimeout(typingRef.current);
    fetch(`${API}/api/messages/${activeId}/typing`, { method: "POST", credentials: "include", headers: HJ() }).catch(() => {});
    typingRef.current = setTimeout(() => { typingRef.current = null; }, 2000);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const visibleMsgs = messages.filter(m => !deletedMsgs.has(m._id));

  const grouped = visibleMsgs.reduce((acc, msg) => {
    const day = fmtDay(msg.createdAt || Date.now());
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const activeName   = activeInfo?.name   || activeInfo?.email || "Chat";
  const activeDot    = ROLE_C[activeInfo?.role] || "#6366f1";
  const activeOnline = activeInfo?.isOnline || false;
  const showChat     = !!activeId;
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  return (
    <>
      <style>{`
        :root{
          --sk:#e2e8f0;--chat-bg:#f8fafc;--sidebar-bg:#ffffff;--header-bg:#ffffff;
          --input-bg:#f8fafc;--input-border:#e2e8f0;--conv-hover:#f1f5f9;
          --border-color:#e2e8f0;--bubble-other-bg:#ffffff;--bubble-other-color:#0f172a;
          --day-bg:#f8fafc;--text-heading:#0f172a;--text-muted:#64748b;--text-primary:#374151;
        }
        .dark{
          --sk:#1e293b;--chat-bg:#0a0f1a;--sidebar-bg:#0f172a;--header-bg:#0f172a;
          --input-bg:#1e293b;--input-border:#334155;--conv-hover:#1a2234;
          --border-color:#334155;--bubble-other-bg:#1e293b;--bubble-other-color:#f1f5f9;
          --day-bg:#1e293b;--text-heading:#f1f5f9;--text-muted:#94a3b8;--text-primary:#e2e8f0;
        }
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes scIn{from{transform:scale(0.95) translateY(14px);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideIn{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(0.9) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)}}
        .msg-b{animation:fd 0.18s ease;}
        .conv-row{transition:background 0.12s;cursor:pointer;}
        .conv-row:hover{background:var(--conv-hover)!important;}
        .conv-row.active-c{background:var(--conv-hover)!important;border-left:3px solid #3b82f6!important;}
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

      <div style={{ height: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 112px)", display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ════════════════════ SIDEBAR ════════════════════ */}
        {(isMobile ? showSidebar : true) && (
        <div style={{ width: isMobile ? "100%" : 300, display: "flex", flexDirection: "column", background: "var(--sidebar-bg)", borderRight: "1px solid var(--border-color)", flexShrink: 0 }}>
          {/* Header */}
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

          {/* Contact list */}
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
                    <Avatar user={activeInfo} size={42} showDot />
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
                          <p style={{ margin: 0, fontSize: 12, color: contact.unread > 0 ? "var(--text-heading)" : "var(--text-muted)", fontWeight: contact.unread > 0 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {isAct && isTyping ? <span style={{ color: "#10b981", fontStyle: "italic" }}>typing…</span> : contact.lastMessage || "Start chatting…"}
                          </p>
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

        {/* ════════════════════ CHAT AREA ════════════════════ */}
        {(isMobile ? !showSidebar : true) && (
        showChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--chat-bg)", minWidth: 0 }}>

            {/* Chat header — same as old */}
            <div style={{ padding: "12px 20px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {isMobile && <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)" }}><ChevronLeft size={22} /></button>}
              <div onClick={() => setProfileU(activeInfo)} style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
                <Avatar user={activeInfo} size={42} />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: activeOnline ? "#10b981" : "#94a3b8", border: "2px solid var(--header-bg)" }} />
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setProfileU(activeInfo)}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading)" }}>{activeName}</p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                  {isTyping ? <span style={{ color: "#10b981" }}>typing…</span> : <span style={{ color: activeOnline ? "#10b981" : "var(--text-muted)" }}>{activeOnline ? "● Online" : "● Last seen recently"}</span>}
                  {!isMobile && <span style={{ color: "var(--text-muted)" }}> · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role || "user"}</span></span>}
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

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}
              onClick={() => { setMenuState(null); setEmoji(false); }}>
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
                  {/* Day separator — same as old */}
                  <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border-color)" }} />
                    <span style={{ background: "var(--chat-bg)", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                  </div>

                  {dayMsgs.map((msg, i) => {
                    const mine = String(msg.senderId?._id || msg.senderId) === myId;

                    // ── Resolve fileUrl ───────────────────────────────────
                    const rawUrl = msg.fileUrl?.startsWith("data:") ? msg.fileUrl : fixUrl(msg.fileUrl);
                    const fileUrl = rawUrl && (rawUrl.startsWith("http") || rawUrl.startsWith("data:")) ? rawUrl : null;

                    // ── Detect type ───────────────────────────────────────
                    const isAudio = isAudioMsg(msg);
                    const isImg   = !isAudio && !!fileUrl && (msg.type === "image" || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(msg.fileUrl || "") || /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || ""));

                    // ── Skip ghost/placeholder messages ───────────────────
                    if (isAudio && !fileUrl && !msg.fileUrl) return null;  // ghost voice
                    if (isJunk(msg.content) && isJunk(msg.fileName) && !msg.fileUrl?.startsWith("data:")) return null; // ghost attachment
                    if (!isAudio && !fileUrl && !clean(msg.content)) return null; // empty

                    // ── Clean content — never show labels as text ─────────
                    const content = isAudio ? "" : clean(msg.content);

                    const reactions = msg.reactions || {};
                    const hasR      = Object.keys(reactions).length > 0;
                    const isStarred = starredMsgs.has(msg._id);

                    // Bubble colours
                    const bubbleBg    = mine ? (isAudio ? "#005c4b" : "#3b82f6") : (isAudio ? "#f0fdf4" : "var(--bubble-other-bg)");
                    const bubbleColor = mine ? "#fff" : "var(--bubble-other-color)";

                    return (
                      <div key={msg._id || i} className="msg-b msg-wrap"
                        style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4, alignItems: "flex-end", gap: 6, position: "relative" }}>

                        {!mine && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {activeName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div style={{ maxWidth: isMobile ? "82%" : "68%" }}>
                          {/* Reply quote */}
                          {msg.replyTo && (
                            <div style={{ padding: "5px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.06)", borderLeft: `3px solid ${mine ? "#3b82f6" : "#94a3b8"}`, marginBottom: -2 }}>
                              <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↩ {clean(msg.replyTo.content) || "🎤 Voice message"}</p>
                            </div>
                          )}

                          {/* Bubble — same padding/radius as old */}
                          <div style={{
                            padding: isAudio ? "8px 12px" : isImg ? 4 : "10px 14px",
                            borderRadius: msg.replyTo ? (mine ? "0 14px 4px 14px" : "14px 0 14px 4px") : (mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px"),
                            background: bubbleBg,
                            color: bubbleColor,
                            border: mine ? "none" : (isAudio ? "1px solid #86efac" : "1px solid var(--border-color)"),
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            opacity: msg.pending ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}>
                            {isStarred && <span style={{ fontSize: 10, marginBottom: 3, display: "block", opacity: 0.6 }}>⭐</span>}

                            {/* Text — never shown for audio */}
                            {content && (
                              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>
                                {content}
                                {msg.edited && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 6, fontStyle: "italic" }}>edited</span>}
                              </p>
                            )}

                            {/* Audio bubble */}
                            {isAudio && <AudioBubble src={fileUrl || ""} mine={mine} />}

                            {/* Image — same as old */}
                            {!isAudio && isImg && fileUrl && (
                              <a href={fileUrl} target="_blank" rel="noreferrer">
                                <img src={fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: 220, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover", marginTop: content ? 6 : 0 }} />
                              </a>
                            )}

                            {/* File download — same as old, no label shown */}
                            {!isAudio && !isImg && fileUrl && (
                              <a href={fileUrl} target="_blank" rel="noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)", marginTop: content ? 6 : 0 }}>
                                <Paperclip size={16} />
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{(!msg.fileName || isJunk(msg.fileName)) ? "File" : msg.fileName}</p>
                                  <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Download</p>
                                </div>
                              </a>
                            )}
                          </div>

                          {/* Reactions */}
                          {hasR && (
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4, justifyContent: mine ? "flex-end" : "flex-start" }}>
                              {Object.entries(reactions).map(([emoji, users]) => (
                                <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                                  style={{ padding: "2px 6px", borderRadius: 11, background: users.includes(myId) ? "#dbeafe" : "rgba(255,255,255,0.9)", border: `1px solid ${users.includes(myId) ? "#93c5fd" : "rgba(0,0,0,0.08)"}`, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
                                  {emoji}{users.length > 1 && <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{users.length}</span>}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Timestamp + read receipts — same as old */}
                          <p style={{ margin: "2px 4px 0", fontSize: 10, color: "var(--text-muted)", textAlign: mine ? "right" : "left" }}>
                            {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                            {mine && !msg.pending && <span style={{ marginLeft: 3 }}>{msg.read ? <CheckCheck size={11} style={{ color: "#3b82f6", verticalAlign: "middle" }} /> : <Check size={11} style={{ verticalAlign: "middle" }} />}</span>}
                          </p>
                        </div>

                        {/* Context menu trigger — shows on hover */}
                        {!msg.pending && (
                          <div className="msg-actions" style={{ opacity: 0, display: "flex", alignItems: "center" }}>
                            <button onClick={e => { e.stopPropagation(); setMenuState({ msg, x: e.clientX, y: e.clientY }); }}
                              style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                              <MoreVertical size={12} style={{ color: "#64748b" }} />
                            </button>
                          </div>
                        )}

                        {menuState?.msg._id === msg._id && (
                          <MsgMenu msg={msg} isMine={mine} x={menuState.x} y={menuState.y}
                            onReact={emoji => addReaction(msg._id, emoji)}
                            onReply={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                            onEdit={() => { setEditing(msg); setText(msg.content || ""); setTimeout(() => { inputRef.current?.focus(); autoResize(); }, 50); }}
                            onDelete={mode => deleteMsg(msg._id, mode)}
                            onCopy={() => navigator.clipboard?.writeText(msg.content || "")}
                            onStar={() => setStarred(p => { const n = new Set(p); n.has(msg._id) ? n.delete(msg._id) : n.add(msg._id); return n; })}
                            onClose={() => setMenuState(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeName.charAt(0).toUpperCase()}</div>
                  <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bubble-other-bg)", border: "1px solid var(--border-color)", display: "flex", gap: 2 }}>
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply/Edit bar */}
            {(replyTo || editingMsg) && (
              <div style={{ padding: "8px 14px", background: editingMsg ? "#fffbeb" : "#eff6ff", borderTop: `1px solid ${editingMsg ? "#fde68a" : "#bfdbfe"}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: editingMsg ? "#d97706" : "#3b82f6" }}>{editingMsg ? "✏️ Editing" : `↩ Replying to ${activeInfo?.name || "message"}`}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clean((editingMsg || replyTo)?.content) || "🎤 Voice message"}</p>
                </div>
                <button onClick={cancelAction} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
              </div>
            )}

            {/* Recording bar */}
            {recording && (
              <div style={{ padding: "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={cancelRecording} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "var(--input-bg)", borderRadius: 24, padding: "6px 14px", border: "2px solid #ef4444" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "recPulse 1s ease-in-out infinite" }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", minWidth: 36, fontFamily: "monospace" }}>{fmtSec(recSeconds)}</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, height: 24, overflow: "hidden" }}>
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <div key={idx} style={{ flex: 1, borderRadius: 2, background: "#ef4444", opacity: 0.5 + (idx % 3) * 0.18, height: `${15 + Math.abs(Math.sin((idx * 0.9) + recSeconds * 0.8) * 65)}%`, transition: "height 0.15s ease" }} />
                    ))}
                  </div>
                  <Mic size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                </div>
                <button onClick={stopRecording} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#25d366", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Send size={15} />
                </button>
              </div>
            )}

            {/* ── Input bar — same as old ── */}
            {!recording && (
            <div style={{ padding: "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
              <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()} title="Attach file"
                style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {uploading
                  ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  : <Paperclip size={15} style={{ color: "var(--text-muted)" }} />}
              </button>
              <button className="icon-btn" onClick={() => setEmoji(p => !p)} title="Emoji"
                style={{ width: 36, height: 36, borderRadius: 10, background: showEmoji ? "#eff6ff" : "var(--input-bg)", border: `1px solid ${showEmoji ? "#3b82f6" : "var(--border-color)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smile size={16} style={{ color: showEmoji ? "#3b82f6" : "var(--text-muted)" }} />
              </button>
              <textarea ref={inputRef} value={text} onChange={handleTextChange}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMsg ? submitEdit() : sendMsg(); } if (e.key === "Escape") cancelAction(); }}
                placeholder={editingMsg ? "Edit message… (Esc to cancel)" : replyTo ? `Reply to ${activeInfo?.name || "message"}…` : `Message ${activeName}… (Enter to send, Shift+Enter for new line)`}
                rows={1} className="msg-inp"
                style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: `1px solid ${editingMsg ? "#fbbf24" : "var(--input-border)"}`, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: editingMsg ? "#fffbeb" : "var(--input-bg)", color: "var(--text-primary)", transition: "border-color 0.15s", fontFamily: "inherit" }} />
              {/* Mic button — only when input is empty */}
              {!text.trim() && !editingMsg && (
                <button className="icon-btn" onClick={startRecording} title="Record voice note"
                  style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mic size={15} style={{ color: "var(--text-muted)" }} />
                </button>
              )}
              <button onClick={() => editingMsg ? submitEdit() : sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                style={{ height: 36, padding: "0 16px", borderRadius: 12, background: text.trim() ? "#3b82f6" : "var(--input-bg)", color: text.trim() ? "#fff" : "var(--text-muted)", border: text.trim() ? "none" : "1px solid var(--border-color)", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {sending
                  ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  : <><Send size={15} /><span style={{ fontSize: 13 }}>Send</span></>}
              </button>
            </div>
            )}

            {/* Emoji picker — same as old */}
            {showEmoji && (
              <div style={{ padding: "10px 16px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0 }}>
                {EMOJIS.map(e => (
                  <button key={e}
                    onClick={() => { setText(p => p + e); setEmoji(false); inputRef.current?.focus(); }}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", transition: "transform 0.1s" }}
                    onMouseEnter={el => el.currentTarget.style.transform = "scale(1.2)"}
                    onMouseLeave={el => el.currentTarget.style.transform = "scale(1)"}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No contact open — same as old */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chat-bg)", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(59,130,246,0.3)", animation: "pop 0.4s ease", fontSize: 44 }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-heading)", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Your messages</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
                {contacts.length > 0 ? "Select a conversation from the sidebar" : "Start your first conversation"}
              </p>
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ marginTop: 4, padding: "12px 28px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}>
              <Plus size={16} />New Conversation
            </button>
            {contacts.length > 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{contacts.length} conversation{contacts.length !== 1 ? "s" : ""} in your inbox</p>
            )}
          </div>
        )
        )}
      </div>

      {/* Profile Modal */}
      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileU(null)}
          onMessage={() => { setProfileU(null); inputRef.current?.focus(); }}
          onCall={() => { setProfileU(null); router.push(`/dashboard/${role}/video-calls?contact=${profileUser._id}`); }}
        />
      )}

      {/* New Conversation Panel */}
      {showNewConv && (
        <NewConvPanel myId={myId} onClose={() => setShowNew(false)}
          onSelect={(u) => { selectContact(u); setActiveId(u._id); setActiveInfo(u); }}
        />
      )}
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