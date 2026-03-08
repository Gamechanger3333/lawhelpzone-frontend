"use client";
// app/components/MessagesBadge.jsx
// Drop-in for the chat/message icon in any dashboard header.
// Polls /api/messages/contacts every 15 s to count total unread messages.
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAppSelector } from "../../store/index";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

export default function MessagesBadge({ role = "client", size = 20, color = "#fff" }) {
  const { user }  = useAppSelector(s => s.auth);
  const router    = useRouter();
  const [count, setCount]   = useState(0);
  const [pulse, setPulse]   = useState(false);
  const prevRef  = useRef(0);
  const pollRef  = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!tok()) return;
    try {
      const r = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: H() });
      if (!r.ok) return;
      const d = await r.json();
      const contacts = d.contacts || [];
      const total = contacts.reduce((sum, c) => sum + (c.unread || 0), 0);
      setCount(total);
      if (total > prevRef.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
      prevRef.current = total;
    } catch {}
  }, []);

  useEffect(() => {
    if (!tok()) return;
    fetchCount();
    pollRef.current = setInterval(fetchCount, 15_000);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  const path = role ? `/dashboard/${role}/messages` : "/dashboard/messages";

  return (
    <button
      onClick={() => router.push(path)}
      title={count > 0 ? `${count} unread message${count !== 1 ? "s" : ""}` : "Messages"}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 6,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes msgPulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
      `}</style>

      <MessageSquare
        size={size}
        style={{
          color,
          animation: pulse ? "msgPulse 0.5s ease" : "none",
          display: "block",
        }}
      />

      {count > 0 && (
        <span style={{
          position: "absolute",
          top: 1,
          right: 1,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          background: "#3b82f6",
          color: "#fff",
          fontSize: 9,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 3px",
          border: "2px solid transparent",
          boxShadow: "0 1px 4px rgba(59,130,246,0.5)",
          lineHeight: 1,
        }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}