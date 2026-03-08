"use client";
// hooks/useSocket.js
// ✅ FIXED (this session):
//   - Removed setSocket  — not exported by current chatSlice; socket lives in socketRef (correct pattern)
//   - Removed fetchConversations — not exported by current chatSlice; DashboardLayout handles initial fetch
//   - All other action names already corrected in previous session

import { useEffect, useRef }          from "react";
import { useDispatch, useSelector }   from "react-redux";
import { io }                         from "socket.io-client";
import {
  receiveMessage,
  setOnlineUsers,
  setTyping,
} from "@/store/slices/chatSlice";
import { receiveNotification }        from "@/store/slices/notificationSlice";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useSocket = () => {
  const dispatch     = useDispatch();
  const socketRef    = useRef(null);
  const { user }     = useSelector((state) => state.auth);
  const reconnectRef = useRef(0);
  const MAX_RETRY    = 5;

  useEffect(() => {
    // Disconnect if user logs out
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    // Avoid duplicate connections on re-render
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth:                 { token },
      transports:           ["websocket", "polling"],
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RETRY,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ─────────────────────────────────────────────────
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      reconnectRef.current = 0;
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
      reconnectRef.current++;
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") socket.connect();
    });

    socket.on("reconnect", (n) => {
      console.log(`🔄 Reconnected after ${n} attempts`);
    });

    // ── Chat events ──────────────────────────────────────────────────────────
    socket.on("newMessage", (message) => {
      console.log("📨 New message:", message);
      dispatch(receiveMessage(message));
    });

    socket.on("userTyping", ({ userId }) => {
      dispatch(setTyping({ userId, isTyping: true }));
      setTimeout(() => dispatch(setTyping({ userId, isTyping: false })), 3000);
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      dispatch(setTyping({ userId, isTyping: false }));
    });

    socket.on("onlineUsers", (users) => {
      dispatch(setOnlineUsers(users));
    });

    // ── Notification events ──────────────────────────────────────────────────
    socket.on("notification", (notification) => {
      console.log("🔔 Notification:", notification);
      dispatch(receiveNotification(notification));

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted"
      ) {
        new window.Notification("LawHelpZone", {
          body: notification.body || notification.message,
          icon: "/logo.png",
        });
      }
    });

    // Badge update (unreadCount already managed by receiveMessage reducer)
    socket.on("badge_update", ({ type, delta }) => {
      console.log("🔴 Badge update:", type, delta);
    });

    // ── Case events ──────────────────────────────────────────────────────────
    socket.on("caseUpdated", ({ caseId }) => {
      dispatch(receiveNotification({
        type:      "case",
        title:     "Case Updated",
        body:      `Case has been updated`,
        link:      `/cases/${caseId}`,
        read:      false,
        createdAt: new Date().toISOString(),
      }));
    });

    // ── Video call stubs ─────────────────────────────────────────────────────
    socket.on("incomingCall",  () => {});
    socket.on("callAnswered",  () => {});
    socket.on("callEnded",     () => {});

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, dispatch]);

  // ── Helper methods ───────────────────────────────────────────────────────────
  const sendMessage = (data) =>
    socketRef.current?.connected && socketRef.current.emit("sendMessage", data);

  const sendTyping = (receiverId) =>
    socketRef.current?.connected && socketRef.current.emit("typing", { receiverId });

  const stopTyping = (receiverId) =>
    socketRef.current?.connected && socketRef.current.emit("stopTyping", { receiverId });

  const joinCase   = (caseId) => socketRef.current?.connected && socketRef.current.emit("joinCase",   caseId);
  const leaveCase  = (caseId) => socketRef.current?.connected && socketRef.current.emit("leaveCase",  caseId);
  const callUser   = (to, offer, from) => socketRef.current?.connected && socketRef.current.emit("callUser",   { to, offer, from });
  const answerCall = (to, answer)      => socketRef.current?.connected && socketRef.current.emit("answerCall", { to, answer });
  const endCall    = (to)              => socketRef.current?.connected && socketRef.current.emit("endCall",    { to });

  return {
    socket:      socketRef.current,
    sendMessage,
    sendTyping,
    stopTyping,
    joinCase,
    leaveCase,
    callUser,
    answerCall,
    endCall,
    isConnected: socketRef.current?.connected || false,
  };
};

// ── Singleton manager (for components that need direct socket access) ──────────
let socketInstance = null;
export const initSocket       = (token) => {
  if (!socketInstance) socketInstance = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
  return socketInstance;
};
export const getSocket        = () => socketInstance;
export const disconnectSocket = () => {
  if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
};