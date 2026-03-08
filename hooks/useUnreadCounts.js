"use client";
// hooks/useUnreadCounts.js
// Shared hook that polls for live message + notification badge counts.
// Import this in your layout header AND in each dashboard page.
//
// Usage:
//   const { msgCount, notifCount } = useUnreadCounts();
//
// The hook:
//  - Fetches on mount
//  - Polls every 10 seconds
//  - Returns { msgCount, notifCount, refresh }

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

export function useUnreadCounts(enabled = true) {
  const [msgCount,   setMsg]   = useState(0);
  const [notifCount, setNotif] = useState(0);
  const pollRef = useRef(null);

  const fetch_ = useCallback(async () => {
    if (!tok()) return;
    try {
      const [nRes, mRes] = await Promise.allSettled([
        fetch(`${API}/api/notifications/unread-count`, { credentials: "include", headers: H() }),
        fetch(`${API}/api/messages/contacts`,          { credentials: "include", headers: H() }),
      ]);

      if (nRes.status === "fulfilled" && nRes.value.ok) {
        const d = await nRes.value.json();
        setNotif(d.count ?? d.unreadCount ?? 0);
      }

      if (mRes.status === "fulfilled" && mRes.value.ok) {
        const d = await mRes.value.json();
        const total = (d.contacts || []).reduce((s, c) => s + (c.unread || 0), 0);
        setMsg(total);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetch_();
    pollRef.current = setInterval(fetch_, 10000);
    return () => clearInterval(pollRef.current);
  }, [enabled, fetch_]);

  return { msgCount, notifCount, refresh: fetch_ };
}