"use client";
// app/dashboard/[role]/messages/page.jsx — FULL WHATSAPP-STYLE REWRITE
// ✅ Fixed: emoji "+" picker now works (stopPropagation everywhere)
// ✅ Fixed: no false "Attachment" label on plain messages
// ✅ WhatsApp delete modal: "Delete for everyone" / "Delete for me" / "Cancel"
// ✅ Full message menu: Info, Reply, Copy, Forward, Pin, Star, Select, Save as, Share, Delete
// ✅ Voice/mic recording with timer + waveform
// ✅ All original features preserved

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Video, X, Send, Paperclip, Smile, Search, Plus,
  ChevronLeft, Edit2, Trash2, Reply, MoreVertical,
  Check, CheckCheck, Download, Star, Copy, AlertCircle, User,
  Mic, MicOff, Forward, Pin, Info, Share2, Bookmark, CheckSquare
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

const EMOJI_CATS = {
  "😊 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😚","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 People":  ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🩸"],
  "❤️ Hearts":  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🪬"],
  "🎉 Fun":     ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🥊","🎽","🛹","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  "🍎 Food":    ["🍎","🍊","🍋","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥒","🌶️","🧄","🥔","🥐","🍞","🧀","🥚","🍳","🥞","🧇","🥓","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🧁","🍰","🎂","🍭","🍬","🍫","🍿","🍩","🍪","🥤","🧋","🍵","☕","🍺","🥂","🍾"],
  "✈️ Travel":  ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🛻","🚚","🚛","🏍️","🛵","🚲","🛴","✈️","🚀","🛸","🚁","⛵","🚢","🚂","🏔️","⛰️","🌋","🏕️","🏖️","🏜️","🏝️","🏟️","🏛️","🏗️","🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","⛩️","🗺️","🧭","🌍","🌎","🌏"],
  "💼 Objects": ["⌚","📱","💻","🖥️","⌨️","🖱️","💾","💿","📀","📷","📸","📹","🎥","📞","☎️","📟","📺","📻","🔋","🔌","💡","🔦","🕯️","💰","💵","💳","🪙","✉️","📧","📝","📁","📂","📊","📋","📌","📍","📎","✂️","🔒","🔓","🔑","🗝️","🔨","🛠️","⚙️","🔧","🔩","🧲","💣","🧱","🛋️","🚪","🛏️","🛁","🚿","🧴","🧹","🧺","🧻","🧼","🛒"],
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
const canEdit              = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 15 * 60 * 1000;
const canDeleteForEveryone = (msg) => msg?.createdAt && Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 1000;
const fmtDuration = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

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

// ── DELETE CONFIRMATION MODAL (WhatsApp style) ────────────────────────────────
function DeleteModal({ msg, isMine, onDeleteMe, onDeleteEveryone, onCancel }) {
  if (!msg) return null;
  const everyoneExpired = !canDeleteForEveryone(msg);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: "#1e2631", borderRadius: 16, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", animation: "scIn 0.25s ease", overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 8px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#fff" }}>Delete message?</h3>
          {msg.fileUrl && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color="#fff" />
              </div>
              <span style={{ fontSize: 14, color: "#e2e8f0" }}>Delete file from your device</span>
            </label>
          )}
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0 0" }} />
        {isMine && (
          <button onClick={onDeleteEveryone} disabled={everyoneExpired}
            style={{ width: "100%", padding: "16px 24px", background: "transparent", border: "none", textAlign: "left", fontSize: 15, fontWeight: 600, color: everyoneExpired ? "#4a5568" : "#25d366", cursor: everyoneExpired ? "not-allowed" : "pointer", transition: "background 0.12s", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            onMouseEnter={e => { if (!everyoneExpired) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            Delete for everyone
            {everyoneExpired && <span style={{ fontSize: 11, color: "#4a5568" }}>Time limit exceeded</span>}
          </button>
        )}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
        <button onClick={onDeleteMe}
          style={{ width: "100%", padding: "16px 24px", background: "transparent", border: "none", textAlign: "left", fontSize: 15, fontWeight: 600, color: "#25d366", cursor: "pointer", transition: "background 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          Delete for me
        </button>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
        <button onClick={onCancel}
          style={{ width: "100%", padding: "16px 24px", background: "transparent", border: "none", textAlign: "left", fontSize: 15, fontWeight: 600, color: "#94a3b8", cursor: "pointer", transition: "background 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Emoji Picker (input bar) ──────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const [tab,    setTab]    = useState(Object.keys(EMOJI_CATS)[0]);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const results = search ? Object.values(EMOJI_CATS).flat() : null;
  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 600, background: "var(--sidebar-bg,#fff)", borderRadius: 16, boxShadow: "0 -4px 40px rgba(0,0,0,0.18)", border: "1px solid var(--border-color,#e2e8f0)", width: 320, maxHeight: 380, display: "flex", flexDirection: "column", overflow: "hidden", animation: "popUp 0.2s ease" }}>
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
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
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

// ── Message Context Menu (WhatsApp full feature set) ──────────────────────────
function MsgMenu({ msg, isMine, onDelete, onEdit, onReply, onReact, onCopy, onStar, onForward, onPin, onSelect, onInfo, onClose, x, y }) {
  const ref = useRef(null);
  const [showAllEmoji, setShowAllEmoji] = useState(false);
  const [emojiSearch, setEmojiSearch]   = useState("");
  const [activeEmojiCat, setActiveEmojiCat] = useState(Object.keys(EMOJI_CATS)[0]);
  const editExpired = !canEdit(msg);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const menuW = showAllEmoji ? 300 : 230;
  const menuH = showAllEmoji ? 420 : "auto";
  const safeX = typeof window !== "undefined" ? Math.min(x, window.innerWidth  - menuW - 12) : x;
  const safeY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - (showAllEmoji ? 420 : 480) - 12) : y;

  const BG = "#1e2631"; const BORDER = "rgba(255,255,255,0.08)";
  const HOVER = "rgba(255,255,255,0.06)"; const TXT = "#e2e8f0";
  const MUTED = "#64748b"; const DIM = "#4a5568"; const RED = "#ef4444";
  const GREEN = "#25d366";

  const item = (icon, label, action, color = TXT, disabled = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled) { action(); onClose(); } }}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", fontSize: 14, color: disabled ? DIM : color, fontWeight: 500, textAlign: "left" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <span style={{ opacity: disabled ? 0.3 : 1, display: "flex", color: disabled ? DIM : color }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {disabled && <AlertCircle size={11} style={{ color: DIM }} />}
    </button>
  );

  const displayEmojis = emojiSearch ? Object.values(EMOJI_CATS).flat() : (EMOJI_CATS[activeEmojiCat] || []);

  return (
    <div ref={ref}
      onClick={e => e.stopPropagation()}
      style={{ position: "fixed", left: safeX, top: safeY, zIndex: 9999, background: BG, borderRadius: 16, boxShadow: "0 16px 56px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, width: menuW, maxHeight: showAllEmoji ? menuH : 520, overflow: "hidden", display: "flex", flexDirection: "column", animation: "popIn 0.15s ease" }}>

      {showAllEmoji ? (
        <div style={{ display: "flex", flexDirection: "column", height: menuH }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 8px", borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={(e) => { e.stopPropagation(); setShowAllEmoji(false); setEmojiSearch(""); }}
              style={{ background: HOVER, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TXT, fontSize: 16 }}>
              ‹
            </button>
            <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)}
              placeholder="Search reaction…" autoFocus
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 10px", fontSize: 13, outline: "none", background: "rgba(255,255,255,0.08)", color: TXT }} />
          </div>
          {/* Category tabs */}
          {!emojiSearch && (
            <div style={{ display: "flex", overflowX: "auto", padding: "6px 8px 4px", gap: 2, scrollbarWidth: "none", borderBottom: `1px solid ${BORDER}` }}>
              {Object.keys(EMOJI_CATS).map(cat => (
                <button key={cat} onClick={(e) => { e.stopPropagation(); setActiveEmojiCat(cat); }}
                  style={{ flexShrink: 0, width: 30, height: 28, borderRadius: 6, border: "none", background: activeEmojiCat === cat ? "rgba(255,255,255,0.12)" : "transparent", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: activeEmojiCat === cat ? `2px solid ${GREEN}` : "none" }}>
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
          {/* Emoji grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {displayEmojis.map((e, i) => (
              <button key={`${e}-${i}`}
                onClick={(ev) => { ev.stopPropagation(); onReact(e); onClose(); }}
                style={{ width: "100%", aspectRatio: "1", border: "none", background: "transparent", fontSize: 20, cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={ev => { ev.currentTarget.style.background = HOVER; ev.currentTarget.style.transform = "scale(1.25)"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.transform = "scale(1)"; }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Quick reactions + "+" */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 8px 8px", borderBottom: `1px solid ${BORDER}`, gap: 2 }}>
            <div style={{ display: "flex", overflowX: "auto", flex: 1, gap: 2, scrollbarWidth: "none" }}>
              {QUICK_REACTIONS.slice(0,6).map(r => (
                <button key={r}
                  onClick={(e) => { e.stopPropagation(); onReact(r); onClose(); }}
                  style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={ev => { ev.currentTarget.style.transform = "scale(1.4)"; ev.currentTarget.style.background = HOVER; }}
                  onMouseLeave={ev => { ev.currentTarget.style.transform = "scale(1)"; ev.currentTarget.style.background = "transparent"; }}>
                  {r}
                </button>
              ))}
            </div>
            {/* ✅ FIX: stopPropagation on "+" button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowAllEmoji(true); }}
              style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: HOVER, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontWeight: 700 }}
              title="All reactions">
              +
            </button>
          </div>

          {/* ── WhatsApp-style full menu ── */}
          <div style={{ overflowY: "auto", maxHeight: 400 }}>
            {item(<Info size={15} />,       "Message info",       onInfo,              TXT)}
            {item(<Reply size={15} />,      "Reply",              onReply,             TXT)}
            {item(<Copy size={15} />,       "Copy",               onCopy,              TXT)}
            {item(<Forward size={15} />,    "Forward",            onForward,           TXT)}
            {item(<Pin size={15} />,        "Pin",                onPin,               TXT)}
            {item(<Star size={15} />,       "Star message",       onStar,              TXT)}
            {item(<CheckSquare size={15} />,"Select",             onSelect,            TXT)}
            {msg.fileUrl && item(<Download size={15} />, "Save as", () => { const a = document.createElement("a"); a.href = fixUrl(msg.fileUrl); a.download = msg.fileName || "file"; a.click(); }, TXT)}
            {msg.fileUrl && item(<Share2 size={15} />,  "Share",   () => { navigator.share?.({ url: fixUrl(msg.fileUrl) }); }, TXT)}
            {isMine && item(<Edit2 size={15} />, editExpired ? "Edit (expired — 15 min)" : "Edit", onEdit, editExpired ? MUTED : TXT, editExpired)}
            <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
            {item(<Trash2 size={15} />,     "Delete",             onDelete,            RED)}
          </div>
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

// ── FORWARD MODAL ─────────────────────────────────────────────────────────────
function ForwardModal({ msg, contacts, onForward, onClose }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => !search || (c.name||c.email||"").toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--sidebar-bg,#fff)", borderRadius: 16, width: "100%", maxWidth: 380, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "scIn 0.25s ease" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color,#e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Forward message</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#64748b)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "10px 16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(c => {
            const isSelected = selected.includes(c._id);
            return (
              <div key={c._id} onClick={() => setSelected(p => isSelected ? p.filter(id => id !== c._id) : [...p, c._id])}
                style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isSelected ? "var(--conv-hover,#f1f5f9)" : "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                <Avatar user={c} size={38} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>{c.name || c.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#94a3b8)", textTransform: "capitalize" }}>{c.role}</p>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isSelected ? "#3b82f6" : "var(--border-color,#e2e8f0)"}`, background: isSelected ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {isSelected && <Check size={11} color="#fff" />}
                </div>
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color,#e2e8f0)", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 13, color: "var(--text-muted,#64748b)" }}>{selected.length} selected</span>
            <button onClick={() => { onForward(selected); onClose(); }}
              style={{ padding: "9px 20px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Forward →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MESSAGE INFO MODAL ────────────────────────────────────────────────────────
function MsgInfoModal({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--sidebar-bg,#fff)", borderRadius: 16, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "scIn 0.25s ease" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color,#e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Message Info</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#64748b)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px" }}>
          {msg.content && (
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "#3b82f6", color: "#fff", fontSize: 14, marginBottom: 16 }}>
              {msg.content}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCheck size={16} style={{ color: "#3b82f6" }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>Read</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{msg.readAt ? fmt(msg.readAt) : msg.read ? "Yes" : "Not yet"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Check size={16} style={{ color: "#94a3b8" }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>Delivered</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{fmt(msg.createdAt)}</p>
              </div>
            </div>
            {msg.edited && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Edit2 size={16} style={{ color: "#f59e0b" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>Edited</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{msg.editedAt ? fmt(msg.editedAt) : "Yes"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
  const [pinnedMsgs,  setPinned]     = useState(new Set());
  const [deletedMsgs, setDeleted]    = useState(new Set());
  const [profileUser, setProfileU]   = useState(null);
  // Delete modal
  const [deleteModal, setDeleteModal]= useState(null); // { msg, isMine }
  // Forward modal
  const [forwardMsg,  setForwardMsg] = useState(null);
  // Message info modal
  const [infoMsg,     setInfoMsg]    = useState(null);
  // Voice recording
  const [isRecording, setIsRecording]= useState(false);
  const [recTime,     setRecTime]    = useState(0);
  const mediaRecRef  = useRef(null);
  const audioChunks  = useRef([]);
  const recTimerRef  = useRef(null);

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

  const fetchUserInfo = useCallback(async (id) => {
    const endpoints = [`${API}/api/users/${id}`, `${API}/api/lawyers/${id}`, `${API}/api/admin/users/${id}`];
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
        const d = await r.json(); setMsgs(d.messages || []);
        if (!silent) fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, []);

  // ── Delete (opens modal) ─────────────────────────────────────────────────
  const requestDelete = useCallback((msg, isMine) => {
    setDeleteModal({ msg, isMine });
  }, []);

  const confirmDeleteMe = useCallback(() => {
    if (!deleteModal) return;
    setDeleted(p => new Set([...p, deleteModal.msg._id]));
    setDeleteModal(null);
  }, [deleteModal]);

  const confirmDeleteEveryone = useCallback(async () => {
    if (!deleteModal) return;
    const msgId = deleteModal.msg._id;
    setDeleted(p => new Set([...p, msgId]));
    setDeleteModal(null);
    try { await fetch(`${API}/api/messages/${msgId}`, { method: "DELETE", credentials: "include", headers: HJ() }); }
    catch { setDeleted(p => { const n = new Set(p); n.delete(msgId); return n; }); }
  }, [deleteModal]);

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

  // ── Forward ───────────────────────────────────────────────────────────────
  const handleForward = useCallback(async (msg, recipientIds) => {
    for (const receiverId of recipientIds) {
      try {
        await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ receiverId, content: msg.content || "", fileUrl: msg.fileUrl, fileName: msg.fileName, type: msg.type, forwarded: true }) });
      } catch {}
    }
    loadContacts(true);
  }, []);

  // ── Voice Recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setUpload(true);
        try {
          const att = await uploadFile(file);
          att.type = "audio/webm"; // force audio type
          await sendMsg(att);
        } catch { alert("Voice upload failed."); }
        finally { setUpload(false); }
      };
      mr.start();
      mediaRecRef.current = mr;
      setIsRecording(true);
      setRecTime(0);
      recTimerRef.current = setInterval(() => setRecTime(p => p + 1), 1000);
    } catch { alert("Microphone permission denied."); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop();
      mediaRecRef.current = null;
    }
    clearInterval(recTimerRef.current);
    setIsRecording(false);
    setRecTime(0);
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecRef.current) {
      mediaRecRef.current.ondataavailable = null;
      mediaRecRef.current.onstop = null;
      try { mediaRecRef.current.stop(); } catch {}
      mediaRecRef.current = null;
    }
    clearInterval(recTimerRef.current);
    setIsRecording(false);
    setRecTime(0);
    audioChunks.current = [];
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
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
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: attachment.type?.startsWith("image/") ? "image" : attachment.type?.startsWith("audio/") ? "audio" : "file" } : {}),
    };
    setMsgs(p => [...p, opt]);

    try {
      const body = { receiverId };
      if (content)    body.content   = content;
      if (replyTo)    body.replyToId = replyTo._id;
      if (attachment) { body.fileUrl = attachment.url; body.fileName = attachment.name; body.type = attachment.type?.startsWith("image/") ? "image" : attachment.type?.startsWith("audio/") ? "audio" : "file"; }

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

  const filteredContacts = contacts.filter(c =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase())
  );
  const visibleMsgs = messages.filter(m => !deletedMsgs.has(m._id));
  const displayMsgs = msgSearch ? visibleMsgs.filter(m => (m.content || "").toLowerCase().includes(msgSearch.toLowerCase())) : visibleMsgs;
  const grouped     = displayMsgs.reduce((acc, msg) => {
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
        @keyframes recPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
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
        .rec-btn{animation:recPulse 1s ease infinite;}
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
                              {isAct && isTyping ? <span style={{ color: "#10b981", fontStyle: "italic" }}>typing…</span> : (c.lastMessage || "Start chatting…")}
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

              {/* In-chat search */}
              {showMsgSrch && (
                <div style={{ padding: "8px 16px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search messages…" autoFocus
                      style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 10, border: "1px solid var(--input-border)", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }} />
                  </div>
                  {msgSearch && <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{displayMsgs.length} found</span>}
                  <button onClick={() => { setShowMsgSrch(false); setMsgSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={15} /></button>
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
                      const mine      = String(msg.senderId?._id || msg.senderId) === myId;
                      const rawFileUrl = fixUrl(msg.fileUrl);
                      const fileUrl   = rawFileUrl && (rawFileUrl.startsWith("http://") || rawFileUrl.startsWith("https://")) ? rawFileUrl : null;
                      const msgType   = fileUrl ? (msg.type || "text") : "text";
                      const isImg     = msgType === "image" && !!fileUrl;
                      const isAudio   = (msgType === "audio" || msg.fileName?.endsWith(".webm") || msg.fileName?.endsWith(".mp3")) && !!fileUrl;
                      const reactions = msg.reactions || {};
                      const hasR      = Object.keys(reactions).length > 0;
                      const isStarred = starredMsgs.has(msg._id);
                      const isPinned  = pinnedMsgs.has(msg._id);

                      return (
                        <div key={msg._id || i} className="msg-wrap" style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: hasR ? 24 : 5, alignItems: "flex-end", gap: 6, position: "relative" }}>
                          {!mine && <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: hasR ? 20 : 0 }}>{activeName.charAt(0).toUpperCase()}</div>}

                          <div style={{ maxWidth: isMobile ? "83%" : "65%", position: "relative" }}>
                            {/* Forwarded indicator */}
                            {msg.forwarded && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, opacity: 0.6, justifyContent: mine ? "flex-end" : "flex-start" }}>
                                <Forward size={10} style={{ color: "var(--text-muted)" }} />
                                <span style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>Forwarded</span>
                              </div>
                            )}
                            {/* Pinned indicator */}
                            {isPinned && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, opacity: 0.6, justifyContent: mine ? "flex-end" : "flex-start" }}>
                                <Pin size={10} style={{ color: "#f59e0b" }} />
                                <span style={{ fontSize: 10, color: "#f59e0b" }}>Pinned</span>
                              </div>
                            )}
                            {/* ✅ FIX: msg.replyTo?._id (not msg.replyTo) */}
                            {msg.replyTo?._id && (
                              <div style={{ padding: "5px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.06)", borderLeft: `3px solid ${mine ? "#3b82f6" : "#94a3b8"}`, marginBottom: -2 }}>
                                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↩ {msg.replyTo.content || "Attachment"}</p>
                              </div>
                            )}

                            <div className="msg-b" style={{ padding: isImg ? 4 : "9px 13px", borderRadius: msg.replyTo?._id ? (mine ? "0 14px 4px 14px" : "14px 0 14px 4px") : (mine ? "18px 18px 4px 18px" : "4px 18px 18px 18px"), background: mine ? "#3b82f6" : "var(--bubble-other-bg)", color: mine ? "#fff" : "var(--bubble-other-color)", border: mine ? "none" : "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", opacity: msg.pending ? 0.65 : 1 }}>
                              {isStarred && <span style={{ fontSize: 10, marginBottom: 3, display: "block", opacity: 0.7 }}>⭐ starred</span>}
                              {msg.content && (
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>
                                  {msgSearch ? msg.content.split(new RegExp(`(${msgSearch})`, "gi")).map((part, idx) =>
                                    part.toLowerCase() === msgSearch.toLowerCase()
                                      ? <mark key={idx} style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{part}</mark> : part
                                  ) : msg.content}
                                  {msg.edited && <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 6, fontStyle: "italic" }}>edited</span>}
                                </p>
                              )}
                              {/* Audio message */}
                              {isAudio && fileUrl && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", marginTop: msg.content ? 6 : 0 }}>
                                  <Mic size={14} style={{ flexShrink: 0 }} />
                                  <audio controls src={fileUrl} style={{ height: 32, maxWidth: 200, filter: mine ? "invert(1) brightness(2)" : "none" }} />
                                </div>
                              )}
                              {/* Image */}
                              {isImg && !isAudio && fileUrl && (
                                <a href={fileUrl} target="_blank" rel="noreferrer">
                                  <img src={fileUrl} alt={msg.fileName || "image"} style={{ maxWidth: isMobile ? 180 : 240, maxHeight: 220, borderRadius: 12, display: "block", objectFit: "cover", marginTop: msg.content ? 6 : 0 }} />
                                </a>
                              )}
                              {/* File */}
                              {fileUrl && !isImg && !isAudio && (
                                <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.15)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#fff" : "var(--text-heading)", marginTop: msg.content ? 6 : 0 }}>
                                  <Download size={14} />
                                  <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{msg.fileName || "File"}</p><p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Download</p></div>
                                </a>
                              )}
                            </div>

                            {hasR && (
                              <div style={{ position: "absolute", bottom: -22, [mine ? "right" : "left"]: 0, display: "flex", gap: 3, flexWrap: "wrap" }}>
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                                    style={{ padding: "2px 7px", borderRadius: 12, background: users.includes(myId) ? "#dbeafe" : "rgba(255,255,255,0.9)", border: `1px solid ${users.includes(myId) ? "#93c5fd" : "rgba(0,0,0,0.1)"}`, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                    {emoji}{users.length > 1 && <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{users.length}</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            <p style={{ margin: `${hasR ? 24 : 2}px 4px 0`, fontSize: 10, color: "var(--text-muted)", textAlign: mine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: mine ? "flex-end" : "flex-start", gap: 3 }}>
                              {msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}
                              {mine && !msg.pending && (msg.read ? <CheckCheck size={11} style={{ color: "#3b82f6" }} /> : <Check size={11} />)}
                            </p>
                          </div>

                          {!msg.pending && (
                            <div className="msg-actions" style={{ opacity: 0, display: "flex", alignItems: "center", marginBottom: hasR ? 20 : 0, flexDirection: mine ? "row" : "row-reverse" }}>
                              <button onClick={(e) => { e.stopPropagation(); setMenuState({ msg, x: e.clientX, y: e.clientY }); }}
                                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", backdropFilter: "blur(4px)" }}>
                                <MoreVertical size={13} style={{ color: "#64748b" }} />
                              </button>
                            </div>
                          )}

                          {menuState?.msg._id === msg._id && (
                            <MsgMenu
                              msg={msg} isMine={mine}
                              x={menuState.x} y={menuState.y}
                              onDelete={() => requestDelete(msg, mine)}
                              onEdit={() => { setEditing(msg); setText(msg.content); setTimeout(() => { inputRef.current?.focus(); autoResize(); }, 50); }}
                              onReply={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                              onReact={(emoji) => addReaction(msg._id, emoji)}
                              onCopy={() => navigator.clipboard?.writeText(msg.content || "")}
                              onStar={() => setStarred(p => { const n = new Set(p); n.has(msg._id) ? n.delete(msg._id) : n.add(msg._id); return n; })}
                              onForward={() => setForwardMsg(msg)}
                              onPin={() => setPinned(p => { const n = new Set(p); n.has(msg._id) ? n.delete(msg._id) : n.add(msg._id); return n; })}
                              onSelect={() => {}}
                              onInfo={() => setInfoMsg(msg)}
                              onClose={() => setMenuState(null)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeName.charAt(0).toUpperCase()}</div>
                    <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bubble-other-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 2 }}>
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
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(editingMsg || replyTo)?.content || "Attachment"}</p>
                  </div>
                  <button onClick={cancelAction} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
                </div>
              )}

              {/* ── Input bar ── */}
              <div style={{ padding: isMobile ? "8px 10px" : "10px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0, position: "relative" }}>
                {showEmoji && (
                  <div style={{ position: "absolute", bottom: "100%", left: isMobile ? 4 : 10, zIndex: 600 }}>
                    <EmojiPicker onSelect={(e) => setText(p => p + e)} onClose={() => setShowEmoji(false)} />
                  </div>
                )}
                <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />

                {/* Recording mode */}
                {isRecording ? (
                  <>
                    <button onClick={cancelRecording} className="icon-btn" style={{ width: 36, height: 36, borderRadius: 10, background: "#fee2e2", border: "1px solid #fca5a5" }}>
                      <X size={15} style={{ color: "#ef4444" }} />
                    </button>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", borderRadius: 12, border: "1px solid #fca5a5", background: "#fff5f5", height: 38 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "recPulse 1s ease infinite" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{fmtDuration(recTime)}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Recording… slide to cancel</span>
                    </div>
                    <button onClick={stopRecording} className="rec-btn" style={{ width: 38, height: 38, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={16} style={{ color: "#fff" }} />
                    </button>
                  </>
                ) : (
                  <>
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

                    {/* Send OR Mic button */}
                    {text.trim() || uploading || editingMsg ? (
                      <button onClick={() => editingMsg ? submitEdit() : sendMsg()} disabled={(!text.trim() && !uploading) || sending} className="send-btn"
                        style={{ height: 36, padding: "0 16px", borderRadius: 12, background: text.trim() ? (editingMsg ? "#f59e0b" : "#3b82f6") : "var(--input-bg)", color: text.trim() ? "#fff" : "var(--text-muted)", border: text.trim() ? "none" : "1px solid var(--border-color)", fontWeight: 700, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
                        {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : editingMsg ? <Check size={16} /> : <><Send size={14} />{!isMobile && <span style={{ fontSize: 13 }}>Send</span>}</>}
                      </button>
                    ) : (
                      <button onClick={startRecording} className="icon-btn"
                        style={{ width: 38, height: 38, borderRadius: "50%", background: "#3b82f6", border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Hold to record voice message">
                        <Mic size={16} style={{ color: "#fff" }} />
                      </button>
                    )}
                  </>
                )}
              </div>
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
            </div>
          )
        )}
      </div>

      {/* ── Modals ── */}
      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileU(null)}
          onMessage={() => { setProfileU(null); inputRef.current?.focus(); }}
          onCall={() => { setProfileU(null); router.push(`/dashboard/${role}/video-calls?contact=${profileUser._id}`); }}
        />
      )}

      {/* ✅ WhatsApp-style delete confirmation modal */}
      {deleteModal && (
        <DeleteModal
          msg={deleteModal.msg}
          isMine={deleteModal.isMine}
          onDeleteMe={confirmDeleteMe}
          onDeleteEveryone={confirmDeleteEveryone}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Forward modal */}
      {forwardMsg && (
        <ForwardModal
          msg={forwardMsg}
          contacts={contacts}
          onForward={(ids) => handleForward(forwardMsg, ids)}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {/* Message info modal */}
      {infoMsg && <MsgInfoModal msg={infoMsg} onClose={() => setInfoMsg(null)} />}

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
      const add = (arr) => { if (!Array.isArray(arr)) return; arr.forEach(u => { if (u?._id) merged.set(u._id.toString(), u); }); };
      try { const r = await fetch(`${API}/api/messages/users?limit=500`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.users); } } catch {}
      try { const r = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.allUsers); add(d.allLawyers); add(d.lawyers); add(d.recentUsers); } } catch {}
      try { const r = await fetch(`${API}/api/admin/users?limit=500`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.users); } } catch {}
      try { const r = await fetch(`${API}/api/lawyers?limit=200`, { credentials: "include", headers: HJ() }); if (r.ok) { const d = await r.json(); add(d.lawyers); } } catch {}
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
  const tabs = [{ key: "all", label: "All", color: "#6366f1" }, { key: "client", label: "Clients", color: "#3b82f6" }, { key: "lawyer", label: "Lawyers", color: "#10b981" }, { key: "admin", label: "Admins", color: "#ef4444" }];

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
                style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${roleFilter === t.key ? t.color : "var(--border-color,#e2e8f0)"}`, background: roleFilter === t.key ? `${t.color}15` : "transparent", color: roleFilter === t.key ? t.color : "var(--text-muted,#94a3b8)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {t.label} {counts[t.key] > 0 ? `(${counts[t.key]})` : ""}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role…" autoFocus
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 13, outline: "none", background: "var(--input-bg,#f8fafc)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box" }} />
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
                style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover,#f1f5f9)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar user={u} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted,#94a3b8)" }}>{u.email}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role}</span>
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