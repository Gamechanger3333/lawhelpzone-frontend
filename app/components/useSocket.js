"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { receiveMessage } from "@/store/slices/chatSlice";
import { receiveNotification } from "@/store/slices/notificationSlice";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function useSocket(userId) {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    // Dynamically import socket.io-client (install: npm i socket.io-client)
    import("socket.io-client").then(({ io }) => {
      const socket = io(API, {
        auth: { userId },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      // Global message handler
      socket.on("new_message", (payload) => {
        dispatch(receiveMessage(payload));
      });

      // Global notification handler
      socket.on("notification", (notification) => {
        dispatch(receiveNotification(notification));
      });

      socketRef.current = socket;
    }).catch((err) => {
      console.warn("Socket.io client not installed:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, dispatch]);

  return { socket: socketRef.current, isConnected };
}