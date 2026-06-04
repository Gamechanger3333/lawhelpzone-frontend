"use client";
// hooks/useSocket.js
import { useEffect, useRef }        from "react";
import { useDispatch, useSelector } from "react-redux";
import { io }                       from "socket.io-client";
import { receiveMessage, setOnlineUsers, setTyping } from "@/store/slices/chatSlice";
import { receiveNotification }      from "@/store/slices/notificationSlice";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useSocket = () => {
  const dispatch     = useDispatch();
  const socketRef    = useRef(null);
  const { user }     = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth:                 { token },
      transports:           ["websocket", "polling"],
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────────────
    socket.on("connect",       () => console.log("✅ Socket connected:", socket.id));
    socket.on("connect_error", (err) => console.error("❌ Socket error:", err.message));
    socket.on("disconnect",    (reason) => {
      if (reason === "io server disconnect") socket.connect();
    });

    // ── Chat events ───────────────────────────────────────────────────────────
    socket.on("newMessage", (message) => dispatch(receiveMessage(message)));

    socket.on("typing",        ({ senderId }) => {
      dispatch(setTyping({ senderId, isTyping: true }));
      setTimeout(() => dispatch(setTyping({ senderId, isTyping: false })), 3000);
    });
    socket.on("stopTyping",    ({ senderId }) => dispatch(setTyping({ senderId, isTyping: false })));
    socket.on("onlineUsers",   (users) => dispatch(setOnlineUsers(users)));

    // ── Notification events ───────────────────────────────────────────────────
    // "newNotification" is what utils/socket.js emitNotification sends
    socket.on("newNotification", (notification) => {
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

    // ── Case events ───────────────────────────────────────────────────────────
    socket.on("caseUpdated", ({ caseId }) => {
      dispatch(receiveNotification({
        type:      "case_update",
        title:     "Case Updated",
        body:      "Your case has been updated",
        link:      `/cases/${caseId}`,
        read:      false,
        createdAt: new Date().toISOString(),
      }));
    });

    // ── Video call stubs (implement in video-call component) ──────────────────
    socket.on("incomingCall", () => {});
    socket.on("callAccepted", () => {});
    socket.on("callEnded",    () => {});

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, dispatch]);

  // ── Emit helpers ──────────────────────────────────────────────────────────
  const emit = (event, data) => socketRef.current?.connected && socketRef.current.emit(event, data);

  return {
    socket:      socketRef.current,
    isConnected: socketRef.current?.connected || false,
    sendTyping:  (receiverId) => emit("typing",    { receiverId }),
    stopTyping:  (receiverId) => emit("stopTyping", { receiverId }),
    callUser:    (to, signal, callerName, callType) => emit("callUser",  { to, signal, callerName, callType }),
    answerCall:  (to, signal) => emit("answerCall", { to, signal }),
    endCall:     (to)         => emit("endCall",    { to }),
  };
};