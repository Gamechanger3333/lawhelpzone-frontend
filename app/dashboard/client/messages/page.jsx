"use client";
// v2026-03-14-FIXED
// Fixes applied:
// 1. ✅ "Attachment" label removed from all messages
// 2. ✅ Voice notes: recording timer visible from 0:00, proper WhatsApp-style waveform
// 3. ✅ Voice notes: base64 audio sends + plays correctly (no 404)
// 4. ✅ Search bar is STICKY — stays visible when scrolling messages
// 5. ✅ Header always visible and sticky
// 6. ✅ Audio bubble plays without errors, shows real elapsed/duration

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Video, X, Send, Paperclip, Smile, Search, Plus,
  ChevronLeft, Edit2, Trash2, Reply, MoreVertical,
  Check, CheckCheck, Download, Star, Copy, AlertCircle, User, Mic, Pin
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const fixUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return url; // base64 — return as-is
  if (url.startsWith("http://localhost:5000") || url.startsWith("http://localhost:3000"))
    return url.replace(/http:\/\/localhost:\d+/, API);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${API}${url}`;
  return null;
};

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };

const EMOJI_CATS = {
  "😊 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😚","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 People":  ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🩸"],
  "❤️ Hearts":  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🪬"],
  "🎉 Fun":     ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🥊","🎽","🛹","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  "🍎 Food":    ["🍎","🍊","🍋","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥒","🌶️","🧄","🥔","🥐","🍞","🧀","🥚","🍳","🥞","🧇","🥓","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🧁","🍰","🎂","🍭","🍬","🍫","🍿","🍩","🍪","🥤","🧋","🍵","☕","🍺","🥂","🍾"],
  "✈️ Travel":  ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🛻","🚚","🚛","🏍️","🛵","🚲","🛴","✈️","🚀","🛸","🚁","⛵","🚢","🚂","🏔️","⛰️","🌋","🏕️","🏖️","🏜️","🏝️","🏟️","🏛️","🏗️","🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","⛩️","🗺️","🧭","🌍","🌎","🌏"],
  "💼 Objects": ["⌚","📱","💻","🖥️","⌨️","🖱️","💾","💿","📀","📷","📸","📹","🎥","📞","☎️","📟","📺","📻","🔋","🔌","💡","🔦","🕯️","💰","💵","💳","🪙","✉️","📧","📝","📁","📂","📊","📋","📌","📍","📎","✂️","🔒","🔓","🔑","🗝️","🔨","🛠️","⚙️","🔧","🔩","🧲","💣","🧱","🛋️","🚪","🛏️","🛁","🚿","🧴","🧹","🧺","🧻","🧼","🛒"],
  "🌟 Symbols": ["❗","❓","‼️","⁉️","💯","♻️","✅","❎","🆗","🆙","🆒","🆕","🆓","⛔","🚫","☢️","☣️","⬆️","➡️","⬇️","⬅️","↕️","↔️","↩️","↪️","🔃","🔄","🔔","🔕","📢","📣","💬","💭","🗯️","▶️","⏩","◀️","⏪","🔼","🔽","⏸️","⏹️","⏺️","🎦","🔇","🔈","🔉","🔊"],
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
const canEdit              = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
const canDeleteForEveryone = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 60 * 1000;

// ── Format seconds as M:SS ────────────────────────────────────────────────────
const fmtSec = (s) => {
  const n = (!s || !isFinite(s) || isNaN(s)) ? 0 : Math.max(0, s);
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
};

function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "var(--sk,#e2e8f0)", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

function Avatar({ user: u, size = 40, online }) {
  const bg     = ROLE_C[u?.role] || "#6366f1";
  const imgSrc = fixUrl(u?.profileImage);
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {imgSrc ? <img src={imgSrc} style={{ width: size, height: size, objectFit: "cover" }} alt="" onError={e => { e.target.style.display = "none"; }} /> : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
      </div>
      {online !== undefined && (
        <span style={{ position: "absolute", bottom: 1, right: 1, width: Math.max(size * 0.24, 8), height: Math.max(size * 0.24, 8), borderRadius: "50%", background: online ? "#22c55e" : "#94a3b8", border: "2px solid var(--sidebar-bg,#fff)" }} />
      )}
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
            {u.profileImage ? <img src={fixUrl(u.profileImage)} style={{ width: 80, height: 80, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{u.name || "User"}</p>
            <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text-muted,#64748b)" }}>{u.email}</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role || "user"}</span>
          </div>
          {u.phone && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📞 {u.phone}</p>}
          {u.city  && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)" }}>📍 {u.city}{u.country ? `, ${u.country}` : ""}</p>}
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

function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab]       = useState(Object.keys(EMOJI_CATS)[0]);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const results = search ? Object.values(EMOJI_CATS).flat().filter(() => true) : null;
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
            <button key={cat} onClick={() => setTab(cat)} style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: tab === cat ? "#eff6ff" : "transparent", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>{cat.split(" ")[0]}</button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {!search && <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{tab.split(" ").slice(1).join(" ")}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {(search ? Object.values(EMOJI_CATS).flat() : EMOJI_CATS[tab] || []).map((e, i) => (
            <button key={`${e}-${i}`} onClick={() => onSelect(e)}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s, transform 0.1s" }}
              onMouseEnter={el => { el.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"; el.currentTarget.style.transform = "scale(1.2)"; }}
              onMouseLeave={el => { el.currentTarget.style.background = "transparent"; el.currentTarget.style.transform = "scale(1)"; }}>
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp-style Audio Bubble ───────────────────────────────────────────────
function AudioBubble({ src, mine }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [loadErr,  setLoadErr]  = useState(false);
  const audioRef = useRef(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || loadErr) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      a.play().then(() => setPlaying(true)).catch(err => {
        console.error("Audio play error:", err);
        setLoadErr(true); setPlaying(false);
      });
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd    = () => { setPlaying(false); setProgress(0); setElapsed(0); a.currentTime = 0; };
    const onTime   = () => {
      if (a.duration && isFinite(a.duration) && a.duration > 0) {
        setProgress(a.currentTime / a.duration * 100);
        setElapsed(a.currentTime);
      }
    };
    const onLoaded = () => { if (a.duration && isFinite(a.duration)) setDuration(a.duration); };
    const onErr    = () => { setLoadErr(true); setPlaying(false); };
    a.addEventListener("ended",          onEnd);
    a.addEventListener("timeupdate",     onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("durationchange", onLoaded);
    a.addEventListener("error",          onErr);
    try { a.load(); } catch {}
    return () => {
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("durationchange", onLoaded);
      a.removeEventListener("error", onErr);
    };
  }, [src]);

  const BARS = 30;
  const barH = Array.from({ length: BARS }, (_, i) => 20 + Math.abs(Math.sin(i * 1.9) * 60 + Math.cos(i * 0.8) * 30));
  const fillColor  = mine ? "rgba(255,255,255,0.9)" : "#25d366";
  const emptyColor = mine ? "rgba(255,255,255,0.35)" : "#c8e6c9";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220, maxWidth: 270, padding: "2px 0" }}>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        style={{ display: "none" }}
        onError={() => setLoadErr(true)}
      />
      {/* Play/Pause button */}
      <button onClick={toggle}
        style={{ width: 40, height: 40, borderRadius: "50%", border: "none",
          background: loadErr ? (mine ? "rgba(255,255,255,0.15)" : "#fee2e2") : mine ? "rgba(255,255,255,0.25)" : "#e8f5e9",
          cursor: loadErr ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.1s" }}
        onMouseEnter={e => { if (!loadErr) e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        {loadErr
          ? <span style={{ fontSize: 14 }}>⚠️</span>
          : playing
          ? <span style={{ display: "flex", gap: 2.5, alignItems: "flex-end", height: 16 }}>
              <span style={{ width: 3, height: 16, background: mine ? "#fff" : "#25d366", borderRadius: 2, display: "block" }} />
              <span style={{ width: 3, height: 16, background: mine ? "#fff" : "#25d366", borderRadius: 2, display: "block" }} />
            </span>
          : <span style={{ fontSize: 16, marginLeft: 3, color: mine ? "#fff" : "#25d366" }}>▶</span>}
      </button>

      {/* Waveform + time */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Waveform bars — clickable scrubber */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 1.5, height: 28, cursor: "pointer" }}
          onClick={e => {
            const a = audioRef.current;
            if (!a || !a.duration || !isFinite(a.duration)) return;
            const r = e.currentTarget.getBoundingClientRect();
            a.currentTime = (e.clientX - r.left) / r.width * a.duration;
          }}>
          {barH.map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 2, minWidth: 2,
              height: `${h}%`, maxHeight: 26,
              background: (i / BARS * 100) <= progress ? fillColor : emptyColor,
              transition: "background 0.1s"
            }} />
          ))}
        </div>
        {/* Time display */}
        <span style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.75)" : "#666", fontWeight: 600, userSelect: "none" }}>
          {playing || elapsed > 0 ? fmtSec(elapsed) : (duration > 0 ? fmtSec(duration) : "0:00")}
        </span>
      </div>
    </div>
  );
}

// ── Message Context Menu ──────────────────────────────────────────────────────
function MsgMenu({ msg, isMine, onDelete, onEdit, onReply, onReact, onCopy, onStar, onClose, x, y }) {
  const ref = useRef(null);
  const [showAllEmoji,    setShowAllEmoji]    = useState(false);
  const [emojiSearch,     setEmojiSearch]     = useState("");
  const [activeEmojiCat,  setActiveEmojiCat]  = useState(Object.keys(EMOJI_CATS)[0]);

  const editExpired           = !canEdit(msg);
  const deleteEveryoneExpired = !canDeleteForEveryone(msg);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuW = showAllEmoji ? 320 : 240;
  const menuH = showAllEmoji ? 440 : 330;
  const safeX = typeof window !== "undefined" ? Math.min(x, window.innerWidth  - menuW - 12) : x;
  const safeY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - menuH - 12) : y;

  const BG = "#ffffff", BORDER = "#eef2f7", HOVER = "#f1f5f9", TXT = "#0f172a", MUTED = "#64748b", DIM = "#b8c4cf", RED = "#ef4444";

  const item = (icon, label, action, color = TXT, disabled = false) => (
    <button onClick={() => { if (!disabled) { action(); onClose(); } }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13.5, color: disabled ? DIM : color, fontWeight: 500, textAlign: "left", transition: "background 0.12s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <span style={{ display: "flex", opacity: disabled ? 0.35 : 1 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {disabled && <AlertCircle size={11} style={{ color: DIM, flexShrink: 0 }} />}
    </button>
  );

  // emoji grid displayed inside full picker
  const displayEmojis = emojiSearch
    ? Object.values(EMOJI_CATS).flat()
    : (EMOJI_CATS[activeEmojiCat] || []);

  return (
    <div ref={ref} style={{
      position: "fixed", left: safeX, top: safeY, zIndex: 9999,
      background: BG, borderRadius: 18,
      boxShadow: "0 16px 56px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
      border: `1px solid ${BORDER}`, width: menuW,
      height: showAllEmoji ? menuH : "auto",
      overflow: "hidden", animation: "popIn 0.15s ease",
      display: "flex", flexDirection: "column",
      transition: "width 0.18s ease, height 0.18s ease"
    }}>

      {showAllEmoji ? (
        /* ── Full Emoji Picker ── */
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 6px", borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={() => { setShowAllEmoji(false); setEmojiSearch(""); }}
              style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: HOVER, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, color: TXT, fontWeight: 700 }}>
              ‹
            </button>
            <input
              value={emojiSearch}
              onChange={e => setEmojiSearch(e.target.value)}
              placeholder="Search emoji…"
              autoFocus
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, outline: "none", background: "#f8fafc", color: TXT }}
            />
          </div>
          {/* Category tabs */}
          {!emojiSearch && (
            <div style={{ display: "flex", overflowX: "auto", padding: "5px 6px 3px", gap: 1, scrollbarWidth: "none", borderBottom: `1px solid ${BORDER}` }}>
              {Object.keys(EMOJI_CATS).map(cat => (
                <button key={cat} onClick={() => setActiveEmojiCat(cat)} title={cat}
                  style={{ flexShrink: 0, width: 30, height: 28, borderRadius: 7, border: "none", background: activeEmojiCat === cat ? HOVER : "transparent", fontSize: 16, cursor: "pointer", outline: activeEmojiCat === cat ? `2px solid #3b82f6` : "none" }}>
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
          {/* Emoji grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px", display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 2 }}>
            {displayEmojis.map((e, i) => (
              <button key={`${e}-${i}`} onClick={() => { onReact(e); onClose(); }}
                style={{ width: "100%", aspectRatio: "1", border: "none", background: "transparent", fontSize: 20, cursor: "pointer", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s, transform 0.1s" }}
                onMouseEnter={ev => { ev.currentTarget.style.background = HOVER; ev.currentTarget.style.transform = "scale(1.3)"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.transform = "scale(1)"; }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Default Menu ── */
        <>
          {/* Quick reactions row + ➕ button */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 8px 8px", borderBottom: `1px solid ${BORDER}`, gap: 2 }}>
            <div style={{ display: "flex", overflowX: "auto", flex: 1, gap: 1, scrollbarWidth: "none" }}>
              {QUICK_REACTIONS.map(r => (
                <button key={r} onClick={() => { onReact(r); onClose(); }}
                  style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", fontSize: 20, cursor: "pointer", transition: "transform 0.12s, background 0.12s" }}
                  onMouseEnter={ev => { ev.currentTarget.style.transform = "scale(1.4)"; ev.currentTarget.style.background = HOVER; }}
                  onMouseLeave={ev => { ev.currentTarget.style.transform = "scale(1)"; ev.currentTarget.style.background = "transparent"; }}>
                  {r}
                </button>
              ))}
            </div>
            {/* ✅ + button opens full emoji picker */}
            <button
              onClick={e => { e.stopPropagation(); setShowAllEmoji(true); }}
              title="More reactions"
              style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${BORDER}`, background: "#f1f5f9", fontSize: 20, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", transition: "background 0.12s", lineHeight: 1 }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#e2e8f0"; ev.currentTarget.style.transform = "scale(1.15)"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "#f1f5f9"; ev.currentTarget.style.transform = "scale(1)"; }}>
              ＋
            </button>
          </div>
          {item(<Reply size={15} />,  "Reply",        onReply,           TXT)}
          {item(<Copy  size={15} />,  "Copy",         onCopy,            TXT)}
          {item(<Star  size={15} />,  "Star message", onStar,            TXT)}
          {isMine && item(<Edit2 size={15} />, editExpired ? "Edit (expired)" : "Edit", onEdit, editExpired ? MUTED : TXT, editExpired)}
          <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
          {item(<Trash2 size={15} />, "Delete for me",       () => onDelete("me"),       RED)}
          {isMine && item(<Trash2 size={15} />, deleteEveryoneExpired ? "Delete for everyone (exp.)" : "Delete for everyone", () => onDelete("everyone"), RED, deleteEveryoneExpired)}
        </>
      )}
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

// ── New Conversation Panel ────────────────────────────────────────────────────
function NewConvPanel({ myId, onClose, onSelect, isMobile }) {
  const [users,   setUsers]  = useState([]);
  const [search,  setSearch] = useState("");
  const [loading, setL]      = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setL(true);
      const merged = new Map();
      const add = (arr) => { if (!Array.isArray(arr)) return; arr.forEach(u => { if (u?._id) merged.set(u._id.toString(), u); }); };
      try { const r = await fetch(`${API}/api/messages/users?limit=500`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.users); } } catch {}
      try { const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.allUsers); add(d.allLawyers); } } catch {}
      try { const r = await fetch(`${API}/api/lawyers?limit=200`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.lawyers); } } catch {}
      setUsers([...merged.values()]);
      setL(false);
    })();
  }, []);

  const filtered = users.filter(u => {
    if (u._id === myId) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });
  const counts = { all: users.filter(u => u._id !== myId).length, client: 0, lawyer: 0, admin: 0 };
  users.forEach(u => { if (u._id !== myId && counts[u.role] !== undefined) counts[u.role]++; });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: isMobile ? "100%" : 320, height: "100vh", background: "var(--sidebar-bg,#fff)", display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.14)", animation: "slideIn 0.25s ease" }}>
        <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid var(--border-color,#e2e8f0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>New Conversation</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted,#94a3b8)" }}>{loading ? "Loading users…" : `${counts.all} users`}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#64748b)", display: "flex" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["all","All"],["client","Clients"],["lawyer","Lawyers"],["admin","Admins"]].map(([k, l]) => (
              <button key={k} onClick={() => setRoleFilter(k)}
                style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${roleFilter === k ? "#3b82f6" : "var(--border-color,#e2e8f0)"}`, background: roleFilter === k ? "#eff6ff" : "transparent", color: roleFilter === k ? "#3b82f6" : "var(--text-muted,#94a3b8)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {l} {counts[k] > 0 ? `(${counts[k]})` : ""}
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MESSAGES COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
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

  // ── Voice recording state ────────────────────────────────────────────────────
  const [recording,   setRecording]  = useState(false);
  const [recSeconds,  setRecSeconds] = useState(0);
  const mediaRecRef   = useRef(null);
  const recStreamRef  = useRef(null);
  const recTimerRef   = useRef(null);
  const audioChunks   = useRef([]);

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const inputRef   = useRef(null);
  const typingRef  = useRef(null);
  const scrollRef  = useRef(null);

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

  const fetchUserInfo = useCallback(async (id) => {
    for (const url of [`${API}/api/users/${id}`, `${API}/api/lawyers/${id}`, `${API}/api/admin/users/${id}`]) {
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
        const d = await r.json(); setMsgs(d.messages || []);
        if (!silent) fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, []);

  const deleteMsg = useCallback(async (msgId, mode) => {
    setDeleted(p => new Set([...p, msgId]));
    if (mode === "everyone") {
      try { await fetch(`${API}/api/messages/${msgId}`, { method: "DELETE", credentials: "include", headers: HJ() }); }
      catch { setDeleted(p => { const n = new Set(p); n.delete(msgId); return n; }); }
    }
  }, []);

  const submitEdit = useCallback(async () => {
    if (!editingMsg || !text.trim()) return;
    if (!canEdit(editingMsg)) { alert("Edit window has expired (15 minutes)."); return; }
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

  const sendMsg = useCallback(async (attachment = null) => {
    const content = text.trim();
    if (!content && !attachment) return;
    if (editingMsg) { submitEdit(); return; }
    const receiverId = activeId || contactParam;
    if (!receiverId) return;

    setText(""); setReplyTo(null); setSend(true); setShowEmoji(false);
    setTimeout(() => autoResize(), 0);

    const opt = {
      _id: `opt-${Date.now()}`, senderId: myId, receiverId,
      content, createdAt: new Date().toISOString(), pending: true,
      ...(replyTo ? { replyTo: { _id: replyTo._id, content: replyTo.content } } : {}),
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: attachment.msgType || ((attachment.type || "").startsWith("audio/") ? "audio" : (attachment.type || "").startsWith("image/") ? "image" : "file") } : {}),
    };
    setMsgs(p => [...p, opt]);

    try {
      const body = { receiverId };
      if (content)    body.content  = content;
      if (replyTo)    body.replyToId = replyTo._id;
      if (attachment) {
        body.fileUrl  = attachment.url;
        body.fileName = attachment.name;
        body.type     = attachment.msgType || ((attachment.type || "").startsWith("audio/") ? "audio" : (attachment.type || "").startsWith("image/") ? "image" : "file");
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
  }, [text, activeId, contactParam, myId, replyTo, editingMsg, submitEdit, autoResize]);

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

  // ── Voice Recording — WhatsApp style ─────────────────────────────────────────
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) { alert("Voice recording not supported on this browser."); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      audioChunks.current  = [];

      // Find best supported MIME type
      const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg","audio/mp4",""]
        .find(t => { try { return !t || MediaRecorder.isTypeSupported(t); } catch { return false; } }) || "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      mr.ondataavailable = (e) => { if (e.data?.size > 0) audioChunks.current.push(e.data); };

      mr.onstop = async () => {
        recStreamRef.current?.getTracks().forEach(t => t.stop());
        recStreamRef.current = null;
        if (!audioChunks.current.length) return;
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(audioChunks.current, { type });
        audioChunks.current = [];
        if (blob.size < 200) return;

        // Convert to base64 so it works without server filesystem
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          if (!dataUrl?.startsWith("data:")) return;
          const receiverId = activeId || contactParam;
          if (!receiverId) return;

          const ext     = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "mp4" : "webm";
          const fileName= `voice-${Date.now()}.${ext}`;

          setSend(true);
          const optId  = `opt-${Date.now()}`;
          const optMsg = { _id: optId, senderId: myId, receiverId, fileUrl: dataUrl, fileName, type: "audio", content: "", createdAt: new Date().toISOString(), pending: true };
          setMsgs(p => [...p, optMsg]);

          try {
            const body = { receiverId, fileUrl: dataUrl, fileName, type: "audio", content: "" };
            const r = await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
            if (r.ok) {
              const d = await r.json();
              setMsgs(p => p.map(m => m._id === optId ? (d.message || d) : m));
              loadContacts(true);
            } else {
              setMsgs(p => p.filter(m => m._id !== optId));
              console.error("Voice note send failed:", await r.text());
            }
          } catch (err) {
            setMsgs(p => p.filter(m => m._id !== optId));
            console.error("Voice note send error:", err);
          } finally { setSend(false); }
        };
        reader.readAsDataURL(blob);
      };

      mr.start(100); // collect chunks every 100ms
      mediaRecRef.current = mr;
      setRecording(true);
      setRecSeconds(0); // start from 0
      recTimerRef.current = setInterval(() => setRecSeconds(p => p + 1), 1000);

    } catch (err) {
      console.error("Mic error:", err);
      setRecording(false); setRecSeconds(0);
      if (err.name === "NotAllowedError") alert("Microphone permission denied.");
      else if (err.name === "NotFoundError") alert("No microphone found on this device.");
      else alert("Could not start recording: " + err.message);
    }
  };

  const stopRecording = () => {
    clearInterval(recTimerRef.current);
    setRecording(false); setRecSeconds(0);
    if (mediaRecRef.current?.state !== "inactive") {
      try { mediaRecRef.current.stop(); } catch {}
    }
    mediaRecRef.current = null;
  };

  const cancelRecording = () => {
    clearInterval(recTimerRef.current);
    if (mediaRecRef.current) {
      mediaRecRef.current.ondataavailable = null;
      mediaRecRef.current.onstop          = null;
      try { if (mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop(); } catch {}
      mediaRecRef.current = null;
    }
    recStreamRef.current?.getTracks().forEach(t => t.stop());
    recStreamRef.current = null;
    audioChunks.current  = [];
    setRecording(false); setRecSeconds(0);
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase())
  );
  const visibleMsgs = messages.filter(m => !deletedMsgs.has(m._id));
  const displayMsgs = msgSearch ? visibleMsgs.filter(m => (m.content || "").toLowerCase().includes(msgSearch.toLowerCase())) : visibleMsgs;
  const grouped = displayMsgs.reduce((acc, msg) => {
    const day = fmtDay(msg.createdAt || Date.now()); if (!acc[day]) acc[day] = []; acc[day].push(msg); return acc;
  }, {});

  const activeName   = activeInfo?.name || activeInfo?.email || "Chat";
  const activeDot    = ROLE_C[activeInfo?.role] || "#6366f1";
  const activeOnline = onlineUsers[activeId] || activeInfo?.isOnline || false;
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  // ── Determine if a message contains audio ─────────────────────────────────
  const isAudioMsg = (msg) => {
    if (!msg.fileUrl) return false;
    if (msg.type === "audio" || (msg.type || "").startsWith("audio/")) return true;
    if (/\.(webm|ogg|mp3|wav|m4a)$/i.test(msg.fileName || "")) return true;
    if ((msg.fileUrl || "").startsWith("data:audio")) return true;
    if (/\.(webm|ogg|mp3|wav|m4a)(\?|$)/i.test(msg.fileUrl || "")) return true;
    // Old DB: fileName or content was a voice placeholder — treat as audio
    const voiceRe = /^(voice\s*(message|note|recording)?|🎤|🔊|sent\s+a\s+voice)/i;
    if (voiceRe.test((msg.fileName || "").trim())) return true;
    if (voiceRe.test((msg.content || "").trim())) return true;
    return false;
  };

  // ── ALL placeholder strings that must NEVER show as bubble text ─────────
  // Covers backend-generated labels in any casing/emoji variant
  const ATTACHMENT_STRINGS = new Set([
    // generic file labels
    "attachment","📎 attachment","📎 file","file","📁 file",
    // voice / audio labels — ALL CASES
    "voice message","Voice message","Voice Message","VOICE MESSAGE",
    "🎤 voice message","🎤 voice note","🎤 voice","🎤",
    "voice note","Voice note","Voice Note",
    "voice recording","Voice recording","Voice Recording",
    "voice","audio","🔊","🎙️",
    // misc
    "sent a file","sent an attachment","sent a voice note","sent a voice message",
  ]);
  // Case-insensitive check so any capitalisation is caught
  const isPlaceholder = (s) => {
    if (!s) return true;
    const t = s.trim();
    if (!t) return true;
    if (ATTACHMENT_STRINGS.has(t)) return true;           // exact match
    if (ATTACHMENT_STRINGS.has(t.toLowerCase())) return true; // lowercase match
    // regex covers partial patterns
    if (/^(voice\s*(message|note|recording)?|🎤|🔊|📎\s*(file|attachment)?|attachment)$/i.test(t)) return true;
    return false;
  };
  const cleanContent = (content) => isPlaceholder(content) ? "" : content;
  const cleanFileName = (name) => {
    if (!name || isPlaceholder(name)) return "📎 Download file";
    return name;
  };

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
        @keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)}}
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
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
      `}</style>

      <div style={{ height: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 112px)", display: "flex", borderRadius: isMobile ? 0 : 20, overflow: "hidden", border: isMobile ? "none" : "1px solid var(--border-color)", boxShadow: isMobile ? "none" : "0 4px 24px rgba(0,0,0,0.07)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ═══════════ SIDEBAR ═══════════ */}
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
                              {isAct && isTyping ? <span style={{ color: "#10b981", fontStyle: "italic" }}>typing…</span>
                                : c.lastMessage === "🚫 Message deleted" ? "🚫 Message deleted"
                                : c.lastMessage || "Start chatting…"}
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

        {/* ═══════════ CHAT AREA ═══════════ */}
        {(isMobile ? !showSidebar : true) && (
          activeId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--chat-bg)", minWidth: 0 }}>

              {/* ── STICKY HEADER ── */}
              <div style={{ padding: isMobile ? "10px 12px" : "12px 20px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", zIndex: 10 }}>
                {isMobile && <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-muted)" }}><ChevronLeft size={22} /></button>}
                <div onClick={() => setProfileU(activeInfo)} style={{ cursor: "pointer" }}>
                  <Avatar user={activeInfo} size={isMobile ? 36 : 42} online={activeOnline} />
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setProfileU(activeInfo)}>
                  <p style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeName}</p>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                    {isTyping ? <span style={{ color: "#10b981" }}>typing…</span> : <span style={{ color: activeOnline ? "#22c55e" : "#94a3b8" }}>{activeOnline ? "● Online" : "● Offline"}</span>}
                    {!isMobile && <span style={{ color: "var(--text-muted)" }}> · <span style={{ textTransform: "capitalize" }}>{activeInfo?.role}</span></span>}
                  </p>
                </div>
                {/* Search toggle */}
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

              {/* ── STICKY SEARCH BAR — shown below header when activated ── */}
              {showMsgSrch && (
                <div style={{
                  padding: "8px 14px",
                  background: "var(--header-bg)",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex", gap: 8, alignItems: "center",
                  flexShrink: 0,
                  /* STICKY: stays at top of scrollable area */
                  position: "sticky", top: 0, zIndex: 9
                }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      value={msgSearch}
                      onChange={e => setMsgSearch(e.target.value)}
                      placeholder="Search messages…"
                      autoFocus
                      onKeyDown={e => { if (e.key === "Escape") { setShowMsgSrch(false); setMsgSearch(""); } }}
                      style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid var(--input-border)", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }}
                    />
                  </div>
                  {msgSearch && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {displayMsgs.length} result{displayMsgs.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <button onClick={() => { setShowMsgSrch(false); setMsgSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={15} /></button>
                </div>
              )}

              {/* ── MESSAGES SCROLL AREA ── */}
              <div
                ref={scrollRef}
                style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 8px" : "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}
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
                    {/* Day separator */}
                    <div style={{ textAlign: "center", margin: "14px 0 10px", position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border-color)" }} />
                      <span style={{ background: "var(--chat-bg)", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, position: "relative", zIndex: 1 }}>{day}</span>
                    </div>

                    {dayMsgs.map((msg, i) => {
                      const mine     = String(msg.senderId?._id || msg.senderId) === myId;
                      const rawUrl   = msg.fileUrl?.startsWith("data:") ? msg.fileUrl : fixUrl(msg.fileUrl);
                      const fileUrl  = rawUrl && (rawUrl.startsWith("http") || rawUrl.startsWith("data:")) ? rawUrl : null;
                      const isAudio  = fileUrl && isAudioMsg(msg);
                      const isImg    = fileUrl && !isAudio && (msg.type === "image" || /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || ""));
                      // ✅ CLEAN content — remove "Attachment" labels
                      const content  = cleanContent(msg.content);
                      const reactions= msg.reactions || {};
                      const hasR     = Object.keys(reactions).length > 0;
                      const isStarred= starredMsgs.has(msg._id);

                      // WhatsApp-style: audio = green tinted bubble (sent), white bubble (received)
                      const bubbleBg = mine
                        ? (isAudio ? "#005c4b" : "#3b82f6")
                        : (isAudio ? "#f0fdf4" : "var(--bubble-other-bg)");
                      const bubbleColor = mine ? "#fff" : "var(--bubble-other-color)";

                      return (
                        <div key={msg._id || i} id={`msg-${msg._id}`} className="msg-wrap"
                          style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 5, alignItems: "flex-end", gap: 6, position: "relative" }}>

                          {!mine && (
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {activeName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div style={{ maxWidth: isMobile ? "83%" : "65%", display: "flex", flexDirection: "column" }}>
                            {/* Reply quote */}
                            {msg.replyTo && (
                              <div style={{ padding: "5px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.06)", borderLeft: `3px solid ${mine ? "#3b82f6" : "#94a3b8"}`, marginBottom: -2 }}>
                                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↩ {msg.replyTo.content || "Voice message"}</p>
                              </div>
                            )}

                            {/* Bubble */}
                            <div className="msg-b" style={{
                              padding: isImg ? 4 : "9px 13px",
                              borderRadius: msg.replyTo ? (mine ? "0 14px 4px 14px" : "14px 0 14px 4px") : (mine ? "18px 18px 4px 18px" : "4px 18px 18px 18px"),
                              background: bubbleBg,
                              color: bubbleColor,
                              border: mine ? "none" : (isAudio ? "1px solid #86efac" : "1px solid var(--border-color)"),
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              opacity: msg.pending ? 0.65 : 1
                            }}>
                              {isStarred && <span style={{ fontSize: 10, marginBottom: 3, display: "block", opacity: 0.7 }}>⭐ starred</span>}

                              {/* ✅ Text content — only shown if not empty/attachment string */}
                              {content && (
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", color: bubbleColor }}>
                                  {msgSearch ? content.split(new RegExp(`(${msgSearch})`, "gi")).map((part, idx) =>
                                    part.toLowerCase() === msgSearch.toLowerCase()
                                      ? <mark key={idx} style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{part}</mark> : part
                                  ) : content}
                                  {msg.edited && <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 6, fontStyle: "italic" }}>edited</span>}
                                </p>
                              )}

                              {/* ✅ Audio bubble — WhatsApp style */}
                              {fileUrl && isAudio && (
                                <AudioBubble src={fileUrl} mine={mine} />
                              )}

                              {/* Image */}
                              {fileUrl && !isAudio && isImg && (
                                <a href={fileUrl} target="_blank" rel="noreferrer">
                                  <img src={fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: isMobile ? 180 : 240, maxHeight: 220, borderRadius: 12, display: "block", objectFit: "cover", marginTop: content ? 6 : 0 }} />
                                </a>
                              )}

                              {/* File download — no "Voice message" / "Attachment" label */}
                              {fileUrl && !isAudio && !isImg && (
                                <a href={fileUrl} target="_blank" rel="noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)", marginTop: content ? 6 : 0 }}>
                                  <Download size={14} />
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{cleanFileName(msg.fileName)}</p>
                                    <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Tap to open</p>
                                  </div>
                                </a>
                              )}
                            </div>

                            {/* Reactions */}
                            {hasR && (
                              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4, justifyContent: mine ? "flex-end" : "flex-start" }}>
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                                    style={{ padding: "2px 7px", borderRadius: 12, background: users.includes(myId) ? "#dbeafe" : "rgba(255,255,255,0.9)", border: `1px solid ${users.includes(myId) ? "#93c5fd" : "rgba(0,0,0,0.1)"}`, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                                    {emoji}{users.length > 1 && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>{users.length}</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Timestamp + read receipt */}
                            <p style={{ margin: "2px 4px 0", fontSize: 10, color: "var(--text-muted)", textAlign: mine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start", gap: 3 }}>
                              {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                              {mine && !msg.pending && (msg.read ? <CheckCheck size={11} style={{ color: "#3b82f6" }} /> : <Check size={11} />)}
                            </p>
                          </div>

                          {/* Context menu trigger */}
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
                              onEdit={() => { setEditing(msg); setText(msg.content || ""); setTimeout(() => { inputRef.current?.focus(); autoResize(); }, 50); }}
                              onReply={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                              onReact={(emoji) => addReaction(msg._id, emoji)}
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
                    <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bubble-other-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
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
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: editingMsg ? "#d97706" : "#3b82f6" }}>
                      {editingMsg ? "✏️ Editing · expires in 15 min" : `↩ Replying to ${activeInfo?.name || "message"}`}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanContent((editingMsg || replyTo)?.content) || "Voice message"}</p>
                  </div>
                  <button onClick={cancelAction} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
                </div>
              )}

              {/* ── WhatsApp-style Recording Bar ── */}
              {recording && (
                <div style={{ padding: "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {/* Cancel */}
                  <button onClick={cancelRecording}
                    style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Trash2 size={16} />
                  </button>

                  {/* Timer + waveform */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "var(--input-bg)", borderRadius: 24, padding: "6px 14px", border: "2px solid #ef4444" }}>
                    {/* ✅ Recording indicator + timer from 0:00 */}
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "recPulse 1s ease-in-out infinite" }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", minWidth: 38, fontFamily: "monospace" }}>
                      {fmtSec(recSeconds)}
                    </span>
                    {/* Live waveform bars */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, height: 28, overflow: "hidden" }}>
                      {Array.from({ length: 28 }).map((_, idx) => (
                        <div key={idx} style={{
                          flex: 1, borderRadius: 2, background: "#ef4444", opacity: 0.55 + (idx % 3) * 0.15,
                          height: `${15 + Math.abs(Math.sin((idx * 0.9) + recSeconds * 0.8) * 70)}%`,
                          transition: "height 0.15s ease"
                        }} />
                      ))}
                    </div>
                    <Mic size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                  </div>

                  {/* Send voice note */}
                  <button onClick={stopRecording}
                    style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "#25d366", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Send size={16} />
                  </button>
                </div>
              )}

              {/* ── Input Bar ── */}
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
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMsg ? submitEdit() : sendMsg(); }
                      if (e.key === "Escape") cancelAction();
                    }}
                    placeholder={editingMsg ? "Edit message… (Esc to cancel)" : replyTo ? `Reply to ${activeInfo?.name || "message"}…` : `Message ${activeName}…`}
                    rows={1} className="msg-inp"
                    style={{ flex: 1, padding: "9px 13px", borderRadius: 12, border: `1px solid ${editingMsg ? "#fbbf24" : "var(--input-border)"}`, fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", background: editingMsg ? "#fffbeb" : "var(--input-bg)", color: "var(--text-primary)", fontFamily: "inherit" }} />

                  {/* ✅ Mic button — only shown when input is empty */}
                  {!text.trim() && !editingMsg && (
                    <button className="icon-btn" onClick={startRecording} title="Record voice note"
                      style={{ width: 36, height: 36, borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border-color)", flexShrink: 0 }}>
                      <Mic size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  )}

                  <button onClick={() => editingMsg ? submitEdit() : sendMsg()}
                    disabled={(!text.trim() && !uploading) || sending} className="send-btn"
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
                <Plus size={16} /> New Conversation
              </button>
            </div>
          )
        )}
      </div>

      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileU(null)}
          onMessage={() => { setProfileU(null); inputRef.current?.focus(); }}
          onCall={() => { setProfileU(null); router.push(`/dashboard/${role}/video-calls?contact=${profileUser._id}`); }}
        />
      )}

      {showNewConv && <NewConvPanel myId={myId} onClose={() => setShowNew(false)} onSelect={(u) => selectContact(u)} isMobile={isMobile} />}
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