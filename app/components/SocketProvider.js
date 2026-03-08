"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "@/store";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const { user } = useAppSelector((s) => s.auth);
  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [connected, setConnected]           = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs]     = useState(0);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setUnreadMessages(0);
      setUnreadNotifs(0);
      return;
    }

    import("socket.io-client").then(({ io }) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("join", { userId: user._id || user.id });
      });
      socket.on("disconnect", () => setConnected(false));

      socket.on("newMessage", (msg) => {
        setUnreadMessages((n) => n + 1);
        listenersRef.current.forEach((fn) => fn("message", msg));
      });
      socket.on("notification", (notif) => {
        setUnreadNotifs((n) => n + 1);
        listenersRef.current.forEach((fn) => fn("notification", notif));
      });
      socket.on("incomingCall", (data) => {
        listenersRef.current.forEach((fn) => fn("call", data));
      });
      socket.on("messageSeen", (data) => {
        listenersRef.current.forEach((fn) => fn("seen", data));
      });

      socketRef.current = socket;
    });

    // fetch initial unread counts
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const h = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    Promise.all([
      fetch(`${base}/api/messages/unread-count`,       { credentials: "include", headers: h }),
      fetch(`${base}/api/notifications/unread-count`,  { credentials: "include", headers: h }),
    ]).then(async ([m, n]) => {
      if (m.ok) { const d = await m.json(); setUnreadMessages(d.count ?? 0); }
      if (n.ok) { const d = await n.json(); setUnreadNotifs(d.count ?? 0); }
    }).catch(() => {});

    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [user]);

  const emit        = useCallback((ev, data) => socketRef.current?.emit(ev, data), []);
  const addListener = useCallback((fn) => {
    listenersRef.current.push(fn);
    return () => { listenersRef.current = listenersRef.current.filter((f) => f !== fn); };
  }, []);
  const clearUnreadMessages = useCallback(() => setUnreadMessages(0), []);
  const clearUnreadNotifs   = useCallback(() => setUnreadNotifs(0), []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, connected,
      unreadMessages, unreadNotifs,
      emit, addListener, clearUnreadMessages, clearUnreadNotifs,
    }}>
      {children}
    </SocketContext.Provider>
  );
}