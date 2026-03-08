"use client";
// components/ChatPanel.jsx
// Full chat UI used inside each role's messages page.
//
// ── Features ──────────────────────────────────────────────────────────────────
//   • Loads contact list from /api/messages/contacts on mount
//   • Auto-selects the contact specified by ?contact=userId in the URL
//   • After logout + login: contacts + messages come from the DB (always persisted)
//   • Real-time messages via Redux (useSocket wires the 'newMessage' socket event)
//   • Typing indicators
//   • Online status dots
//   • File/image attachment support

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector }                  from "react-redux";
import { useSearchParams, useRouter }                from "next/navigation";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  setActiveConversation,
} from "@/store/slices/chatSlice";

export default function ChatPanel({ role }) {
  const dispatch       = useDispatch();
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const urlContactId   = searchParams.get("contact");

  const { conversations, messages, activeConversation, loading, typing, onlineUsers } =
    useSelector((s) => s.chat);
  const currentUser = useSelector((s) => s.auth.user);

  const [selectedContact, setSelectedContact] = useState(null);
  const [text, setText]                        = useState("");
  const [search, setSearch]                    = useState("");
  const messagesEndRef                         = useRef(null);
  const inputRef                               = useRef(null);

  // ── Load contacts on mount ─────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // ── Auto-select contact from URL param ────────────────────────────────────
  useEffect(() => {
    if (!conversations.length) return;

    if (urlContactId) {
      const contact = conversations.find((c) => String(c._id) === urlContactId);
      if (contact && String(contact._id) !== String(selectedContact?._id)) {
        openChat(contact);
      }
    } else if (!selectedContact && conversations.length > 0) {
      // No param → open first contact automatically
      openChat(conversations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlContactId, conversations.length]);

  // ── Scroll to bottom when messages arrive ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[activeConversation]]);

  const openChat = useCallback((contact) => {
    const id = String(contact._id);
    setSelectedContact(contact);
    dispatch(setActiveConversation(id));
    dispatch(fetchMessages(id));
    dispatch(markAsRead(id));
    // Update URL silently so refresh / share preserves the open chat
    router.replace(`/dashboard/${role}/messages?contact=${id}`, { scroll: false });
    inputRef.current?.focus();
  }, [dispatch, role, router]);

  const handleSend = () => {
    if (!text.trim() || !selectedContact) return;
    dispatch(sendMessage({ receiverId: String(selectedContact._id), content: text.trim() }));
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isOnline = (id) => onlineUsers.includes(String(id));
  const isTyping = (id) => !!typing[String(id)];
  const initials = (name) => name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const fmtTime  = (d)    => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const filteredContacts = conversations.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const currentMessages = activeConversation ? (messages[activeConversation] || []) : [];
  const myId = String(currentUser?._id);

  // ── Role badge colours ─────────────────────────────────────────────────────
  const roleColour = { lawyer: "bg-purple-100 text-purple-700", admin: "bg-red-100 text-red-700", client: "bg-blue-100 text-blue-700" };

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Left: Contacts sidebar ─────────────────────────────────────────── */}
      <aside className="w-72 flex flex-col border-r border-gray-100">

        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base mb-3">Messages</h2>
          <div className="relative">
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {loading && filteredContacts.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">Loading contacts…</div>
          )}
          {!loading && filteredContacts.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages will appear here</p>
            </div>
          )}
          {filteredContacts.map((contact) => {
            const active = selectedContact?._id === contact._id;
            return (
              <div
                key={contact._id}
                onClick={() => openChat(contact)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors
                  ${active ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {contact.profileImage ? (
                    <img src={contact.profileImage} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {initials(contact.name)}
                    </div>
                  )}
                  {isOnline(contact._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${active || contact.unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {contact.name}
                    </span>
                    {contact.unread > 0 && (
                      <span className="ml-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${contact.unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {isTyping(contact._id) ? (
                      <span className="text-blue-500 italic">typing…</span>
                    ) : (
                      contact.lastMessage || "No messages yet"
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Right: Chat area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
              <div className="relative flex-shrink-0">
                {selectedContact.profileImage ? (
                  <img src={selectedContact.profileImage} alt={selectedContact.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {initials(selectedContact.name)}
                  </div>
                )}
                {isOnline(selectedContact._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{selectedContact.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${roleColour[selectedContact.role] || "bg-gray-100 text-gray-600"}`}>
                    {selectedContact.role}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {isTyping(selectedContact._id)
                    ? <span className="text-blue-500 italic">typing…</span>
                    : isOnline(selectedContact._id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
              {currentMessages.length === 0 && !loading && (
                <div className="text-center mt-16">
                  <div className="text-4xl mb-2">👋</div>
                  <p className="text-sm text-gray-400">Start the conversation with {selectedContact.name}</p>
                </div>
              )}
              {currentMessages.map((msg, i) => {
                const mine = String(msg.senderId) === myId || String(msg.senderId?._id) === myId;
                const showTime = i === 0 || fmtTime(currentMessages[i - 1]?.createdAt) !== fmtTime(msg.createdAt);
                return (
                  <div key={msg._id || i}>
                    {showTime && i > 0 && (
                      <div className="text-center my-2">
                        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">{fmtTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
                          {initials(selectedContact.name)}
                        </div>
                      )}
                      <div className={`group max-w-xs lg:max-w-md`}>
                        {msg.fileUrl ? (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm border
                              ${mine ? "bg-blue-500 text-white rounded-br-sm border-blue-500" : "bg-white text-gray-800 rounded-bl-sm"}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="truncate max-w-[160px]">{msg.fileName || "Attachment"}</span>
                          </a>
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                            ${mine
                              ? "bg-blue-500 text-white rounded-br-sm"
                              : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"}`}>
                            {msg.content}
                          </div>
                        )}
                        <p className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${mine ? "text-right text-gray-400" : "text-gray-400"}`}>
                          {fmtTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping(selectedContact._id) && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2">
                    {initials(selectedContact.name)}
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none py-2 focus:outline-none max-h-24 overflow-y-auto"
                  placeholder={`Message ${selectedContact.name}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="flex-shrink-0 w-9 h-9 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className={`h-4 w-4 ${text.trim() ? "text-white" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Your messages</h3>
              <p className="text-sm text-gray-400">Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}