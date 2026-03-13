"use client";
// app/dashboard/[role]/messages/page.jsx
// ✅ Works for: admin/messages, lawyer/messages, client/messages
// ✅ All registered users searchable in New Conversation (multi-endpoint)
// ✅ Profile modal with full user details
// ✅ WhatsApp-style features: delete, edit (15min), reactions, reply, star, copy, pin
// ✅ Full emoji picker (500+ emojis, 8 categories, searchable)
// ✅ File & image attachments
// ✅ Voice notes (record & playback)
// ✅ Typing indicator (send + receive)
// ✅ Online/offline status
// ✅ Unread badges (reset on click)
// ✅ Day separators, optimistic send, read receipts ✓/✓✓
// ✅ Email notification to receiver on new message (via backend API)
// ✅ Mobile responsive (sidebar/chat toggle)
// ✅ Dark mode CSS variables
// ✅ Auto-resize textarea
// ✅ Suspense boundary (Next.js 15)
// ✅ Pinned message bar (WhatsApp-style, with duration picker)
// ✅ Emoji reactions rendered inline below bubble (not absolute)

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Video, X, Send, Paperclip, Smile, Search, Plus,
  ChevronLeft, ChevronUp, ChevronDown, Edit2, Trash2, Reply, MoreVertical,
  Check, CheckCheck, Download, Star, Copy, AlertCircle, User, Mic, Square, Play, Pause,
  Clock, Eye, Timer, Link
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const fixUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("http://localhost:5000") || url.startsWith("http://localhost:3000"))
    return url.replace(/http:\/\/localhost:\d+/, API);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${API}${url}`;
  return null;
};

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };

// ── Full emoji set ────────────────────────────────────────────────────────────
const EMOJI_CATS = {
  "😊 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😚","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 People":  ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🩸"],
  "❤️ Hearts":  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🪬"],
  "🎉 Fun":     ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🥊","🎽","🛹","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  "🍎 Food":    ["🍎","🍊","🍋","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥒","🌶️","🧄","🥔","🥐","🍞","🧀","🥚","🍳","🥞","🧇","🥓","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🧁","🍰","🎂","🍭","🍬","🍫","🍿","🍩","🍪","🥤","🧋","🍵","☕","🍺","🥂","🍾"],
  "✈️ Travel":  ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🛻","🚚","🚛","🏍️","🛵","🚲","🛴","✈️","🚀","🛸","🚁","⛵","🚢","🚂","🏔️","⛰️","🌋","🏕️","🏖️","🏜️","🏝️","🏟️","🏛️","🏗️","🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","⛩️","🗺️","🧭","🌍","🌎","🌏"],
  "💼 Objects": ["⌚","📱","💻","🖥️","⌨️","🖱️","💾","💿","📀","📷","📸","📹","🎥","📞","☎️","📟","📺","📻","🔋","🔌","💡","🔦","🕯️","💰","💵","💳","🪙","✉️","📧","📝","📁","📂","📊","📋","📌","📍","📎","✂️","🔒","🔓","🔑","🗝️","🔨","🛠️","⚙️","🔧","🔩","🧲","🔫","💣","🧱","🛋️","🚪","🛏️","🛁","🚿","🧴","🧹","🧺","🧻","🧼","🛒"],
  "🌟 Symbols": ["❗","❓","‼️","⁉️","💯","♻️","✅","❎","🆗","🆙","🆒","🆕","🆓","⛔","🚫","☢️","☣️","⬆️","➡️","⬇️","⬅️","↕️","↔️","↩️","↪️","🔃","🔄","🔔","🔕","📢","📣","💬","💭","🗯️","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","▶️","⏩","◀️","⏪","🔼","🔽","⏸️","⏹️","⏺️","🎦","🔇","🔈","🔉","🔊"],
};
const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🙏","🔥","👏","😍","🥳","💯","✅","🎉","😎","🤔","💪"];

const fmt = (d) => {
  try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};
const fmtDay = (d) => {
  try {
    const n = new Date(), t = new Date(d);
    if (n.toDateString() === t.toDateString()) return "Today";
    const y = new Date(n); y.setDate(n.getDate() - 1);
    return y.toDateString() === t.toDateString() ? "Yesterday" : t.toLocaleDateString();
  } catch { return ""; }
};
const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
const canEdit              = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
const canDeleteForEveryone = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 1000;

// ── URL extractor ─────────────────────────────────────────────────────────────
const URL_RE = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
const extractUrls = (text) => { try { return [...(text || "").matchAll(URL_RE)].map(m => m[0]); } catch { return []; } };

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "var(--sk,#e2e8f0)", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user: u, size = 40, online }) {
  const bg     = ROLE_C[u?.role] || "#6366f1";
  const imgSrc = fixUrl(u?.profileImage);
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} style={{ width: size, height: size, objectFit: "cover" }} alt="" onError={e => { e.target.style.display = "none"; }} />
          : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
      </div>
      {online !== undefined && (
        <span style={{ position: "absolute", bottom: 1, right: 1, width: Math.max(size * 0.24, 8), height: Math.max(size * 0.24, 8), borderRadius: "50%", background: online ? "#22c55e" : "#94a3b8", border: "2px solid var(--sidebar-bg,#fff)" }} />
      )}
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
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
            {u.profileImage
              ? <img src={fixUrl(u.profileImage)} style={{ width: 80, height: 80, objectFit: "cover" }} alt="" />
              : (u.name || u.email || "U").charAt(0).toUpperCase()}
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

// ── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const [tab,    setTab]    = useState(Object.keys(EMOJI_CATS)[0]);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const results = search ? Object.values(EMOJI_CATS).flat().filter(e => e.includes(search)) : null;
  return (
    <div ref={ref} style={{ background: "var(--sidebar-bg,#fff)", borderRadius: 16, boxShadow: "0 -4px 40px rgba(0,0,0,0.18)", border: "1px solid var(--border-color,#e2e8f0)", width: 320, height: 380, display: "flex", flexDirection: "column", overflow: "hidden", animation: "popUp 0.2s ease" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color,#e2e8f0)" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emoji…"
            style={{ width: "100%", padding: "6px 10px 6px 28px", borderRadius: 8, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", boxSizing: "border-box" }} />
        </div>
      </div>
      {!search && (
        <div style={{ display: "flex", overflowX: "auto", padding: "6px 8px", gap: 2, borderBottom: "1px solid var(--border-color,#e2e8f0)", scrollbarWidth: "none" }}>
          {Object.keys(EMOJI_CATS).map(cat => (
            <button key={cat} onClick={() => setTab(cat)} style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: tab === cat ? "#eff6ff" : "transparent", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
              {cat.split(" ")[0]}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {!search && <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{tab.split(" ").slice(1).join(" ")}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {(results || EMOJI_CATS[tab] || []).map((e, i) => (
            <button key={`${e}-${i}`} onClick={() => onSelect(e)}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s, transform 0.1s" }}
              onMouseEnter={el => { el.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"; el.currentTarget.style.transform = "scale(1.2)"; }}
              onMouseLeave={el => { el.currentTarget.style.background = "transparent"; el.currentTarget.style.transform = "scale(1)"; }}>
              {e}
            </button>
          ))}
          {results?.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>No emoji found</p>}
        </div>
      </div>
    </div>
  );
}

// ── Pin Duration Modal ────────────────────────────────────────────────────────
function PinDurationModal({ onPin, onClose }) {
  const [duration, setDuration] = useState("7days");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "scIn 0.3s ease" }}>
        <div style={{ padding: "24px 24px 8px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Choose how long your pin lasts</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>You can unpin at any time.</p>
          {[["24hours","24 hours"],["7days","7 days"],["30days","30 days"]].map(([val, label]) => (
            <div key={val} onClick={() => setDuration(val)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${duration === val ? "#3b82f6" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {duration === val && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#3b82f6" }} />}
              </div>
              <span style={{ fontSize: 15, color: "#0f172a", fontWeight: duration === val ? 700 : 400 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "transparent", color: "#3b82f6", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onPin(duration); onClose(); }} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Pin</button>
        </div>
      </div>
    </div>
  );
}

// ── Voice Note Player ─────────────────────────────────────────────────────────
function VoiceNotePlayer({ src, mine, duration }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [totalDur, setTotalDur] = useState(duration || 0);
  const audioRef                = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const onEnded      = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    const onTimeUpdate = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      setProgress((audio.currentTime / audio.duration) * 100);
      setElapsed(audio.currentTime);
    };
    const onLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) setTotalDur(audio.duration);
    };
    audio.addEventListener("ended",            onEnded);
    audio.addEventListener("timeupdate",       onTimeUpdate);
    audio.addEventListener("loadedmetadata",   onLoaded);
    audio.addEventListener("durationchange",   onLoaded);
    return () => {
      audio.removeEventListener("ended",          onEnded);
      audio.removeEventListener("timeupdate",     onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
    };
  }, []);

  const fmt = (s) => {
    const m = Math.floor((s || 0) / 60), sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const fillColor  = mine ? "#fff" : "#3b82f6";
  const trackColor = mine ? "rgba(255,255,255,0.3)" : "#dde6f0";
  const timeColor  = mine ? "rgba(255,255,255,0.75)" : "#64748b";

  /* Fake waveform bars — 28 bars with pseudo-random heights */
  const BARS = 28;
  const barHeights = Array.from({ length: BARS }, (_, i) =>
    30 + Math.abs(Math.sin(i * 1.7 + 0.5) * 55 + Math.cos(i * 0.9) * 25)
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", minWidth: 220, maxWidth: 280 }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause button */}
      <button onClick={toggle}
        style={{ width: 38, height: 38, borderRadius: "50%", background: mine ? "rgba(255,255,255,0.25)" : "#eff6ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.1s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        {playing
          ? <Pause size={15} style={{ color: mine ? "#fff" : "#3b82f6" }} />
          : <Play  size={15} style={{ color: mine ? "#fff" : "#3b82f6", marginLeft: 2 }} />}
      </button>

      {/* Waveform + time */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Waveform bars (clickable seek) */}
        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 28, cursor: "pointer" }}
          onClick={e => {
            if (!audioRef.current?.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = ratio * audioRef.current.duration;
          }}>
          {barHeights.map((h, i) => {
            const pct = i / BARS * 100;
            const filled = pct <= progress;
            return (
              <div key={i} style={{
                flex: 1, height: `${h}%`, maxHeight: 26,
                borderRadius: 2,
                background: filled ? fillColor : trackColor,
                transition: "background 0.1s",
                minWidth: 2,
              }} />
            );
          })}
        </div>
        {/* Elapsed / total */}
        <span style={{ fontSize: 10, color: timeColor, fontWeight: 500 }}>
          {playing || elapsed > 0 ? fmt(elapsed) : fmt(totalDur)}
        </span>
      </div>

      {/* Mic icon */}
      <Mic size={14} style={{ color: mine ? "rgba(255,255,255,0.6)" : "#94a3b8", flexShrink: 0 }} />
    </div>
  );
}

// ── Link Preview Card ─────────────────────────────────────────────────────────
function LinkPreviewCard({ url, mine }) {
  const [meta, setMeta] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Use microlink for OG data (free, no key needed for basic use)
        const r = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`);
        if (!r.ok) { setFailed(true); return; }
        const d = await r.json();
        if (!cancelled && d.status === "success") {
          setMeta({ title: d.data?.title, description: d.data?.description, image: d.data?.image?.url, site: d.data?.publisher || new URL(url).hostname });
        } else { setFailed(true); }
      } catch { if (!cancelled) setFailed(true); }
    };
    load();
    return () => { cancelled = true; };
  }, [url]);

  if (failed) return null;
  const host = (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } })();

  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6, borderRadius: 10, overflow: "hidden", border: `1px solid ${mine ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.1)"}`, textDecoration: "none", background: mine ? "rgba(255,255,255,0.12)" : "var(--input-bg,#f8fafc)", transition: "opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {meta?.image && <img src={meta.image} alt="" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />}
      <div style={{ padding: "8px 10px" }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: mine ? "rgba(255,255,255,0.65)" : "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5 }}>{meta?.site || host}</p>
        {meta?.title && <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 700, color: mine ? "#fff" : "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title}</p>}
        {meta?.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: mine ? "rgba(255,255,255,0.75)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{meta.description}</p>}
        {!meta && <p style={{ margin: 0, fontSize: 11, color: mine ? "rgba(255,255,255,0.65)" : "#3b82f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {host}</p>}
      </div>
    </a>
  );
}

// ── Reactions Summary Modal ───────────────────────────────────────────────────
function ReactSummaryModal({ reactions, myId, myName, otherName, onClose }) {
  const ref = useRef(null);
  const [tab, setTab] = useState("all");
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const allEmojis = Object.keys(reactions);
  const rows = tab === "all"
    ? allEmojis.flatMap(emoji => reactions[emoji].map(uid => ({ emoji, uid })))
    : (reactions[tab] || []).map(uid => ({ emoji: tab, uid }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} style={{ background: "var(--header-bg,#fff)", borderRadius: 20, width: 320, maxHeight: 400, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", animation: "scIn 0.2s ease" }}>
        <div style={{ padding: "14px 16px 0", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-heading)" }}>Reactions</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
            <button onClick={() => setTab("all")} style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 20, border: "none", background: tab === "all" ? "#3b82f6" : "var(--input-bg,#f1f5f9)", color: tab === "all" ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              All {Object.values(reactions).flat().length}
            </button>
            {allEmojis.map(e => (
              <button key={e} onClick={() => setTab(e)} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 20, border: "none", background: tab === e ? "#3b82f6" : "var(--input-bg,#f1f5f9)", color: tab === e ? "#fff" : "var(--text-heading)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {e} <span style={{ fontSize: 11, fontWeight: 700 }}>{reactions[e].length}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {rows.map(({ emoji, uid }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f618", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {uid === myId ? (myName || "Me").charAt(0).toUpperCase() : (otherName || "?").charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-heading)" }}>{uid === myId ? "You" : (otherName || "Them")}</span>
              <span style={{ fontSize: 20 }}>{emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Disappear Timer Modal ─────────────────────────────────────────────────────
function DisappearTimerModal({ current, onSet, onClose }) {
  const [sel, setSel] = useState(current || "off");
  const opts = [
    { val: "off",  label: "Off",     desc: "Messages won't disappear" },
    { val: "24h",  label: "24 hours",desc: "Messages delete after 1 day" },
    { val: "7d",   label: "7 days",  desc: "Messages delete after a week" },
    { val: "90d",  label: "90 days", desc: "Messages delete after 3 months" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--header-bg,#fff)", borderRadius: 20, width: 320, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", animation: "scIn 0.2s ease" }}>
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "var(--text-heading)" }}>⏳ Disappearing Messages</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>New messages will auto-delete</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "8px 0" }}>
          {opts.map(o => (
            <div key={o.val} onClick={() => setSel(o.val)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", cursor: "pointer", background: sel === o.val ? "#eff6ff" : "transparent", transition: "background 0.12s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel === o.val ? "#3b82f6" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.15s" }}>
                {sel === o.val && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading)" }}>{o.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{o.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 18px 16px" }}>
          <button onClick={() => { onSet(sel); onClose(); }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
// ── Image bubble with broken-image fallback ───────────────────────────────────
function ImgBubble({ src, mine }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <a href={src} target="_blank" rel="noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
          background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg,#f1f5f9)",
          textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)" }}>
        <Download size={14} />
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>📷 View image</p>
          <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Tap to open</p>
        </div>
      </a>
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt="image"
        onError={() => setBroken(true)}
        style={{ maxWidth: 240, maxHeight: 220, borderRadius: 12, display: "block", objectFit: "cover" }} />
    </a>
  );
}

function MsgMenu({ msg, isMine, onDelete, onEdit, onReply, onReact, onCopy, onStar, onPin, onForward, onClose, x, y }) {
  const ref                             = useRef(null);
  const [showAllEmoji, setShowAllEmoji] = useState(false);
  const [emojiSearch, setEmojiSearch]   = useState("");
  const [activeEmojiCat, setActiveEmojiCat] = useState(Object.keys(EMOJI_CATS)[0]);
  const [showInfo, setShowInfo]         = useState(false);
  const editExpired           = !canEdit(msg);
  const deleteEveryoneExpired = !canDeleteForEveryone(msg);
  const hasFile = !!msg.fileUrl;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuW = showAllEmoji ? 320 : 260;
  const menuH = showAllEmoji ? 460 : "auto";
  const safeX = typeof window !== "undefined" ? Math.min(x, window.innerWidth  - menuW - 12) : x;
  const safeY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - (showAllEmoji ? 460 : 480) - 12) : y;

  const BG    = "var(--header-bg,#ffffff)";
  const BORDER= "var(--border-color,#eef2f7)";
  const HOVER = "var(--conv-hover,#f1f5f9)";
  const TXT   = "var(--text-heading,#0f172a)";
  const MUTED = "var(--text-muted,#64748b)";
  const DIM   = "#b8c4cf";
  const RED   = "#ef4444";

  const item = (icon, label, action, color = TXT, disabled = false, rightIcon = null) => (
    <button onClick={() => { if (!disabled) { action(); } }}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 16px", border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", fontSize: 14, color: disabled ? DIM : color, fontWeight: 400, textAlign: "left", transition: "background 0.12s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <span style={{ display: "flex", width: 20, justifyContent: "center", opacity: disabled ? 0.35 : 1, color: disabled ? DIM : color, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, color: disabled ? DIM : color }}>{label}</span>
      {rightIcon}
      {disabled && <AlertCircle size={11} style={{ color: DIM, flexShrink: 0 }} />}
    </button>
  );

  const Divider = () => <div style={{ height: 1, background: BORDER, margin: "2px 0" }} />;

  const displayEmojis = emojiSearch
    ? Object.values(EMOJI_CATS).flat().filter(e => e.includes(emojiSearch))
    : EMOJI_CATS[activeEmojiCat] || [];

  // ── Save as (download) ──
  const handleSaveAs = () => {
    if (!msg.fileUrl) return;
    const a = document.createElement("a");
    a.href = fixUrl(msg.fileUrl) || msg.fileUrl;
    a.download = msg.fileName || "file";
    a.target = "_blank";
    a.click();
    onClose();
  };

  // ── Share via Web Share API ──
  const handleShare = async () => {
    const text = msg.content || (msg.fileUrl ? "📎 File" : "");
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard?.writeText(text);
      alert("Copied to clipboard (share not supported on this browser)");
    }
    onClose();
  };

  // ── Message info panel ──
  if (showInfo) {
    const sentAt = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "Unknown";
    return (
      <div ref={ref} style={{ position: "fixed", left: safeX, top: safeY, zIndex: 9999, background: BG, borderRadius: 18, boxShadow: "0 16px 56px rgba(0,0,0,0.22)", border: `1px solid ${BORDER}`, width: 260, overflow: "hidden", animation: "popIn 0.15s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px 10px", borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={() => setShowInfo(false)} style={{ background: HOVER, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TXT, fontSize: 16, flexShrink: 0 }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 14, color: TXT }}>Message info</span>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: MUTED }}>Sent</span>
            <span style={{ fontSize: 12, color: TXT, fontWeight: 500 }}>{sentAt}</span>
          </div>
          {msg.edited && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: MUTED }}>Edited</span>
              <span style={{ fontSize: 12, color: TXT, fontWeight: 500 }}>Yes</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: MUTED }}>Status</span>
            <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {msg.read ? <><CheckCheck size={13} /> Read</> : <><Check size={13} /> Delivered</>}
            </span>
          </div>
          {msg.type && msg.type !== "text" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: MUTED }}>Type</span>
              <span style={{ fontSize: 12, color: TXT, fontWeight: 500, textTransform: "capitalize" }}>{msg.type}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{
      position: "fixed", left: safeX, top: safeY, zIndex: 9999,
      background: BG, borderRadius: 18,
      boxShadow: "0 16px 56px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
      border: `1px solid ${BORDER}`, width: menuW,
      height: showAllEmoji ? menuH : "auto",
      overflow: "hidden", display: "flex", flexDirection: "column",
      animation: "popIn 0.15s ease", transition: "width 0.2s ease, height 0.2s ease"
    }}>
      {showAllEmoji ? (
        /* ── Full emoji picker ── */
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 8px", borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={() => { setShowAllEmoji(false); setEmojiSearch(""); }}
              style={{ background: HOVER, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: TXT, fontSize: 16 }}>‹</button>
            <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Search reaction…" autoFocus
              style={{ flex: 1, border: `1.5px solid #3b82f6`, borderRadius: 20, padding: "5px 12px", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", color: TXT }} />
          </div>
          {!emojiSearch && (
            <div style={{ display: "flex", overflowX: "auto", padding: "6px 8px 4px", gap: 2, scrollbarWidth: "none", borderBottom: `1px solid ${BORDER}` }}>
              {Object.keys(EMOJI_CATS).map(cat => (
                <button key={cat} onClick={() => setActiveEmojiCat(cat)} title={cat}
                  style={{ flexShrink: 0, width: 34, height: 30, borderRadius: 8, border: "none", background: activeEmojiCat === cat ? HOVER : "transparent", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: activeEmojiCat === cat ? "2px solid #3b82f6" : "2px solid transparent" }}>
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
          {!emojiSearch && (
            <div style={{ padding: "6px 12px 2px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {activeEmojiCat}
              </span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
            {displayEmojis.map((e, i) => (
              <button key={`${e}-${i}`} onClick={() => { onReact(e); onClose(); }}
                style={{ width: "100%", aspectRatio: "1", border: "none", background: "transparent", fontSize: 22, cursor: "pointer", borderRadius: 8, transition: "background 0.1s, transform 0.1s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={ev => { ev.currentTarget.style.background = HOVER; ev.currentTarget.style.transform = "scale(1.3)"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.transform = "scale(1)"; }}>
                {e}
              </button>
            ))}
            {displayEmojis.length === 0 && <span style={{ gridColumn: "1/-1", padding: "12px 0", textAlign: "center", fontSize: 13, color: MUTED }}>No emoji found</span>}
          </div>
        </div>
      ) : (
        /* ── Main menu ── */
        <>
          {/* Quick reactions row */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 8px 8px", borderBottom: `1px solid ${BORDER}`, gap: 2 }}>
            <div style={{ display: "flex", overflowX: "auto", flex: 1, gap: 1, scrollbarWidth: "none" }}>
              {QUICK_REACTIONS.slice(0, 6).map(r => (
                <button key={r} onClick={() => { onReact(r); onClose(); }}
                  style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent", fontSize: 22, cursor: "pointer", transition: "transform 0.12s, background 0.12s", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={ev => { ev.currentTarget.style.transform = "scale(1.45)"; ev.currentTarget.style.background = HOVER; }}
                  onMouseLeave={ev => { ev.currentTarget.style.transform = "scale(1)"; ev.currentTarget.style.background = "transparent"; }}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAllEmoji(true)}
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${BORDER}`, background: HOVER, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontWeight: 700, marginLeft: 2 }}
              title="All reactions">+</button>
          </div>

          {/* Menu items — matching WhatsApp order */}
          {item(<span style={{ fontSize: 15 }}>ℹ️</span>, "Message info", () => { setShowInfo(true); })}
          {item(<Reply size={15} />, "Reply", () => { onReply(); onClose(); })}
          {item(<Copy  size={15} />, "Copy",  () => { onCopy();  onClose(); })}
          {item(<span style={{ fontSize: 15 }}>↗️</span>, "Forward", () => { onForward?.(); onClose(); })}
          {item(<span style={{ fontSize: 14 }}>📌</span>, msg.pinned ? "Unpin" : "Pin", () => { onPin(); onClose(); })}
          {item(<Star  size={15} />, "Star message", () => { onStar(); onClose(); })}

          <Divider />

          {hasFile && item(<Download size={15} />, "Save as", handleSaveAs)}
          {item(<span style={{ fontSize: 15 }}>↗</span>, "Share", handleShare)}
          {isMine && item(<Edit2 size={15} />, editExpired ? "Edit (expired)" : "Edit", () => { onEdit(); onClose(); }, editExpired ? MUTED : TXT, editExpired)}

          <Divider />

          {item(<Trash2 size={15} />, "Delete for me",        () => { onDelete("me");       onClose(); }, RED)}
          {isMine && item(<Trash2 size={15} />, deleteEveryoneExpired ? "Delete for everyone (expired)" : "Delete for everyone", () => { onDelete("everyone"); onClose(); }, RED, deleteEveryoneExpired)}
        </>
      )}
    </div>
  );
}

// ── File upload ───────────────────────────────────────────────────────────────
async function uploadFile(file) {
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
  if (!r.ok) throw new Error("Upload failed");
  const d = await r.json();
  return { url: d.url || d.fileUrl, name: file.name, size: file.size, type: file.type };
}

// ── Main Messages Component ───────────────────────────────────────────────────
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
  const [msgSearch,   setMsgSearch]  = useState("");
  const [showMsgSrch, setShowMsgSrch]= useState(false);
  const [loadC,       setLoadC]      = useState(true);
  const [loadM,       setLoadM]      = useState(false);
  const [sending,     setSend]       = useState(false);
  const [uploading,   setUpload]     = useState(false);
  const [ready,       setReady]      = useState(false);
  const [showEmoji,   setShowEmoji]  = useState(false);
  const [showNewConv, setShowNew]    = useState(false);
  const [showSidebar, setShowSidebar]= useState(true);
  const [isMobile,    setIsMobile]   = useState(false);
  const [menuState,   setMenuState]  = useState(null);
  const [replyTo,     setReplyTo]    = useState(null);
  const [editingMsg,  setEditing]    = useState(null);
  const [isTyping,    setIsTyping]   = useState(false);
  const [onlineUsers, setOnline]     = useState({});
  const [starredMsgs, setStarred]    = useState(new Set());
  const [deletedMsgs, setDeleted]    = useState(new Set());
  const [profileUser, setProfileU]   = useState(null);
  // ── Pin state ───────────────────────────────────────────────────────────────
  const [pinnedMsg,   setPinnedMsg]  = useState(null);
  const [pinTarget,   setPinTarget]  = useState(null);
  // ── Voice note state ────────────────────────────────────────────────────────
  const [recording,   setRecording]  = useState(false);
  const [recSeconds,  setRecSeconds] = useState(0);
  const mediaRecRef   = useRef(null);
  const recStreamRef  = useRef(null);   // ← store stream separately so we can stop tracks
  const recChunksRef  = useRef([]);
  const recTimerRef   = useRef(null);
  const sendMsgWithAttachmentRef = useRef(null);
  // ── New feature state ───────────────────────────────────────────────────────
  const [firstUnreadId,      setFirstUnreadId]      = useState(null);   // unread divider
  const [reactSummary,       setReactSummary]       = useState(null);   // { msgId, reactions }
  const [disappearTimer,     setDisappearTimer]     = useState("off");  // "off"|"24h"|"7d"|"90d"
  const [showDisappearModal, setShowDisappearModal] = useState(false);
  const [searchIdx,          setSearchIdx]          = useState(0);      // current jump-to result
  const swipeStartX = useRef({});   // msgId -> touchstart X
  const [swipeOffset, setSwipeOffset] = useState({});  // msgId -> current px offset

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const inputRef   = useRef(null);
  const typingRef  = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const autoResize = useCallback(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  // ── Voice note recording ──────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;  // ← store stream so we can stop tracks later
      const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/mp4"]
        .find(t => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecRef.current = mr;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(p => p + 1), 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone permission in your browser.");
    }
  }, []);

  const stopRecording = useCallback((cancel = false) => {
    if (!mediaRecRef.current) return;
    clearInterval(recTimerRef.current);
    const mr      = mediaRecRef.current;
    const stream  = recStreamRef.current;
    const stopTracks = () => { stream?.getTracks().forEach(t => t.stop()); recStreamRef.current = null; };

    if (cancel) {
      mr.stop();
      stopTracks();
      mediaRecRef.current = null;
      setRecording(false);
      setRecSeconds(0);
      recChunksRef.current = [];
      return;
    }

    const durSec = recSeconds;   // capture before state resets

    mr.onstop = async () => {
      stopTracks();
      const chunks = recChunksRef.current.slice();
      recChunksRef.current = [];
      mediaRecRef.current  = null;
      setRecording(false);
      setRecSeconds(0);

      if (!chunks.length) { alert("No audio recorded. Please try again."); return; }

      const mimeType = mr.mimeType || "audio/webm";
      const blob     = new Blob(chunks, { type: mimeType });
      const ext      = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const file     = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });

      setUpload(true);
      try {
        const att = await uploadFile(file);
        if (!att?.url) throw new Error("No URL returned from upload");
        await sendMsgWithAttachmentRef.current?.({ ...att, voiceDuration: durSec, type: "audio" });
      } catch (err) {
        console.error("Voice note upload error:", err);
        alert("Voice note upload failed. Check that your backend /api/upload accepts audio files.");
      } finally {
        setUpload(false);
      }
    };

    mr.stop();
  }, [recSeconds]);

  // ── Multi-endpoint user lookup ────────────────────────────────────────────
  const fetchUserInfo = useCallback(async (id) => {
    const endpoints = [
      `${API}/api/users/${id}`,
      `${API}/api/lawyers/${id}`,
      `${API}/api/admin/users/${id}`,
    ];
    for (const url of endpoints) {
      try {
        const r = await fetch(url, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); const u = d.user || d.lawyer || d; if (u?._id) return u; }
      } catch {}
    }
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
        const d = await r.json();
        const msgs = d.messages || [];
        setMsgs(msgs);
        // ── Find first unread message for divider ──
        if (!silent) {
          const firstUnread = msgs.find(m => String(m.senderId?._id || m.senderId) !== myId && !m.read);
          setFirstUnreadId(firstUnread?._id || null);
        }
        if (!silent) fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, [myId]);

  const deleteMsg = useCallback(async (msgId, mode) => {
    setDeleted(p => new Set([...p, msgId]));
    if (mode === "everyone") {
      try { await fetch(`${API}/api/messages/${msgId}`, { method: "DELETE", credentials: "include", headers: HJ() }); }
      catch { setDeleted(p => { const n = new Set(p); n.delete(msgId); return n; }); }
    }
  }, []);

  const submitEdit = useCallback(async () => {
    if (!editingMsg || !text.trim()) return;
    if (!canEdit(editingMsg)) { alert("You can only edit messages within 15 minutes."); return; }
    const newText = text.trim();
    setMsgs(p => p.map(m => m._id === editingMsg._id ? { ...m, content: newText, edited: true } : m));
    setText(""); setEditing(null); setTimeout(() => autoResize(), 0);
    try { await fetch(`${API}/api/messages/${editingMsg._id}`, { method: "PATCH", credentials: "include", headers: HJ(), body: JSON.stringify({ content: newText }) }); }
    catch { loadMsgs(activeId, true); }
  }, [editingMsg, text, activeId, autoResize]);

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

  // ── Core send (accepts optional attachment) ───────────────────────────────
  const sendMsgWithAttachment = useCallback(async (attachment = null) => {
    const content    = text.trim();
    const receiverId = activeId || contactParam;
    if (!content && !attachment) return;
    if (!receiverId) return;

    setText(""); setReplyTo(null); setSend(true); setShowEmoji(false);
    setTimeout(() => autoResize(), 0);

    const isAudio = attachment?.type === "audio";
    const opt = {
      _id: `opt-${Date.now()}`, senderId: myId, receiverId,
      content, createdAt: new Date().toISOString(), pending: true,
      ...(replyTo    ? { replyTo: { _id: replyTo._id, content: replyTo.content } } : {}),
      ...(attachment ? {
        fileUrl: attachment.url, fileName: attachment.name,
        type: isAudio ? "audio" : (attachment.type?.startsWith("image/") ? "image" : "file"),
        voiceDuration: attachment.voiceDuration || 0,
      } : {}),
    };
    setMsgs(p => [...p, opt]);

    try {
      const body = { receiverId };
      if (content)    body.content   = content;
      if (replyTo)    body.replyToId = replyTo._id;
      if (attachment) {
        body.fileUrl      = attachment.url;
        body.fileName     = attachment.name;
        body.type         = isAudio ? "audio" : (attachment.type?.startsWith("image/") ? "image" : "file");
        if (isAudio) body.voiceDuration = attachment.voiceDuration || 0;
      }

      const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        setMsgs(p => p.map(m => m._id === opt._id ? (d.message || d) : m));
        if (!activeId && contactParam) setActiveId(contactParam);
        loadContacts(true);
      } else {
        setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content);
      }
    } catch {
      setMsgs(p => p.filter(m => m._id !== opt._id)); setText(content);
    } finally { setSend(false); }
  }, [text, activeId, contactParam, myId, replyTo, autoResize]);
  sendMsgWithAttachmentRef.current = sendMsgWithAttachment; // keep ref fresh

  const sendMsg = useCallback(async (attachment = null) => {
    if (editingMsg) { submitEdit(); return; }
    await sendMsgWithAttachment(attachment);
  }, [editingMsg, submitEdit, sendMsgWithAttachment]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setUpload(true);
    try { await sendMsg(await uploadFile(file)); } catch { alert("Upload failed."); } finally { setUpload(false); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value); autoResize();
    if (!activeId) return;
    if (typingRef.current) clearTimeout(typingRef.current);
    fetch(`${API}/api/messages/${activeId}/typing`, { method: "POST", credentials: "include", headers: HJ() }).catch(() => {});
    typingRef.current = setTimeout(() => { typingRef.current = null; }, 2000);
  };

  const selectContact = (c) => {
    setActiveId(c._id); setActiveInfo(c); setSearch(""); setShowNew(false);
    setMsgSearch(""); setShowMsgSrch(false);
    setReplyTo(null); setEditing(null); setText("");
    setTimeout(() => autoResize(), 0);
    setContacts(p => p.map(ct => ct._id === c._id ? { ...ct, unread: 0 } : ct));
    if (isMobile) setShowSidebar(false);
  };

  const cancelAction = () => { setEditing(null); setReplyTo(null); setText(""); setTimeout(() => autoResize(), 0); };

  // ── Swipe-to-reply handlers ─────────────────────────────────────────────────
  const onSwipeTouchStart = useCallback((msgId, e) => {
    swipeStartX.current[msgId] = e.touches[0].clientX;
  }, []);

  const onSwipeTouchMove = useCallback((msgId, mine, e) => {
    const startX = swipeStartX.current[msgId];
    if (startX == null) return;
    const dx = e.touches[0].clientX - startX;
    // Only allow swipe right for other's messages, left for mine (like WhatsApp)
    const swipe = mine ? Math.min(0, dx) : Math.max(0, dx);
    const clamped = Math.max(-70, Math.min(70, swipe));
    setSwipeOffset(p => ({ ...p, [msgId]: clamped }));
  }, []);

  const onSwipeTouchEnd = useCallback((msgId, msg, e) => {
    const offset = swipeOffset[msgId] || 0;
    if (Math.abs(offset) > 45) {
      setReplyTo(msg);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setSwipeOffset(p => ({ ...p, [msgId]: 0 }));
    delete swipeStartX.current[msgId];
  }, [swipeOffset]);

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
    const t  = setInterval(() => { loadMsgs(activeId, true); loadContacts(true); }, 3000);
    const tp = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/messages/${activeId}/typing-status`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setIsTyping(!!d.isTyping); }
      } catch {}
    }, 2500);
    return () => { clearInterval(t); clearInterval(tp); };
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loadC) setTimeout(() => setReady(true), 80); }, [loadC]);

  // Cleanup recording on unmount
  useEffect(() => () => {
    clearInterval(recTimerRef.current);
    if (mediaRecRef.current) { try { mediaRecRef.current.stop(); } catch {} }
    if (recStreamRef.current) { recStreamRef.current.getTracks().forEach(t => t.stop()); }
  }, []);

  const filteredContacts = contacts.filter(c =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Disappear filter ────────────────────────────────────────────────────────
  const disappearMs = { "24h": 86400000, "7d": 604800000, "90d": 7776000000 }[disappearTimer] || null;
  const visibleMsgs = messages.filter(m =>
    !deletedMsgs.has(m._id) &&
    (!disappearMs || !m.createdAt || Date.now() - new Date(m.createdAt).getTime() < disappearMs)
  );
  const searchMatches = msgSearch
    ? visibleMsgs.filter(m => (m.content || "").toLowerCase().includes(msgSearch.toLowerCase()))
    : [];
  const displayMsgs = msgSearch ? searchMatches : visibleMsgs;
  const safeIdx     = searchMatches.length ? ((searchIdx % searchMatches.length) + searchMatches.length) % searchMatches.length : 0;
  const jumpToSearchResult = (delta) => {
    if (!searchMatches.length) return;
    const next = ((safeIdx + delta) % searchMatches.length + searchMatches.length) % searchMatches.length;
    setSearchIdx(next);
    const target = searchMatches[next];
    if (target) {
      const el = document.getElementById(`msg-${target._id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const grouped = displayMsgs.reduce((acc, msg) => {
    const day = fmtDay(msg.createdAt || Date.now()); if (!acc[day]) acc[day] = []; acc[day].push(msg); return acc;
  }, {});

  const activeName   = activeInfo?.name || activeInfo?.email || "Chat";
  const activeDot    = ROLE_C[activeInfo?.role] || "#6366f1";
  const activeOnline = onlineUsers[activeId] || activeInfo?.isOnline || false;
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  return (
    <>
      <style>{`
        :root{--sk:#e2e8f0;--chat-bg:#f0f4f8;--sidebar-bg:#ffffff;--header-bg:#ffffff;--input-bg:#f8fafc;--input-border:#e2e8f0;--conv-hover:#f1f5f9;--border-color:#e2e8f0;--bubble-other-bg:#ffffff;--bubble-other-color:#0f172a;--text-heading:#0f172a;--text-muted:#64748b;--text-primary:#374151;}
        .dark{--sk:#1e293b;--chat-bg:#0a0f1a;--sidebar-bg:#0f172a;--header-bg:#0f172a;--input-bg:#1e293b;--input-border:#334155;--conv-hover:#1a2234;--border-color:#334155;--bubble-other-bg:#1e293b;--bubble-other-color:#f1f5f9;--text-heading:#f1f5f9;--text-muted:#94a3b8;--text-primary:#e2e8f0;}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes scIn{from{transform:scale(0.95) translateY(14px);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(0.88) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes popUp{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.05)}}
        .msg-b{animation:fd 0.16s ease;}
        .conv-row{transition:background 0.12s;cursor:pointer;}
        .conv-row:hover{background:var(--conv-hover)!important;}
        .conv-row.active-c{background:var(--conv-hover)!important;border-left:3px solid #3b82f6!important;}
        .msg-inp{transition:border-color 0.15s;font-family:inherit;}
        .msg-inp:focus{border-color:#3b82f6!important;outline:none;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}
        .send-btn:disabled{opacity:.4;cursor:not-allowed;}
        .icon-btn:hover{opacity:.75;transform:scale(1.08);}
        .icon-btn{transition:all .15s;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .msg-wrap:hover .msg-actions{opacity:1!important;}
        .typing-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;margin:0 2px;animation:typing 1.2s infinite;}
        .typing-dot:nth-child(2){animation-delay:0.2s}.typing-dot:nth-child(3){animation-delay:0.4s}
        .rec-pulse{animation:recPulse 1s ease infinite;}
        .msg-swipe{transition:transform 0.18s cubic-bezier(.4,0,.2,1);}
        .unread-divider{display:flex;align-items:center;gap:10px;margin:10px 0;}
        .unread-divider::before,.unread-divider::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,#3b82f644,transparent);}
        @keyframes disappearTick{0%{opacity:1}80%{opacity:1}100%{opacity:0}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
      `}</style>

      <div style={{ height: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 112px)", display: "flex", borderRadius: isMobile ? 0 : 20, overflow: "hidden", border: isMobile ? "none" : "1px solid var(--border-color)", boxShadow: isMobile ? "none" : "0 4px 24px rgba(0,0,0,0.07)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ═══════════════ SIDEBAR ═══════════════ */}
        {(isMobile ? showSidebar : true) && (
          <div style={{ width: isMobile ? "100%" : 300, display: "flex", flexDirection: "column", background: "var(--sidebar-bg)", borderRight: isMobile ? "none" : "1px solid var(--border-color)", flexShrink: 0 }}>
            <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading)" }}>Messages</h2>
                <button className="icon-btn" onClick={() => setShowNew(true)} style={{ width: 32, height: 32, borderRadius: 10, background: "#3b82f6", color: "#fff" }}><Plus size={16} /></button>
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
                  {[1,2,3,4].map(i => <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}><Skeleton w={42} h={42} r={21} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Skeleton w="50%" h={12} /><Skeleton w="70%" h={10} /></div></div>)}
                </div>
              ) : (
                <>
                  {pendingInSidebar && (
                    <div className={`conv-row${activeId === contactParam ? " active-c" : ""}`} onClick={() => selectContact(activeInfo)}
                      style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${activeId === contactParam ? "#3b82f6" : "transparent"}` }}>
                      <Avatar user={activeInfo} size={42} online={onlineUsers[activeInfo?._id]} />
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
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-heading)" }}>No conversations yet</p>
                      <p style={{ margin: "6px 0 14px", fontSize: 12 }}>Click + to start a new conversation</p>
                      <button onClick={() => setShowNew(true)} style={{ padding: "9px 18px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ New</button>
                    </div>
                  ) : filteredContacts.map(c => {
                    const isAct    = activeId === c._id;
                    const isOnline = onlineUsers[c._id] || c.isOnline;
                    return (
                      <div key={c._id} className={`conv-row${isAct ? " active-c" : ""}`} onClick={() => selectContact(c)}
                        style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isAct ? "#3b82f6" : "transparent"}` }}>
                        <Avatar user={c} size={42} online={isOnline} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 800 : 600, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name || c.email || "Unknown"}</span>
                            <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, marginLeft: 4 }}>{c.lastMessageAt ? fmt(c.lastMessageAt) : ""}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ margin: 0, fontSize: 12, color: c.unread > 0 ? "var(--text-heading)" : "var(--text-muted)", fontWeight: c.unread > 0 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {isAct && isTyping
                                ? <span style={{ color: "#10b981", fontStyle: "italic" }}>typing…</span>
                                : (() => {
                                    const lm = c.lastMessage || "";
                                    if (!lm || lm === "📎 File") return "📎 File";
                                    if (lm === "📷 Image") return "📷 Image";
                                    if (lm === "🎤 Voice note") return "🎤 Voice note";
                                    if (lm === "🚫 Message deleted") return "🚫 Message deleted";
                                    return lm || "Start chatting…";
                                  })()
                              }
                            </p>
                            {c.unread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4, padding: "0 4px" }}>{c.unread}</span>}
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

        {/* ═══════════════ CHAT AREA ═══════════════ */}
        {(isMobile ? !showSidebar : true) && (
          activeId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--chat-bg)", minWidth: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)", backgroundSize: "20px 20px" }}>

              {/* Header */}
              <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {isMobile && <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)" }}><ChevronLeft size={22} /></button>}
                <div onClick={() => setProfileU(activeInfo)} style={{ cursor: "pointer", position: "relative" }}>
                  <Avatar user={activeInfo} size={isMobile ? 36 : 42} online={activeOnline} />
                  {isTyping && (
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "#10b981", border: "2px solid var(--header-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 8 }}>✍</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setProfileU(activeInfo)}>
                  <p style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    {activeName}
                    {disappearTimer !== "off" && <span title={`Disappearing messages: ${disappearTimer}`} style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", padding: "1px 6px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><Timer size={9} />⏳</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {isTyping
                      ? <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="typing-dot" style={{ background: "#10b981" }} />
                          <span className="typing-dot" style={{ background: "#10b981" }} />
                          <span className="typing-dot" style={{ background: "#10b981" }} />
                          typing…
                        </span>
                      : <span style={{ color: activeOnline ? "#22c55e" : "#94a3b8" }}>
                          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: activeOnline ? "#22c55e" : "#94a3b8", marginRight: 4 }} />
                          {activeOnline ? "Online" : "Offline"}
                        </span>
                    }
                    {!isMobile && <span style={{ color: "var(--text-muted)" }}> · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role}</span></span>}
                  </p>
                </div>
                <button className="icon-btn" onClick={() => setShowDisappearModal(true)}
                  title="Disappearing messages"
                  style={{ width: 32, height: 32, borderRadius: 10, background: disappearTimer !== "off" ? "#fef3c7" : "var(--input-bg)", border: `1px solid ${disappearTimer !== "off" ? "#fde68a" : "var(--border-color)"}` }}>
                  <Timer size={15} style={{ color: disappearTimer !== "off" ? "#d97706" : "var(--text-muted)" }} />
                </button>
                <button className="icon-btn" onClick={() => setShowMsgSrch(p => !p)} style={{ width: 32, height: 32, borderRadius: 10, background: showMsgSrch ? "#eff6ff" : "var(--input-bg)", border: `1px solid ${showMsgSrch ? "#3b82f6" : "var(--border-color)"}` }}>
                  <Search size={14} style={{ color: showMsgSrch ? "#3b82f6" : "var(--text-muted)" }} />
                </button>
                <button className="icon-btn" onClick={() => router.push(`/dashboard/${role}/video-calls?contact=${activeId}`)} style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac" }}>
                  <Video size={14} style={{ color: "#10b981" }} />
                </button>
                <button className="icon-btn" onClick={() => setProfileU(activeInfo)} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                  <User size={14} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {/* ── PINNED MESSAGE BAR ── */}
              {pinnedMsg && (
                <div style={{ padding: "7px 14px", background: "var(--header-bg)", borderBottom: "2px solid #3b82f6", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, cursor: "pointer" }}
                  onClick={() => { const el = document.getElementById(`msg-${pinnedMsg.msg._id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                  <div style={{ width: 3, height: 32, background: "#3b82f6", borderRadius: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📌</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>Pinned Message</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.msg.content || (pinnedMsg.msg.type === "audio" ? "🎤 Voice note" : pinnedMsg.msg.fileUrl ? "📎 File" : "")}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setPinnedMsg(null); setMsgs(p => p.map(m => ({ ...m, pinned: false }))); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4, flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* In-chat search */}
              {showMsgSrch && (
                <div style={{ padding: "8px 16px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input value={msgSearch} onChange={e => { setMsgSearch(e.target.value); setSearchIdx(0); }} placeholder="Search messages…" autoFocus
                      onKeyDown={e => { if (e.key === "Enter") jumpToSearchResult(e.shiftKey ? -1 : 1); }}
                      style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid var(--input-border)", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }} />
                  </div>
                  {msgSearch && searchMatches.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", minWidth: 50, textAlign: "center" }}>{safeIdx + 1} / {searchMatches.length}</span>
                  )}
                  {msgSearch && searchMatches.length === 0 && (
                    <span style={{ fontSize: 11, color: "#ef4444", whiteSpace: "nowrap" }}>No results</span>
                  )}
                  {msgSearch && searchMatches.length > 1 && (
                    <>
                      <button onClick={() => jumpToSearchResult(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--input-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
                      </button>
                      <button onClick={() => jumpToSearchResult(1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--input-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowMsgSrch(false); setMsgSearch(""); setSearchIdx(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={15} /></button>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 8px" : "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}
                onClick={() => { setMenuState(null); setShowEmoji(false); }}>
                {loadM ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[1,2,3,4].map((x, j) => <div key={x} style={{ display: "flex", justifyContent: j % 2 ? "flex-end" : "flex-start" }}><Skeleton w={`${30 + j * 14}%`} h={46} r={14} /></div>)}
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                    <div style={{ fontSize: 52, marginBottom: 12, animation: "pop 0.4s ease" }}>👋</div>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--text-heading)" }}>Say hello to {activeName}!</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Your message will also be sent to their email 📧</p>
                  </div>
                ) : Object.entries(grouped).map(([day, dayMsgs]) => (
                  <div key={day}>
                    <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border-color)" }} />
                      <span style={{ background: "var(--chat-bg)", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                    </div>
                    {dayMsgs.map((msg, i) => {
                      const mine       = String(msg.senderId?._id || msg.senderId) === myId;
                      const rawFileUrl = fixUrl(msg.fileUrl);
                      const fileUrl    = rawFileUrl && (rawFileUrl.startsWith("http://") || rawFileUrl.startsWith("https://")) ? rawFileUrl : null;
                      const msgType    = fileUrl ? (msg.type || "text") : "text";
                      const isImg      = msgType === "image" && !!fileUrl;
                      const isAudio    = msgType === "audio" && !!fileUrl;
                      const reactions  = msg.reactions || {};
                      const hasR       = Object.keys(reactions).length > 0;
                      const isStarred  = starredMsgs.has(msg._id);
                      const urls       = !isAudio && !isImg ? extractUrls(msg.content || "") : [];
                      const isSearchHit = msgSearch && searchMatches[safeIdx]?._id === msg._id;
                      const isUnreadDivider = msg._id === firstUnreadId;
                      const msgSwipe   = swipeOffset[msg._id] || 0;

                      return (
                        <div key={msg._id || i}>
                          {/* ── Unread messages divider ── */}
                          {isUnreadDivider && (
                            <div className="unread-divider" style={{ margin: "12px 0 8px" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                🔵 Unread messages
                              </span>
                            </div>
                          )}
                          <div id={`msg-${msg._id}`} className="msg-wrap"
                            style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: hasR ? 14 : 5, alignItems: "flex-end", gap: 6, position: "relative",
                              outline: isSearchHit ? "2px solid #3b82f6" : "none", borderRadius: 14, transition: "outline 0.2s" }}
                            onTouchStart={e => onSwipeTouchStart(msg._id, e)}
                            onTouchMove={e => onSwipeTouchMove(msg._id, mine, e)}
                            onTouchEnd={e => onSwipeTouchEnd(msg._id, msg, e)}>
                            {!mine && <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{activeName.charAt(0).toUpperCase()}</div>}

                            {/* Swipe reply hint arrow */}
                            {Math.abs(msgSwipe) > 20 && (
                              <div style={{ position: "absolute", [mine ? "right" : "left"]: -32, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, Math.abs(msgSwipe) / 60), transition: "opacity 0.1s" }}>
                                <Reply size={12} style={{ color: "#fff" }} />
                              </div>
                            )}

                            {/* ── Message column (bubble + reactions + timestamp) ── */}
                            <div className="msg-swipe" style={{ maxWidth: isMobile ? "83%" : "65%", display: "flex", flexDirection: "column", transform: `translateX(${msgSwipe}px)` }}>
                              {msg.replyTo && (
                                <div style={{ padding: "5px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.06)", borderLeft: `3px solid ${mine ? "#3b82f6" : "#94a3b8"}`, marginBottom: -2 }}>
                                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    ↩ {(() => {
                                      const c = msg.replyTo.content || "";
                                      if (["Attachment","📎 File","📎 Attachment"].includes(c)) {
                                        return msg.replyTo.type === "audio" ? "🎤 Voice note" : "📎 File";
                                      }
                                      return c || (msg.replyTo.type === "audio" ? "🎤 Voice note" : msg.replyTo.fileUrl ? "📎 File" : "Message");
                                    })()}
                                  </p>
                                </div>
                              )}

                              <div className="msg-b" style={{ padding: isImg ? 4 : isAudio ? "10px 14px" : "9px 13px", borderRadius: msg.replyTo ? (mine ? "0 14px 4px 14px" : "14px 0 14px 4px") : (mine ? "18px 18px 4px 18px" : "4px 18px 18px 18px"), background: mine ? "#3b82f6" : "var(--bubble-other-bg)", color: mine ? "#fff" : "var(--bubble-other-color)", border: mine ? "none" : "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", opacity: msg.pending ? 0.65 : 1 }}>
                                {msg.pinned && <span style={{ fontSize: 10, marginBottom: 3, display: "block", opacity: 0.8, color: mine ? "rgba(255,255,255,0.8)" : "#3b82f6" }}>📌 Pinned</span>}
                                {isStarred  && <span style={{ fontSize: 10, marginBottom: 3, display: "block", opacity: 0.7 }}>⭐ starred</span>}
                                {disappearTimer !== "off" && !msg.pending && (
                                  <span style={{ fontSize: 9, marginBottom: 2, display: "block", opacity: 0.65, color: mine ? "rgba(255,255,255,0.7)" : "#d97706" }}>⏳ Disappearing</span>
                                )}
                                {msg.content && !["📎 File", "📎 Attachment", "Attachment", "🎤 Voice note", "📷 Image"].includes(msg.content.trim()) && (
                                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>
                                    {msgSearch ? msg.content.split(new RegExp(`(${msgSearch})`, "gi")).map((part, idx) =>
                                      part.toLowerCase() === msgSearch.toLowerCase()
                                        ? <mark key={idx} style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{part}</mark> : part
                                    ) : msg.content}
                                    {msg.edited && <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 6, fontStyle: "italic" }}>edited</span>}
                                  </p>
                                )}
                                {/* ── Link previews ── */}
                                {urls.slice(0, 1).map(url => (
                                  <LinkPreviewCard key={url} url={url} mine={mine} />
                                ))}
                                {/* ── Voice note player ── */}
                                {isAudio && fileUrl && (
                                  <VoiceNotePlayer src={fileUrl} mine={mine} duration={msg.voiceDuration || 0} />
                                )}
                                {/* ── Image (with broken-image fallback) ── */}
                                {isImg && fileUrl && (
                                  <ImgBubble src={fileUrl} mine={mine} />
                                )}
                                {/* ── File attachment ── */}
                                {!isImg && !isAudio && fileUrl && (
                                  <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)", marginTop: msg.content ? 6 : 0 }}>
                                    <Download size={14} />
                                    <div style={{ minWidth: 0 }}>
                                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                        {["Attachment","attachment","File","file"].includes(msg.fileName) ? "📎 Download file" : (msg.fileName || "📎 File")}
                                      </p>
                                      <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Tap to open</p>
                                    </div>
                                  </a>
                                )}
                              </div>

                              {/* ── REACTIONS — inline below bubble ── */}
                              {hasR && (
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: -8, paddingTop: 0, justifyContent: mine ? "flex-end" : "flex-start", position: "relative", zIndex: 2, paddingLeft: mine ? 0 : 6, paddingRight: mine ? 6 : 0 }}>
                                  {Object.entries(reactions).map(([emoji, users]) => (
                                    <span key={emoji}
                                      onClick={() => addReaction(msg._id, emoji)}
                                      onContextMenu={e => { e.preventDefault(); setReactSummary({ msgId: msg._id, reactions }); }}
                                      onDoubleClick={() => setReactSummary({ msgId: msg._id, reactions })}
                                      style={{ padding: "2px 7px", borderRadius: 20, background: users.includes(myId) ? "#dbeafe" : "var(--bg-card, #fff)", border: `1.5px solid ${users.includes(myId) ? "#93c5fd" : "rgba(0,0,0,0.12)"}`, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.12)", lineHeight: 1, userSelect: "none", whiteSpace: "nowrap", transition: "transform 0.1s" }}
                                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
                                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                      {emoji}
                                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginLeft: 1 }}>
                                        {users.length > 1 ? users.length : ""}
                                      </span>
                                    </span>
                                  ))}
                                  {/* "See all" hint */}
                                  <span onClick={() => setReactSummary({ msgId: msg._id, reactions })}
                                    style={{ padding: "2px 6px", borderRadius: 20, background: "transparent", border: "1.5px dashed rgba(0,0,0,0.1)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)", display: "inline-flex", alignItems: "center" }}>
                                    <Eye size={10} />
                                  </span>
                                </div>
                              )}

                              {/* ── Timestamp + read receipt ── */}
                              <p style={{ margin: `${hasR ? "6px" : "2px"} 4px 0`, fontSize: 10, color: "var(--text-muted)", textAlign: mine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start", gap: 3 }}>
                                {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                                {mine && !msg.pending && (
                                  <span title={msg.read ? `Seen` : "Delivered"} style={{ display: "flex", alignItems: "center", cursor: "default" }}>
                                    {msg.read
                                      ? <CheckCheck size={11} style={{ color: "#3b82f6" }} />
                                      : <Check size={11} />}
                                  </span>
                                )}
                              </p>
                            </div>

                            {!msg.pending && (
                              <div className="msg-actions" style={{ opacity: 0, display: "flex", alignItems: "center", flexDirection: mine ? "row" : "row-reverse" }}>
                                <button onClick={(e) => { e.stopPropagation(); setMenuState({ msg, x: e.clientX, y: e.clientY }); }}
                                  style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", backdropFilter: "blur(4px)" }}>
                                  <MoreVertical size={13} style={{ color: "#64748b" }} />
                                </button>
                              </div>
                            )}

                            {menuState?.msg._id === msg._id && (
                              <MsgMenu msg={msg} isMine={mine} x={menuState.x} y={menuState.y}
                                onDelete={(mode) => deleteMsg(msg._id, mode)}
                                onEdit={() => { setEditing(msg); setText(msg.content); setTimeout(() => { inputRef.current?.focus(); autoResize(); }, 50); }}
                                onReply={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                                onReact={(emoji) => addReaction(msg._id, emoji)}
                                onCopy={() => navigator.clipboard?.writeText(msg.content || "")}
                                onStar={() => setStarred(p => { const n = new Set(p); n.has(msg._id) ? n.delete(msg._id) : n.add(msg._id); return n; })}
                                onPin={() => { if (msg.pinned) { setMsgs(p => p.map(m => m._id === msg._id ? { ...m, pinned: false } : m)); if (pinnedMsg?.msg._id === msg._id) setPinnedMsg(null); setMenuState(null); } else { setPinTarget(msg); setMenuState(null); } }}
                                onForward={() => { navigator.clipboard?.writeText(msg.content || ""); alert("Message copied — open another chat to forward."); }}
                                onClose={() => setMenuState(null)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeName.charAt(0).toUpperCase()}</div>
                    <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bubble-other-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply/Edit bar */}
              {(replyTo || editingMsg) && (
                <div style={{ padding: "8px 14px", background: editingMsg ? "#fffbeb" : "#eff6ff", borderTop: `1px solid ${editingMsg ? "#fde68a" : "#bfdbfe"}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: editingMsg ? "#d97706" : "#3b82f6" }}>
                      {editingMsg ? "✏️ Editing · expires in 15 min" : `↩ Replying to ${activeInfo?.name || "message"}`}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(() => {
                        const m = editingMsg || replyTo;
                        const c = m?.content || "";
                        if (["Attachment","📎 File","📎 Attachment"].includes(c)) return m?.type === "audio" ? "🎤 Voice note" : "📎 File";
                        return c || (m?.type === "audio" ? "🎤 Voice note" : m?.fileUrl ? "📎 File" : "");
                      })()}
                    </p>
                  </div>
                  <button onClick={cancelAction} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
                </div>
              )}

              {/* ── RECORDING BAR (shown while recording) ── */}
              {recording && (
                <div style={{ padding: "10px 14px", background: "#fff1f2", borderTop: "1px solid #fecdd3", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="rec-pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", flexShrink: 0, display: "block" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", flex: 1 }}>
                    Recording… {fmtDuration(recSeconds)}
                  </span>
                  <button onClick={() => stopRecording(true)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={() => stopRecording(false)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Square size={12} /> Send
                  </button>
                </div>
              )}

              {/* Input bar */}
              {!recording && (
                <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0, position: "relative" }}>
                  {showEmoji && (
                    <div style={{ position: "fixed", bottom: 70, left: isMobile ? 4 : 60, zIndex: 9000 }}>
                      <EmojiPicker onSelect={(e) => setText(p => p + e)} onClose={() => setShowEmoji(false)} />
                    </div>
                  )}
                  <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
                  <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                    {uploading ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Paperclip size={15} style={{ color: "var(--text-muted)" }} />}
                  </button>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setShowEmoji(p => !p); }} style={{ width: 36, height: 36, borderRadius: 10, background: showEmoji ? "#eff6ff" : "var(--input-bg)", border: `1px solid ${showEmoji ? "#3b82f6" : "var(--border-color)"}`, flexShrink: 0 }}>
                    <Smile size={16} style={{ color: showEmoji ? "#3b82f6" : "var(--text-muted)" }} />
                  </button>
                  <textarea ref={inputRef} value={text} onChange={handleTextChange}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMsg ? submitEdit() : sendMsg(); } if (e.key === "Escape") cancelAction(); }}
                    placeholder={editingMsg ? "Edit message… (Esc to cancel)" : replyTo ? `Reply to ${activeInfo?.name || "message"}…` : `Message ${activeName}…`}
                    rows={1} className="msg-inp"
                    style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: `1px solid ${editingMsg ? "#fbbf24" : "var(--input-border)"}`, fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", background: editingMsg ? "#fffbeb" : "var(--input-bg)", color: "var(--text-primary)", fontFamily: "inherit" }} />

                  {/* Mic button — shown when textarea is empty and not editing */}
                  {!text.trim() && !editingMsg && (
                    <button className="icon-btn" onClick={startRecording}
                      style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", flexShrink: 0 }}
                      title="Record voice note">
                      <Mic size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  )}

                  <button onClick={() => editingMsg ? submitEdit() : sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                    style={{ height: 36, padding: "0 16px", borderRadius: 12, background: text.trim() ? (editingMsg ? "#f59e0b" : "#3b82f6") : "var(--input-bg)", color: text.trim() ? "#fff" : "var(--text-muted)", border: text.trim() ? "none" : "1px solid var(--border-color)", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : editingMsg ? <Check size={16} /> : <><Send size={14} />{!isMobile && <span style={{ fontSize: 13 }}>Send</span>}</>}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chat-bg)", flexDirection: "column", gap: 16 }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, animation: "pop 0.4s ease", boxShadow: "0 12px 32px rgba(59,130,246,0.3)" }}>💬</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--text-heading)", fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>Your messages</p>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>{contacts.length > 0 ? "Select a conversation from the sidebar" : "Start your first conversation"}</p>
              </div>
              <button onClick={() => setShowNew(true)} style={{ padding: "11px 24px", borderRadius: 14, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
                <Plus size={16} />New Conversation
              </button>
              {contacts.length > 0 && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{contacts.length} conversation{contacts.length !== 1 ? "s" : ""} in your inbox</p>}
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

      {/* ── PIN DURATION MODAL ── */}
      {pinTarget && (
        <PinDurationModal
          onPin={(duration) => {
            setMsgs(p => p.map(m => ({ ...m, pinned: m._id === pinTarget._id })));
            setPinnedMsg({ msg: pinTarget, duration });
          }}
          onClose={() => setPinTarget(null)}
        />
      )}

      {/* New Conversation Panel */}
      {showNewConv && <NewConvPanel myId={myId} onClose={() => setShowNew(false)} onSelect={(u) => { selectContact(u); }} isMobile={isMobile} />}
    </>
  );
}

// ── New Conversation Panel ────────────────────────────────────────────────────
function NewConvPanel({ myId, onClose, onSelect, isMobile }) {
  const [users,   setUsers]  = useState([]);
  const [search,  setSearch] = useState("");
  const [loading, setL]      = useState(true);

  useEffect(() => {
    (async () => {
      setL(true);
      const merged = new Map();
      const add = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(u => { if (u?._id) merged.set(u._id.toString(), u); });
      };
      try {
        const r = await fetch(`${API}/api/messages/users?limit=500`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); add(d.users); }
      } catch {}
      try {
        const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); add(d.allUsers); add(d.allLawyers); add(d.lawyers); add(d.recentUsers); add(d.myClients); add(d.myLawyers); }
      } catch {}
      try {
        const r = await fetch(`${API}/api/admin/users?limit=500`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); add(d.users); add(d.data); }
      } catch {}
      try {
        const r = await fetch(`${API}/api/lawyers?limit=200`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); add(d.lawyers); }
      } catch {}
      setUsers([...merged.values()]); setL(false);
    })();
  }, []);

  const [roleFilter, setRoleFilter] = useState("all");
  const filtered = users.filter(u => {
    if (u._id === myId) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });
  const counts = { all: users.filter(u => u._id !== myId).length, client: 0, lawyer: 0, admin: 0 };
  users.forEach(u => { if (u._id !== myId && counts[u.role] !== undefined) counts[u.role]++; });
  const tabs = [{ key:"all",label:"All",color:"#6366f1"},{ key:"client",label:"Clients",color:"#3b82f6"},{ key:"lawyer",label:"Lawyers",color:"#10b981"},{ key:"admin",label:"Admins",color:"#ef4444"}];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: isMobile ? "100%" : 320, height: "100vh", background: "var(--sidebar-bg,#fff)", display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.14)", animation: "slideIn 0.25s ease" }}>
        <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid var(--border-color,#e2e8f0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>New Conversation</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted,#94a3b8)" }}>{loading ? "Loading users…" : `${counts.all} users · ${counts.client} clients · ${counts.lawyer} lawyers`}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#64748b)", display: "flex" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setRoleFilter(t.key)}
                style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${roleFilter === t.key ? t.color : "var(--border-color,#e2e8f0)"}`, background: roleFilter === t.key ? `${t.color}15` : "transparent", color: roleFilter === t.key ? t.color : "var(--text-muted,#94a3b8)", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                {t.label} {counts[t.key] > 0 ? `(${counts[t.key]})` : ""}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted,#94a3b8)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role…" autoFocus
              style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}><Skeleton w={36} h={36} r={18} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Skeleton w="55%" h={11} /><Skeleton w="75%" h={9} /></div></div>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 14px", textAlign: "center", color: "var(--text-muted,#94a3b8)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No users found</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>Try searching by name, email or role</p>
            </div>
          ) : filtered.map(u => {
            const rc = ROLE_C[u.role] || "#6366f1";
            return (
              <div key={u._id} onClick={() => { onSelect(u); onClose(); }}
                style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar user={u} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#94a3b8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100vh - 112px)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <MessagesContent />
    </Suspense>
  );
}