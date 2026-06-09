"use client";
// AiChatWidget.jsx — Floating AI Legal Assistant
// Har page pe show hota hai (client + lawyer dashboard)
// POST /api/ai/chat se connect karta hai

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, MessageSquare, Minimize2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({
  "Content-Type": "application/json",
  ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
});

const NAVY = "#0A1A3F";

const SUGGESTED = [
  "What is a legal notice?",
  "How do I file a case?",
  "What are my tenant rights?",
  "Explain contract breach",
];

export default function AiChatWidget() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // { role: "user"|"assistant", content }
  const [error,   setError]   = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, open, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (msg) => {
    const text = (msg || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setHistory(h => [...h, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: H(),
        credentials: "include",
        body: JSON.stringify({
          message: text,
          history: history.slice(-6), // last 6 messages for context
        }),
      });
      const data = await res.json();

      if (data.success) {
        setHistory(h => [...h, { role: "assistant", content: data.reply }]);
      } else {
        setError(data.message || "AI unavailable. Please try again.");
        // Remove user message on error
        setHistory(h => h.slice(0, -1));
      }
    } catch {
      setError("Connection error. Please try again.");
      setHistory(h => h.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => { setHistory([]); setError(""); };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Legal Assistant"
        style={{
          position: "fixed",
          bottom: 80,       // above mobile nav bar
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: NAVY,
          border: "none",
          boxShadow: "0 4px 20px rgba(10,26,63,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(10,26,63,0.5)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,26,63,0.4)";
        }}
      >
        {open
          ? <X size={20} color="#fff" />
          : <Bot size={22} color="#fff" />
        }
        {/* Unread indicator dot when closed and has history */}
        {!open && history.length > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            width: 8, height: 8, borderRadius: "50%",
            background: "#3b82f6", border: "2px solid #0A1A3F",
          }} />
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 144,  // above floating button
            right: 20,
            width: 340,
            maxHeight: 480,
            borderRadius: 18,
            background: "var(--card-bg, #fff)",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            overflow: "hidden",
            animation: "chatSlideUp 0.25s ease",
          }}
        >
          {/* Header */}
          <div style={{
            background: NAVY, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={16} color="#93c5fd" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>AI Legal Assistant</p>
                <p style={{ margin: 0, fontSize: 10, color: "#93c5fd" }}>Powered by Gemini · Not legal advice</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {history.length > 0 && (
                <button onClick={clearChat} title="Clear chat"
                  style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 10,
            minHeight: 0,
          }}>
            {/* Welcome message */}
            {history.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", paddingTop: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={24} color="#3b82f6" />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-heading, #0f172a)", textAlign: "center" }}>
                  Legal Information Assistant
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted, #64748b)", textAlign: "center", lineHeight: 1.6 }}>
                  Ask me about legal topics, procedures, or your rights. I provide general information only.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 }}>
                  {SUGGESTED.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{
                        padding: "5px 10px", borderRadius: 20, border: "1px solid #e2e8f0",
                        background: "var(--card-bg, #fff)", fontSize: 11, color: "#374151",
                        cursor: "pointer", fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--card-bg, #fff)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {history.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "9px 12px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? NAVY : "var(--bg, #f1f5f9)",
                  color: msg.role === "user" ? "#fff" : "var(--text-primary, #374151)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "9px 14px", borderRadius: "14px 14px 14px 4px",
                  background: "var(--bg, #f1f5f9)",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
                      animation: `chatDot 1.2s ease infinite`,
                      animationDelay: `${i * 0.2}s`,
                      display: "inline-block",
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#dc2626",
              }}>
                <AlertCircle size={12} />{error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "flex-end", gap: 8,
            background: "var(--card-bg, #fff)",
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a legal question..."
              rows={1}
              style={{
                flex: 1, padding: "8px 12px",
                borderRadius: 10, border: "1px solid #e2e8f0",
                fontSize: 13, outline: "none", resize: "none",
                background: "var(--bg, #f8fafc)",
                color: "var(--text-primary, #374151)",
                fontFamily: "inherit", lineHeight: 1.5,
                maxHeight: 80, overflowY: "auto",
              }}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: input.trim() && !loading ? NAVY : "#e2e8f0",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              {loading
                ? <Loader2 size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
                : <Send size={14} color={input.trim() ? "#fff" : "#94a3b8"} />
              }
            </button>
          </div>

          {/* Disclaimer */}
          <p style={{
            margin: 0, fontSize: 10, color: "#94a3b8", textAlign: "center",
            padding: "4px 12px 8px", background: "var(--card-bg, #fff)", flexShrink: 0,
          }}>
            ⚠️ General info only — not legal advice
          </p>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
