"use client";
// app/dashboard/[role]/messages/page.jsx
// ✅ WhatsApp-parity feature set:
//   ✅ Reply to message (quoted reply bubble)
//   ✅ Edit message (sender only, within 15 min) — double-click or context menu
//   ✅ Delete for me / Delete for everyone
//   ✅ Emoji reactions (full picker with categories, search, recent)
//   ✅ Forward message
//   ✅ Star / Starred messages panel
//   ✅ Copy message text
//   ✅ Message info (read receipt + timestamps)
//   ✅ Context menu on right-click / long-press
//   ✅ Typing indicator (animated dots)
//   ✅ Online status dot + last seen
//   ✅ Unread badge
//   ✅ Day separators (Today / Yesterday / date)
//   ✅ File & image attachments + preview
//   ✅ Image lightbox viewer
//   ✅ Voice message UI placeholder
//   ✅ New Conversation slide-in panel
//   ✅ Profile modal with full details
//   ✅ Multi-select messages (Select mode)
//   ✅ Search messages within conversation
//   ✅ Pinned message banner
//   ✅ Scroll-to-bottom FAB
//   ✅ Optimistic send + ✓ / ✓✓ read receipts
//   ✅ Dark mode CSS variables
//   ✅ Keyboard shortcuts (Enter to send, Escape to cancel)
//   ✅ 3-second polling (Socket.io events handled when available)

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Phone, Video, User, X, Send, Paperclip, Smile,
  Search, Plus, ChevronLeft, ChevronDown, Star, StarOff,
  Reply, Trash2, Copy, Edit2, MoreVertical, Forward,
  Check, CheckCheck, Info, Pin, PinOff, ArrowDown,
  Mic, StopCircle, ImageIcon, FileText, Download,
  MessageSquare, Bell, BellOff, Archive, Filter,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const ROLE_C = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" };

// Full emoji categories like WhatsApp
const EMOJI_CATEGORIES = {
  "🕐 Recent": [],
  "😀 Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠"],
  "👋 Gestures": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","❣️","💕","💞","💓","💗","💖","💝","💘","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"],
  "🎉 Activities": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋️","🤼","🤸","🤺","🏇","⛹️","🤾","🏌️","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🎖","🏅","🎗","🎫","🎟","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🎹","🥁","🪘","🎷","🎺","🎸","🪕","🎻","🎲","♟","🎯","🎳","🎮","🎰","🧩"],
  "🌍 Nature": ["🌱","🌿","☘️","🍀","🎍","🎋","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌟","⭐","🌠","🌌","☀️","🌤","⛅","🌥","☁️","🌦","🌧","⛈","🌩","🌨","❄️","☃️","⛄","🌬","💨","💧","💦","☔","☂️","🌊","🌈"],
  "🍕 Food": ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🫖","🍵","🧉","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧊"],
  "⚖️ Legal": ["⚖️","📋","💼","📁","📂","🗂","📄","📃","📝","✍️","📌","📍","🔍","🔎","📊","📈","📉","🏛","👨‍⚖️","👩‍⚖️","🤝","✅","❌","⛔","🚫","💡","🔑","🗝","🔐","🔒","🔓","📞","☎️","📱","💬","🗣","📢","📣"],
};

const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🙏","✅","🔥"];

const fmt = (d) => {
  try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};
const fmtDay = (d) => {
  try {
    const n = new Date(), t = new Date(d);
    if (n.toDateString() === t.toDateString()) return "Today";
    const y = new Date(n); y.setDate(n.getDate() - 1);
    return y.toDateString() === t.toDateString() ? "Yesterday" : t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
};
const fmtLastSeen = (d) => {
  if (!d) return "last seen recently";
  try {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "last seen just now";
    if (diff < 3600000) return `last seen ${Math.floor(diff/60000)} min ago`;
    if (diff < 86400000) return `last seen today at ${fmt(d)}`;
    return `last seen ${new Date(d).toLocaleDateString()}`;
  } catch { return "last seen recently"; }
};

// ─── Skeleton ────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "var(--sk)", animation: "sk 1.4s ease infinite", flexShrink: 0 }} />;
}

// ─── Avatar ──────────────────────────────────────────────────────────
function Avatar({ user: u, size = 40, onClick }) {
  const bg = ROLE_C[u?.role] || "#6366f1";
  return (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", fontWeight: 800, fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: onClick ? "pointer" : "default" }}>
      {u?.profileImage
        ? <img src={u.profileImage} style={{ width: size, height: size, objectFit: "cover" }} alt="" />
        : (u?.name || u?.email || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Emoji Picker (full WhatsApp-style) ─────────────────────────────
function EmojiPicker({ onPick, onClose, recentEmojis = [] }) {
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState("😀 Smileys");
  const cats = { ...EMOJI_CATEGORIES };
  if (recentEmojis.length) cats["🕐 Recent"] = recentEmojis.slice(0, 30);
  else delete cats["🕐 Recent"];

  const filtered = search
    ? Object.values(cats).flat().filter((e, i, a) => a.indexOf(e) === i && e.includes(search))
    : null;

  const tabs = Object.keys(cats);

  return (
    <div style={{ position: "absolute", bottom: "100%", left: 0, width: 340, background: "var(--sidebar-bg)", border: "1px solid var(--border-color)", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", zIndex: 200, overflow: "hidden" }}>
      {/* Search */}
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emoji…"
            style={{ width: "100%", padding: "7px 10px 7px 28px", borderRadius: 20, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} autoFocus />
        </div>
      </div>
      {/* Category tabs */}
      {!search && (
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border-color)", background: "var(--input-bg)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 10px", border: "none", background: "none", cursor: "pointer", fontSize: 16, borderBottom: tab === t ? "2px solid #25d366" : "2px solid transparent", flexShrink: 0 }}>
              {t.split(" ")[0]}
            </button>
          ))}
        </div>
      )}
      {/* Emoji grid */}
      <div style={{ height: 220, overflowY: "auto", padding: "8px 10px" }}>
        {!search && tab && (
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{tab.replace(/^[^\s]+ /, "")}</p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {(filtered || cats[tab] || []).map((e, i) => (
            <button key={i} onClick={() => onPick(e)}
              style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer", fontSize: 20, borderRadius: 6, transition: "background 0.1s" }}
              onMouseEnter={el => el.currentTarget.style.background = "var(--conv-hover)"}
              onMouseLeave={el => el.currentTarget.style.background = "none"}>
              {e}
            </button>
          ))}
          {(filtered || cats[tab] || []).length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 10px" }}>No results</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ────────────────────────────────────────────────────
function ContextMenu({ x, y, msg, myId, onReply, onEdit, onCopy, onDelete, onForward, onStar, onInfo, onPin, onSelect, onReact, onClose }) {
  const ref = useRef(null);
  const isMine = String(msg?.senderId?._id || msg?.senderId) === myId;
  const canEdit = isMine && !msg?.deletedForEveryone && ((Date.now() - new Date(msg?.createdAt).getTime()) < 15 * 60000);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Quick reactions row
  return (
    <div ref={ref} style={{
      position: "fixed", left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 340),
      zIndex: 9999, background: "var(--sidebar-bg)", borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
      border: "1px solid var(--border-color)", overflow: "hidden", minWidth: 200, animation: "ctxIn 0.15s ease",
    }}>
      {/* Quick reactions */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: "1px solid var(--border-color)", background: "var(--input-bg)" }}>
        {QUICK_REACTIONS.map(e => (
          <button key={e} onClick={() => { onReact(e); onClose(); }}
            style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer", fontSize: 20, borderRadius: 8, transition: "transform 0.1s" }}
            onMouseEnter={el => el.currentTarget.style.transform = "scale(1.25)"}
            onMouseLeave={el => el.currentTarget.style.transform = "scale(1)"}>
            {e}
          </button>
        ))}
      </div>
      {/* Menu items */}
      {[
        { icon: <Reply size={15}/>,      label: "Reply",           action: onReply },
        ...(canEdit ? [{ icon: <Edit2 size={15}/>, label: "Edit", action: onEdit }] : []),
        { icon: <Copy size={15}/>,       label: "Copy",            action: onCopy },
        { icon: <Forward size={15}/>,    label: "Forward",         action: onForward },
        { icon: <Pin size={15}/>,        label: "Pin",             action: onPin },
        { icon: <Star size={15}/>,       label: msg?.starred ? "Unstar" : "Star", action: onStar },
        { icon: <MessageSquare size={15}/>, label: "Select",       action: onSelect },
        { icon: <Info size={15}/>,       label: "Info",            action: onInfo },
        { icon: <Trash2 size={15}/>,     label: "Delete",          action: onDelete, danger: true },
      ].map(({ icon, label, action, danger }) => (
        <button key={label} onClick={() => { action(); onClose(); }}
          style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: danger ? "#ef4444" : "var(--text-primary)", textAlign: "left", transition: "background 0.1s" }}
          onMouseEnter={el => el.currentTarget.style.background = "var(--conv-hover)"}
          onMouseLeave={el => el.currentTarget.style.background = "none"}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// ─── Delete Dialog ───────────────────────────────────────────────────
function DeleteDialog({ msg, myId, onDelete, onClose }) {
  const isMine = String(msg?.senderId?._id || msg?.senderId) === myId;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "var(--sidebar-bg)", borderRadius: 18, width: "90%", maxWidth: 380, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", animation: "scIn 0.2s ease" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "var(--text-heading)" }}>Delete message?</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)" }}>This cannot be undone.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => onDelete("me")} style={{ padding: "12px", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Delete for me</button>
          {isMine && <button onClick={() => onDelete("everyone")} style={{ padding: "12px", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Delete for everyone</button>}
          <button onClick={onClose} style={{ padding: "12px", borderRadius: 12, border: "none", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Forward Dialog ──────────────────────────────────────────────────
function ForwardDialog({ contacts, onForward, onClose }) {
  const [sel, setSel] = useState([]);
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => !search || (c.name || c.email || "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "var(--sidebar-bg)", borderRadius: 18, width: "90%", maxWidth: 420, padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", animation: "scIn 0.2s ease", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading)" }}>Forward to…</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "10px 16px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {filtered.map(c => (
            <div key={c._id} onClick={() => setSel(s => s.includes(c._id) ? s.filter(x => x !== c._id) : [...s, c._id])}
              style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: sel.includes(c._id) ? "var(--conv-hover)" : "none" }}>
              <Avatar user={c} size={38} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-heading)" }}>{c.name || c.email}</span>
              {sel.includes(c._id) && <Check size={16} style={{ color: "#25d366" }} />}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--border-color)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button disabled={sel.length === 0} onClick={() => { onForward(sel); onClose(); }}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: sel.length ? "#25d366" : "var(--border-color)", color: sel.length ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 13, cursor: sel.length ? "pointer" : "not-allowed" }}>
            Forward {sel.length > 0 ? `(${sel.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────
function ProfileModal({ user: u, onClose, onMessage, onCall }) {
  if (!u) return null;
  const rc = ROLE_C[u.role] || "#6366f1";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--sidebar-bg)", borderRadius: 22, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "scIn 0.3s ease", border: "1px solid var(--border-color)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading)" }}>Profile</h3>
          <button onClick={onClose} style={{ background: "var(--input-bg)", border: "none", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", color: "var(--text-muted)" }}><X size={16}/></button>
        </div>
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: rc, color: "#fff", fontSize: 30, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `3px solid ${rc}40` }}>
            {u.profileImage ? <img src={u.profileImage} style={{ width: 80, height: 80, objectFit: "cover" }} alt="" /> : (u.name || u.email || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading)" }}>{u.name || "User"}</p>
            <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text-muted)" }}>{u.email}</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: `${rc}18`, color: rc, textTransform: "capitalize" }}>{u.role || "user"}</span>
          </div>
          {u.isOnline
            ? <span style={{ fontSize: 12, fontWeight: 700, color: "#25d366" }}>● Online</span>
            : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtLastSeen(u.lastSeen)}</span>}
          {u.phone && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>📞 {u.phone}</p>}
          {u.city && <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>📍 {u.city}{u.country ? `, ${u.country}` : ""}</p>}
          {u.role === "lawyer" && u.lawyerProfile?.specializations?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
              {u.lawyerProfile.specializations.slice(0, 4).map(s => (
                <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac" }}>{s}</span>
              ))}
            </div>
          )}
          {u.createdAt && <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Member since {new Date(u.createdAt).toLocaleDateString()}</p>}
          <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
            <button onClick={onMessage} style={{ flex: 1, padding: 11, borderRadius: 12, background: "#25d366", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💬 Message</button>
            <button onClick={onCall}    style={{ flex: 1, padding: 11, borderRadius: 12, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📹 Video Call</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Lightbox ──────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><X size={20}/></button>
      <img src={src} onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 20px 80px rgba(0,0,0,0.5)" }} alt="" />
      <a href={src} download onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "8px 20px", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        <Download size={14}/> Download
      </a>
    </div>
  );
}

// ─── New Conversation Panel ──────────────────────────────────────────
function NewConvPanel({ onClose, onSelect, myId }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setL] = useState(true);

  useEffect(() => {
    (async () => {
      setL(true);
      try {
        const r = await fetch(`${API}/api/messages/users`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setUsers(d.users || []); return; }
        const r2 = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: HJ() });
        if (r2.ok) { const d = await r2.json(); setUsers(d.allUsers || []); }
      } catch {} finally { setL(false); }
    })();
  }, []);

  const filtered = users.filter(u => {
    if (u._id === myId) return false;
    const q = search.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 320, height: "100vh", background: "var(--sidebar-bg)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", boxShadow: "4px 0 20px rgba(0,0,0,0.15)", animation: "slideIn 0.25s ease" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading)" }}>New Conversation</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18}/></button>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 10, border: "1px solid var(--border-color)", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }} autoFocus />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? [1,2,3,4,5].map(i => (
            <div key={i} style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
              <Sk w={38} h={38} r={19} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Sk w="55%" h={11}/><Sk w="75%" h={9}/></div>
            </div>
          )) : filtered.map(u => {
            const rc = ROLE_C[u.role] || "#6366f1";
            return (
              <div key={u._id} onClick={() => onSelect(u)} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ position: "relative" }}>
                  <Avatar user={u} size={38} />
                  {u.isOnline && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#25d366", border: "2px solid var(--sidebar-bg)" }}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{u.isOnline ? "Online" : fmtLastSeen(u.lastSeen)}</p>
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

// ─── Message Info Panel ──────────────────────────────────────────────
function MessageInfoPanel({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--sidebar-bg)", borderRadius: 18, width: "90%", maxWidth: 380, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", border: "1px solid var(--border-color)", animation: "scIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading)" }}>Message Info</h3>
          <button onClick={onClose} style={{ background: "var(--input-bg)", border: "none", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex", color: "var(--text-muted)" }}><X size={15}/></button>
        </div>
        {/* Message preview */}
        <div style={{ background: "var(--input-bg)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid var(--border-color)" }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.55 }}>{msg.deletedForEveryone ? "🚫 Message deleted" : msg.content || "📎 File"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Sent</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Delivered</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>✓✓ {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "—"}</span>
          </div>
          {msg.read && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Read</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#25d366" }}>✓✓ {msg.readAt ? new Date(msg.readAt).toLocaleTimeString() : "Yes"}</span>
            </div>
          )}
          {msg.edited && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Edited</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{msg.editedAt ? new Date(msg.editedAt).toLocaleString() : "Yes"}</span>
            </div>
          )}
        </div>
        {Object.keys(msg.reactions || {}).length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Reactions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(msg.reactions).map(([e, ids]) => (
                <span key={e} style={{ fontSize: 14, padding: "4px 10px", borderRadius: 20, background: "var(--input-bg)", border: "1px solid var(--border-color)" }}>{e} {ids.length}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Starred Messages Panel ──────────────────────────────────────────
function StarredPanel({ messages, myId, onClose, onGoTo }) {
  const starred = messages.filter(m => m.starred);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", backdropFilter: "blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 380, height: "100vh", background: "var(--sidebar-bg)", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", animation: "slideRight 0.25s ease", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading)", display: "flex", alignItems: "center", gap: 8 }}><Star size={16} style={{ color: "#f59e0b" }}/> Starred Messages</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18}/></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {starred.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <p style={{ fontWeight: 600, margin: 0 }}>No starred messages</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Long-press or right-click a message and tap Star.</p>
            </div>
          ) : starred.map(msg => {
            const mine = String(msg.senderId?._id || msg.senderId) === myId;
            return (
              <div key={msg._id} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 14, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer" }}
                onClick={() => { onGoTo(msg._id); onClose(); }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: mine ? "#25d366" : "var(--text-muted)", fontWeight: 700 }}>{mine ? "You" : "Them"}</p>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{msg.content || "📎 File"}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{fmt(msg.createdAt)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Message Search Panel ────────────────────────────────────────────
function SearchPanel({ messages, myId, onClose, onGoTo }) {
  const [q, setQ] = useState("");
  const results = q.trim() ? messages.filter(m => m.content?.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: "100%", background: "var(--sidebar-bg)", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "-4px 0 20px rgba(0,0,0,0.12)", animation: "slideRight 0.2s ease" }}>
      <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search messages…" autoFocus
            style={{ width: "100%", padding: "8px 10px 8px 28px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}/>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16}/></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {q && results.length === 0 && <p style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No messages found</p>}
        {results.map(msg => {
          const mine = String(msg.senderId?._id || msg.senderId) === myId;
          const idx = msg.content.toLowerCase().indexOf(q.toLowerCase());
          return (
            <div key={msg._id} onClick={() => { onGoTo(msg._id); onClose(); }}
              style={{ padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-color)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--conv-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: mine ? "#25d366" : "var(--text-muted)" }}>{mine ? "You" : "Them"} · {fmt(msg.createdAt)}</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {msg.content.slice(0, idx)}<mark style={{ background: "#fef08a", color: "#000" }}>{msg.content.slice(idx, idx + q.length)}</mark>{msg.content.slice(idx + q.length)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── File Upload ─────────────────────────────────────────────────────
async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
  if (!r.ok) throw new Error("Upload failed");
  const d = await r.json();
  return { url: d.url || d.fileUrl, name: file.name, size: file.size, type: file.type };
}

// ═════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════
export default function MessagesPage() {
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
  const [isTyping,    setIsTyping]   = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);

  // UI panels
  const [showEmoji,    setShowEmoji]   = useState(false);
  const [showNewConv,  setShowNew]     = useState(false);
  const [profileUser,  setProfileU]    = useState(null);
  const [lightbox,     setLightbox]    = useState(null); // image url
  const [contextMenu,  setContextMenu] = useState(null); // { x, y, msg }
  const [deleteDialog, setDeleteDialog] = useState(null); // msg
  const [forwardMsg,   setForwardMsg]  = useState(null);
  const [infoMsg,      setInfoMsg]     = useState(null);
  const [showStarred,  setShowStarred] = useState(false);
  const [showSearch,   setShowSearch]  = useState(false);
  const [pinnedMsg,    setPinnedMsg]   = useState(null);
  const [editingMsg,   setEditingMsg]  = useState(null); // { _id, content }
  const [replyTo,      setReplyTo]     = useState(null); // msg
  const [selectMode,   setSelectMode]  = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [filterTab,    setFilterTab]   = useState("all"); // all | unread

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const inputRef   = useRef(null);
  const msgRefs    = useRef({});
  const chatArea   = useRef(null);

  const myId = String(user?._id || user?.id || "");
  const role = user?.role || "client";

  // ── Load contacts ──────────────────────────────────────────────────
  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoadC(true);
    try {
      const r = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: HJ() });
      if (r.ok) { const d = await r.json(); setContacts(d.contacts || []); }
    } catch {}
    if (!silent) setLoadC(false);
  }, []);

  // ── Load messages ──────────────────────────────────────────────────
  const loadMsgs = useCallback(async (contactId, silent = false) => {
    if (!contactId) return;
    if (!silent) setLoadM(true);
    try {
      const r = await fetch(`${API}/api/messages/${contactId}`, { credentials: "include", headers: HJ() });
      if (r.ok) {
        const d = await r.json();
        setMsgs(d.messages || []);
        // Mark read silently
        fetch(`${API}/api/messages/${contactId}/read`, { method: "PATCH", credentials: "include", headers: HJ() }).catch(() => {});
      }
    } catch {}
    if (!silent) setLoadM(false);
  }, []);

  // ── Multi-endpoint user fetch ──────────────────────────────────────
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

  // ── Poll typing status ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/messages/${activeId}/typing-status`, { credentials: "include", headers: HJ() });
        if (r.ok) { const d = await r.json(); setIsTyping(d.isTyping); }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [activeId]);

  // ── Send typing ping ───────────────────────────────────────────────
  const pingTyping = useCallback(() => {
    if (!activeId) return;
    fetch(`${API}/api/messages/${activeId}/typing`, { method: "POST", credentials: "include", headers: HJ() }).catch(() => {});
  }, [activeId]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    pingTyping();
    if (typingTimer) clearTimeout(typingTimer);
    setTypingTimer(setTimeout(() => {}, 3000));
  };

  // ── Send message ───────────────────────────────────────────────────
  const sendMsg = useCallback(async (attachment = null) => {
    const content = text.trim();
    if (!content && !attachment) return;
    const receiverId = activeId || contactParam;
    if (!receiverId) return;

    const isEdit = !!editingMsg;

    if (isEdit) {
      // Edit mode
      setText("");
      setEditingMsg(null);
      try {
        const r = await fetch(`${API}/api/messages/${editingMsg._id}`, {
          method: "PATCH", credentials: "include", headers: HJ(),
          body: JSON.stringify({ content }),
        });
        if (r.ok) { const d = await r.json(); setMsgs(p => p.map(m => m._id === editingMsg._id ? (d.message || m) : m)); }
      } catch {}
      return;
    }

    setText("");
    const replySnap = replyTo ? { _id: replyTo._id, content: replyTo.content, senderId: replyTo.senderId?._id || replyTo.senderId } : undefined;
    setReplyTo(null);
    setSend(true);

    const opt = {
      _id: `opt-${Date.now()}`, senderId: myId, receiverId, content,
      createdAt: new Date().toISOString(), pending: true,
      ...(replySnap ? { replyTo: replySnap } : {}),
      ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name, type: attachment.type?.startsWith("image/") ? "image" : "file" } : {}),
    };
    setMsgs(p => [...p, opt]);

    try {
      const body = { receiverId, content };
      if (attachment) { body.fileUrl = attachment.url; body.fileName = attachment.name; body.type = attachment.type?.startsWith("image/") ? "image" : "file"; }
      if (replySnap) body.replyToId = replySnap._id;
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
  }, [text, activeId, contactParam, myId, editingMsg, replyTo]);

  // ── File upload ────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUpload(true);
    try { const att = await uploadFile(file); await sendMsg(att); }
    catch { alert("Upload failed."); }
    finally { setUpload(false); }
  };

  // ── React to message ───────────────────────────────────────────────
  const handleReact = async (msgId, emoji) => {
    setRecentEmojis(p => [emoji, ...p.filter(e => e !== emoji)].slice(0, 30));
    try {
      const r = await fetch(`${API}/api/messages/${msgId}/react`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ emoji }) });
      if (r.ok) {
        const d = await r.json();
        setMsgs(p => p.map(m => m._id === msgId ? { ...m, reactions: d.reactions } : m));
      }
    } catch {}
  };

  // ── Delete message ─────────────────────────────────────────────────
  const handleDelete = async (msg, mode) => {
    setDeleteDialog(null);
    try {
      const r = await fetch(`${API}/api/messages/${msg._id}`, { method: "DELETE", credentials: "include", headers: HJ(), body: JSON.stringify({ mode }) });
      if (r.ok) {
        if (mode === "everyone") {
          setMsgs(p => p.map(m => m._id === msg._id ? { ...m, deletedForEveryone: true, content: "", fileUrl: null } : m));
        } else {
          setMsgs(p => p.filter(m => m._id !== msg._id));
        }
        loadContacts(true);
      }
    } catch {}
  };

  // ── Forward message ────────────────────────────────────────────────
  const handleForward = async (msg, contactIds) => {
    for (const receiverId of contactIds) {
      try {
        await fetch(`${API}/api/messages`, { method: "POST", credentials: "include", headers: HJ(), body: JSON.stringify({ receiverId, content: msg.content || "", fileUrl: msg.fileUrl, fileName: msg.fileName, type: msg.type }) });
      } catch {}
    }
    loadContacts(true);
  };

  // ── Star message (local only – persist via your API if you add endpoint) ──
  const toggleStar = (msgId) => {
    setMsgs(p => p.map(m => m._id === msgId ? { ...m, starred: !m.starred } : m));
  };

  // ── Pin message ────────────────────────────────────────────────────
  const togglePin = (msg) => {
    setPinnedMsg(p => p?._id === msg._id ? null : msg);
  };

  // ── Select contact ─────────────────────────────────────────────────
  const selectContact = (c) => {
    setActiveId(c._id); setActiveInfo(c); setSearch(""); setShowNew(false);
    setSelectMode(false); setSelectedMsgs([]); setReplyTo(null); setEditingMsg(null);
  };

  // ── Scroll handling ────────────────────────────────────────────────
  const handleScroll = () => {
    if (!chatArea.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatArea.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const scrollToMsg = (msgId) => {
    const el = msgRefs.current[msgId];
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.background = "var(--highlight)"; setTimeout(() => el.style.background = "", 1500); }
  };

  // ── On mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setTimeout(() => setReady(true), 500); return; }
    loadContacts();
    const t = setInterval(() => loadContacts(true), 8000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    if (!loadC) setTimeout(() => setReady(true), 80);
  }, [loadC]);

  // ── Auto-open from ?contact= param ────────────────────────────────
  useEffect(() => {
    if (!contactParam) return;
    const init = async () => {
      const found = contacts.find(c => c._id === contactParam);
      if (found) { setActiveId(contactParam); setActiveInfo(found); return; }
      const info = await fetchUserInfo(contactParam);
      if (info) { setActiveId(contactParam); setActiveInfo(info); }
    };
    init();
  }, [contactParam, contacts.length]);

  // ── Auto-select first if none active ──────────────────────────────
  useEffect(() => {
    if (!contactParam && !activeId && contacts.length > 0) selectContact(contacts[0]);
  }, [contacts.length, contactParam, activeId]);

  // ── Poll messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    loadMsgs(activeId);
    const t = setInterval(() => { loadMsgs(activeId, true); loadContacts(true); }, 3000);
    return () => clearInterval(t);
  }, [activeId]);

  // ── Scroll to bottom on new messages ──────────────────────────────
  useEffect(() => {
    if (!showScrollBtn) scrollToBottom();
  }, [messages.length]);

  // ── Emoji pick ─────────────────────────────────────────────────────
  const handleEmojiPick = (e) => {
    setRecentEmojis(p => [e, ...p.filter(x => x !== e)].slice(0, 30));
    if (editingMsg) setEditingMsg(prev => ({ ...prev, _editContent: (prev._editContent || prev.content) + e }));
    else { setText(p => p + e); inputRef.current?.focus(); }
    setShowEmoji(false);
  };

  // ── Grouped messages ───────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
      const matchTab = filterTab === "all" || (filterTab === "unread" && c.unread > 0);
      return matchSearch && matchTab;
    });
  }, [contacts, search, filterTab]);

  const grouped = useMemo(() => {
    return messages.reduce((acc, msg) => {
      const day = fmtDay(msg.createdAt || Date.now());
      if (!acc[day]) acc[day] = [];
      acc[day].push(msg);
      return acc;
    }, {});
  }, [messages]);

  const activeName = activeInfo?.name || activeInfo?.email || "Chat";
  const activeDot  = ROLE_C[activeInfo?.role] || "#6366f1";
  const showChat   = !!activeId;
  const pendingInSidebar = contactParam && activeInfo && !contacts.find(c => c._id === contactParam);

  // close context menu on escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setContextMenu(null); setShowEmoji(false); setShowSearch(false); setSelectMode(false); setSelectedMsgs([]); if (editingMsg) { setEditingMsg(null); setText(""); } if (replyTo) setReplyTo(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [editingMsg, replyTo]);

  return (
    <>
      <style>{`
        :root {
          --sk:#e2e8f0; --chat-bg:#f0f2f5; --sidebar-bg:#ffffff; --header-bg:#ffffff;
          --input-bg:#f8fafc; --input-border:#e2e8f0; --conv-hover:#f1f5f9;
          --border-color:#e2e8f0; --bubble-other-bg:#ffffff; --bubble-other-color:#111b21;
          --day-bg:#e2e8f0; --text-heading:#111b21; --text-muted:#667781;
          --text-primary:#374151; --highlight:#fef9c3;
        }
        .dark {
          --sk:#1e293b; --chat-bg:#0b141a; --sidebar-bg:#111b21; --header-bg:#202c33;
          --input-bg:#2a3942; --input-border:#3b4a54; --conv-hover:#2a3942;
          --border-color:#2a3942; --bubble-other-bg:#202c33; --bubble-other-color:#e9edef;
          --day-bg:#182229; --text-heading:#e9edef; --text-muted:#8696a0;
          --text-primary:#d1d7db; --highlight:#2a3942;
        }
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes scIn{from{transform:scale(0.95) translateY(14px);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideIn{from{transform:translateX(-24px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes slideRight{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes ctxIn{from{transform:scale(0.93);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes blink{0%,80%,100%{opacity:.2}40%{opacity:1}}
        .msg-b{animation:fd 0.15s ease;}
        .conv-row{transition:background 0.12s;cursor:pointer;}
        .conv-row:hover{background:var(--conv-hover)!important;}
        .conv-row.active-c{background:var(--conv-hover)!important;border-left:3px solid #25d366!important;}
        .msg-inp:focus{outline:none;}
        .send-btn:not(:disabled):hover{opacity:.85;}
        .send-btn:disabled{opacity:.45;cursor:not-allowed;}
        .icon-btn:hover{opacity:.75;}
        .icon-btn{transition:opacity .15s;}
        .typing-dot{width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:blink 1.4s ease infinite;}
        .typing-dot:nth-child(2){animation-delay:.2s}
        .typing-dot:nth-child(3){animation-delay:.4s}
        .msg-selected{background:rgba(37,211,102,0.12)!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--border-color);border-radius:4px}
      `}</style>

      <div style={{ height: "calc(100vh - 112px)", display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", opacity: ready ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ══════════════ SIDEBAR ══════════════ */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", background: "var(--sidebar-bg)", borderRight: "1px solid var(--border-color)", flexShrink: 0 }}>
          {/* Header */}
          <div style={{ padding: "14px 14px 10px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-heading)" }}>Messages</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="icon-btn" onClick={() => setShowStarred(true)} title="Starred messages"
                  style={{ width: 32, height: 32, borderRadius: 8, background: "var(--input-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                  <Star size={15}/>
                </button>
                <button className="icon-btn" onClick={() => setShowNew(true)} title="New conversation"
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#25d366", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={16}/>
                </button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or start new chat"
                style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 20, border: "none", fontSize: 13, outline: "none", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box" }}/>
            </div>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {["all","unread"].map(t => (
                <button key={t} onClick={() => setFilterTab(t)}
                  style={{ padding: "4px 12px", borderRadius: 20, border: "none", background: filterTab === t ? "#25d366" : "var(--input-bg)", color: filterTab === t ? "#fff" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Contact list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadC ? [1,2,3,4].map(i => (
              <div key={i} style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                <Sk w={46} h={46} r={23}/><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Sk w="50%" h={12}/><Sk w="70%" h={10}/></div>
              </div>
            )) : (
              <>
                {pendingInSidebar && (
                  <div className={`conv-row${activeId === contactParam ? " active-c" : ""}`}
                    onClick={() => selectContact(activeInfo)}
                    style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${activeId === contactParam ? "#25d366" : "transparent"}` }}>
                    <div style={{ position: "relative" }}>
                      <Avatar user={activeInfo} size={46}/>
                      <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: activeInfo?.isOnline ? "#25d366" : "#94a3b8", border: "2px solid var(--sidebar-bg)" }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-heading)" }}>{activeInfo.name || activeInfo.email}</span>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>New conversation</p>
                    </div>
                  </div>
                )}
                {filteredContacts.length === 0 && !pendingInSidebar ? (
                  <div style={{ padding: "40px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No conversations yet</p>
                    <button onClick={() => setShowNew(true)} style={{ marginTop: 14, padding: "9px 18px", borderRadius: 20, background: "#25d366", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ New Chat</button>
                  </div>
                ) : filteredContacts.map(c => {
                  const isAct = activeId === c._id;
                  return (
                    <div key={c._id} className={`conv-row${isAct ? " active-c" : ""}`}
                      onClick={() => selectContact(c)}
                      style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${isAct ? "#25d366" : "transparent"}` }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar user={c} size={46}/>
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: c.isOnline ? "#25d366" : "#94a3b8", border: "2px solid var(--sidebar-bg)" }}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: c.unread > 0 ? 800 : 600, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name || c.email}</span>
                          <span style={{ fontSize: 11, color: c.unread > 0 ? "#25d366" : "var(--text-muted)", flexShrink: 0, marginLeft: 4 }}>{c.lastMessageAt ? fmt(c.lastMessageAt) : ""}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: 12, color: c.unread > 0 ? "var(--text-heading)" : "var(--text-muted)", fontWeight: c.unread > 0 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.lastMessage || "Start chatting…"}</p>
                          {c.unread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#25d366", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4, padding: "0 4px" }}>{c.unread}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ══════════════ CHAT AREA ══════════════ */}
        {showChat ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--chat-bg)", minWidth: 0, position: "relative" }}>
            {/* Chat header */}
            <div style={{ padding: "10px 16px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, zIndex: 10 }}>
              {selectMode ? (
                <>
                  <button onClick={() => { setSelectMode(false); setSelectedMsgs([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><X size={20}/></button>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-heading)" }}>{selectedMsgs.length} selected</span>
                  <button onClick={() => { if (selectedMsgs.length === 1) setForwardMsg(messages.find(m => m._id === selectedMsgs[0])); }} disabled={selectedMsgs.length !== 1}
                    style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: selectedMsgs.length ? "#25d366" : "var(--border-color)", color: selectedMsgs.length ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: selectedMsgs.length ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 5 }}>
                    <Forward size={14}/> Forward
                  </button>
                  <button onClick={() => { selectedMsgs.forEach(id => { const m = messages.find(x => x._id === id); if (m) handleDelete(m, "me"); }); setSelectMode(false); setSelectedMsgs([]); }}
                    style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Trash2 size={14}/> Delete
                  </button>
                </>
              ) : (
                <>
                  <div onClick={() => setProfileU(activeInfo)} style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
                    <Avatar user={activeInfo} size={40}/>
                    <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: activeInfo?.isOnline ? "#25d366" : "#94a3b8", border: "2px solid var(--header-bg)" }}/>
                  </div>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setProfileU(activeInfo)}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-heading)" }}>{activeName}</p>
                    <p style={{ margin: 0, fontSize: 12, color: isTyping ? "#25d366" : "var(--text-muted)", fontWeight: 500 }}>
                      {isTyping ? "typing…" : activeInfo?.isOnline ? "online" : fmtLastSeen(activeInfo?.lastSeen)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" onClick={() => setShowSearch(p => !p)} title="Search" style={{ width: 36, height: 36, borderRadius: 8, background: showSearch ? "var(--conv-hover)" : "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><Search size={18}/></button>
                    <button className="icon-btn" onClick={() => router.push(`/dashboard/${role}/video-calls?contact=${activeId}`)} title="Video Call" style={{ width: 36, height: 36, borderRadius: 8, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><Video size={18}/></button>
                    <button className="icon-btn" onClick={() => setProfileU(activeInfo)} title="Profile" style={{ width: 36, height: 36, borderRadius: 8, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}><User size={18}/></button>
                  </div>
                </>
              )}
            </div>

            {/* Pinned message banner */}
            {pinnedMsg && (
              <div style={{ padding: "8px 16px", background: "var(--header-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                onClick={() => scrollToMsg(pinnedMsg._id)}>
                <Pin size={14} style={{ color: "#25d366", flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#25d366" }}>Pinned message</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.content || "📎 File"}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setPinnedMsg(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={14}/></button>
              </div>
            )}

            {/* Messages area */}
            <div ref={chatArea} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
              {loadM ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3,4].map((x,j) => (
                    <div key={x} style={{ display: "flex", justifyContent: j % 2 ? "flex-end" : "flex-start" }}>
                      <Sk w={`${32+j*12}%`} h={44} r={14}/>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14, animation: "pop 0.4s ease" }}>👋</div>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--text-heading)" }}>Say hi to {activeName}!</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Messages are end-to-end encrypted.</p>
                </div>
              ) : Object.entries(grouped).map(([day, dayMsgs]) => (
                <div key={day}>
                  {/* Day separator */}
                  <div style={{ textAlign: "center", margin: "12px 0 8px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border-color)" }}/>
                    <span style={{ background: "var(--day-bg)", padding: "3px 14px", borderRadius: 20, fontSize: 11, color: "var(--text-muted)", fontWeight: 700, position: "relative", zIndex: 1 }}>{day}</span>
                  </div>

                  {dayMsgs.map((msg, i) => {
                    const mine  = String(msg.senderId?._id || msg.senderId) === myId;
                    const isImg = msg.type === "image";
                    const isSelected = selectedMsgs.includes(msg._id);
                    const reactions = msg.reactions || {};
                    const hasReactions = Object.keys(reactions).length > 0;
                    const isDeleted = msg.deletedForEveryone;

                    return (
                      <div key={msg._id || i}
                        ref={el => { if (msg._id) msgRefs.current[msg._id] = el; }}
                        className={`msg-b${isSelected ? " msg-selected" : ""}`}
                        onClick={() => { if (selectMode && msg._id && !msg._id.startsWith("opt-")) setSelectedMsgs(p => p.includes(msg._id) ? p.filter(x => x !== msg._id) : [...p, msg._id]); }}
                        onContextMenu={(e) => {
                          if (!msg._id || msg._id.startsWith("opt-")) return;
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, msg });
                        }}
                        style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: hasReactions ? 16 : 4, alignItems: "flex-end", gap: 6, transition: "background 0.3s", borderRadius: 8, padding: "2px 4px", cursor: selectMode ? "pointer" : "default" }}>

                        {selectMode && !msg._id?.startsWith("opt-") && (
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isSelected ? "#25d366" : "var(--border-color)"}`, background: isSelected ? "#25d366" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 4 }}>
                            {isSelected && <Check size={12} style={{ color: "#fff" }}/>}
                          </div>
                        )}

                        {!mine && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: hasReactions ? 16 : 0, overflow: "hidden" }}>
                            {activeInfo?.profileImage ? <img src={activeInfo.profileImage} style={{ width: 28, height: 28, objectFit: "cover" }} alt=""/> : activeName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div style={{ maxWidth: "68%", position: "relative" }}>
                          {/* Reply-to snippet */}
                          {msg.replyTo && !isDeleted && (
                            <div onClick={() => msg.replyTo._id && scrollToMsg(msg.replyTo._id)}
                              style={{ padding: "6px 10px", borderRadius: "10px 10px 0 0", background: mine ? "rgba(0,0,0,0.12)" : "var(--input-bg)", borderLeft: `3px solid ${mine ? "rgba(255,255,255,0.5)" : activeDot}`, marginBottom: -2, cursor: "pointer" }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: mine ? "rgba(255,255,255,0.8)" : activeDot }}>{String(msg.replyTo.senderId) === myId ? "You" : activeName}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: mine ? "rgba(255,255,255,0.7)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{msg.replyTo.content || "📎 File"}</p>
                            </div>
                          )}

                          {/* Bubble */}
                          <div style={{
                            padding: isImg ? 4 : "8px 12px",
                            borderRadius: msg.replyTo ? (mine ? "0 0 4px 14px" : "0 14px 14px 4px") : (mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px"),
                            background: mine ? "#005c4b" : "var(--bubble-other-bg)",
                            color: mine ? "#e9edef" : "var(--bubble-other-color)",
                            border: mine ? "none" : "1px solid var(--border-color)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            opacity: msg.pending ? 0.65 : 1,
                            transition: "opacity 0.2s",
                          }}>
                            {isDeleted ? (
                              <p style={{ margin: 0, fontSize: 13, color: mine ? "rgba(233,237,239,0.6)" : "var(--text-muted)", fontStyle: "italic" }}>🚫 This message was deleted</p>
                            ) : (
                              <>
                                {msg.content && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" }}>{msg.content}{msg.edited && <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 5 }}>(edited)</span>}</p>}
                                {msg.fileUrl && (
                                  isImg ? (
                                    <img src={msg.fileUrl} alt={msg.fileName || "image"} onClick={() => setLightbox(msg.fileUrl)}
                                      style={{ maxWidth: 240, maxHeight: 220, borderRadius: 10, display: "block", objectFit: "cover", marginTop: msg.content ? 6 : 0, cursor: "zoom-in" }}/>
                                  ) : (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: mine ? "rgba(255,255,255,0.1)" : "var(--input-bg)", textDecoration: "none", color: mine ? "#e9edef" : "var(--text-heading)", marginTop: msg.content ? 6 : 0 }}>
                                      <FileText size={18}/><div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{msg.fileName || "File"}</p>
                                        <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Tap to download</p>
                                      </div>
                                    </a>
                                  )
                                )}
                              </>
                            )}
                          </div>

                          {/* Time + status */}
                          <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", alignItems: "center", gap: 3, marginTop: 2 }}>
                            {msg.starred && <Star size={9} style={{ color: "#f59e0b" }}/>}
                            <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)" }}>{msg.pending ? "Sending…" : fmt(msg.createdAt || Date.now())}</p>
                            {mine && !msg.pending && (
                              msg.read
                                ? <CheckCheck size={14} style={{ color: "#53bdeb" }}/>
                                : <Check size={14} style={{ color: "var(--text-muted)" }}/>
                            )}
                          </div>

                          {/* Reactions */}
                          {hasReactions && (
                            <div style={{ position: "absolute", bottom: -16, [mine ? "right" : "left"]: 8, display: "flex", gap: 3, background: "var(--sidebar-bg)", borderRadius: 20, padding: "2px 6px", border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", zIndex: 1 }}
                              onClick={() => setInfoMsg(msg)}>
                              {Object.entries(reactions).map(([e, ids]) => (
                                <span key={e} style={{ fontSize: 13 }} title={`${ids.length} ${e}`}>{e}{ids.length > 1 ? <sup style={{ fontSize: 9 }}>{ids.length}</sup> : ""}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: activeDot, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "var(--bubble-other-bg)", border: "1px solid var(--border-color)", display: "flex", gap: 4, alignItems: "center" }}>
                    <div className="typing-dot"/>
                    <div className="typing-dot"/>
                    <div className="typing-dot"/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <button onClick={scrollToBottom}
                style={{ position: "absolute", bottom: 90, right: 20, width: 40, height: 40, borderRadius: "50%", background: "var(--sidebar-bg)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", color: "var(--text-muted)", zIndex: 10 }}>
                <ChevronDown size={20}/>
              </button>
            )}

            {/* Search panel */}
            {showSearch && <SearchPanel messages={messages} myId={myId} onClose={() => setShowSearch(false)} onGoTo={scrollToMsg}/>}

            {/* Reply banner */}
            {replyTo && (
              <div style={{ padding: "8px 14px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 10 }}>
                <Reply size={16} style={{ color: "#25d366", flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0, borderLeft: "3px solid #25d366", paddingLeft: 8 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#25d366" }}>{String(replyTo.senderId?._id || replyTo.senderId) === myId ? "You" : activeName}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content || "📎 File"}</p>
                </div>
                <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16}/></button>
              </div>
            )}

            {/* Edit banner */}
            {editingMsg && (
              <div style={{ padding: "8px 14px", background: "#fffbeb", borderTop: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 10 }}>
                <Edit2 size={16} style={{ color: "#f59e0b", flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>Editing message</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#92400e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editingMsg.content}</p>
                </div>
                <button onClick={() => { setEditingMsg(null); setText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", display: "flex" }}><X size={16}/></button>
              </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", bottom: "100%", left: 0, width: "100%", display: "flex", justifyContent: "flex-start", padding: "0 14px", boxSizing: "border-box" }}>
                  <EmojiPicker onPick={handleEmojiPick} onClose={() => setShowEmoji(false)} recentEmojis={recentEmojis}/>
                </div>
              </div>
            )}

            {/* Input bar */}
            <div style={{ padding: "8px 12px", background: "var(--header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
              <input ref={fileRef} type="file" onChange={handleFile} style={{ display: "none" }}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"/>
              <button className="icon-btn" disabled={uploading} onClick={() => fileRef.current?.click()} title="Attach"
                style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--input-bg)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--text-muted)" }}>
                {uploading ? <div style={{ width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#25d366", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> : <Paperclip size={18}/>}
              </button>
              <button className="icon-btn" onClick={() => setShowEmoji(p => !p)} title="Emoji"
                style={{ width: 38, height: 38, borderRadius: "50%", background: showEmoji ? "#e7f9ed" : "var(--input-bg)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: showEmoji ? "#25d366" : "var(--text-muted)" }}>
                <Smile size={20}/>
              </button>
              <textarea ref={inputRef}
                value={editingMsg ? (editingMsg._editContent ?? editingMsg.content) : text}
                onChange={e => {
                  if (editingMsg) setEditingMsg(prev => ({ ...prev, _editContent: e.target.value }));
                  else handleTextChange(e);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (editingMsg) {
                      const content = editingMsg._editContent ?? editingMsg.content;
                      setText(content);
                      sendMsg();
                    } else sendMsg();
                  }
                }}
                placeholder={editingMsg ? "Edit message…" : `Message ${activeName}…`}
                rows={1}
                style={{ flex: 1, padding: "9px 13px", borderRadius: 20, border: "none", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: "var(--input-bg)", color: "var(--text-primary)", fontFamily: "inherit" }}/>
              <button onClick={() => {
                if (editingMsg) {
                  const content = editingMsg._editContent ?? editingMsg.content;
                  setText(content); sendMsg();
                } else sendMsg();
              }}
                disabled={(!text.trim() && !editingMsg && !uploading) || sending} className="send-btn"
                style={{ width: 38, height: 38, borderRadius: "50%", background: (text.trim() || editingMsg) ? "#25d366" : "var(--input-bg)", color: (text.trim() || editingMsg) ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {sending ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/> : <Send size={18}/>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chat-bg)", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#25d366,#128c7e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(37,211,102,0.3)", animation: "pop 0.4s ease", fontSize: 46 }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-heading)", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>LawHelpZone Messages</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 4px" }}>Send and receive messages to lawyers, clients, and admins.</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0, opacity: 0.7 }}>🔒 Messages are secured.</p>
            </div>
            <button onClick={() => setShowNew(true)} style={{ marginTop: 4, padding: "12px 28px", borderRadius: 20, background: "#25d366", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={16}/> New Conversation
            </button>
            {contacts.length > 0 && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>{contacts.length} conversation{contacts.length !== 1 ? "s" : ""}</p>}
          </div>
        )}
      </div>

      {/* ── Modals & Overlays ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} msg={contextMenu.msg} myId={myId}
          onReply={() => setReplyTo(contextMenu.msg)}
          onEdit={() => { setEditingMsg(contextMenu.msg); setText(contextMenu.msg.content); inputRef.current?.focus(); }}
          onCopy={() => navigator.clipboard?.writeText(contextMenu.msg.content || "")}
          onDelete={() => setDeleteDialog(contextMenu.msg)}
          onForward={() => setForwardMsg(contextMenu.msg)}
          onStar={() => toggleStar(contextMenu.msg._id)}
          onInfo={() => setInfoMsg(contextMenu.msg)}
          onPin={() => togglePin(contextMenu.msg)}
          onSelect={() => { setSelectMode(true); setSelectedMsgs([contextMenu.msg._id]); }}
          onReact={(e) => handleReact(contextMenu.msg._id, e)}
          onClose={() => setContextMenu(null)}
        />
      )}
      {deleteDialog && <DeleteDialog msg={deleteDialog} myId={myId} onDelete={(mode) => handleDelete(deleteDialog, mode)} onClose={() => setDeleteDialog(null)}/>}
      {forwardMsg && <ForwardDialog contacts={contacts} onForward={(ids) => handleForward(forwardMsg, ids)} onClose={() => setForwardMsg(null)}/>}
      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileU(null)} onMessage={() => { setProfileU(null); inputRef.current?.focus(); }} onCall={() => { setProfileU(null); router.push(`/dashboard/${role}/video-calls?contact=${profileUser._id}`); }}/>}
      {infoMsg && <MessageInfoPanel msg={infoMsg} onClose={() => setInfoMsg(null)}/>}
      {showStarred && <StarredPanel messages={messages} myId={myId} onClose={() => setShowStarred(false)} onGoTo={scrollToMsg}/>}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)}/>}
      {showNewConv && <NewConvPanel myId={myId} onClose={() => setShowNew(false)} onSelect={(u) => { selectContact(u); setActiveId(u._id); setActiveInfo(u); }}/>}
    </>
  );
}