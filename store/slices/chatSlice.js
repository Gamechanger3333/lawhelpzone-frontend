import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({
  "Content-Type": "application/json",
  ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
});

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchContacts = createAsyncThunk(
  "chat/fetchContacts",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/messages/contacts`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch contacts");
      return data.contacts || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (contactId, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/messages/${contactId}`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch messages");
      return { contactId, messages: data.messages || [] };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ receiverId, content, type = "text", fileUrl, fileName }, { rejectWithValue }) => {
    try {
      const body = { receiverId, content, type };
      if (fileUrl)  body.fileUrl  = fileUrl;
      if (fileName) body.fileName = fileName;

      const res  = await fetch(`${API}/api/messages`, {
        method: "POST", credentials: "include", headers: H(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to send message");
      return { contactId: receiverId, message: data.message || data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "chat/markAsRead",
  async (contactId, { rejectWithValue }) => {
    try {
      await fetch(`${API}/api/messages/${contactId}/read`, {
        method: "PATCH", credentials: "include", headers: H(),
      });
      return contactId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    contacts:        [],
    activeContactId: null,
    messages:        {},     // { [contactId]: Message[] }
    loading:         false,
    sending:         false,
    typing:          {},     // { [senderId]: boolean }
    onlineUsers:     [],
    error:           null,
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeContactId = action.payload;
    },

    receiveMessage: (state, action) => {
      const msg       = action.payload;
      const contactId = String(msg.senderId?._id || msg.senderId);

      if (!state.messages[contactId]) state.messages[contactId] = [];
      const exists = state.messages[contactId].some((m) => m._id && m._id === msg._id);
      if (!exists) state.messages[contactId].push(msg);

      const contact = state.contacts.find((c) => c._id === contactId);
      if (contact) {
        contact.lastMessage   = msg.content || (msg.fileUrl ? "📎 Attachment" : "");
        contact.lastMessageAt = msg.createdAt;
        if (contactId !== state.activeContactId) contact.unread = (contact.unread || 0) + 1;
      } else {
        state.contacts.unshift({
          _id:           contactId,
          name:          msg.senderId?.name  || "New Contact",
          role:          msg.senderId?.role  || "client",
          email:         msg.senderId?.email || "",
          lastMessage:   msg.content || "📎 Attachment",
          lastMessageAt: msg.createdAt,
          unread:        state.activeContactId === contactId ? 0 : 1,
        });
      }
    },

    setTyping: (state, action) => {
      const { senderId, isTyping } = action.payload;
      state.typing[senderId] = isTyping;
    },

    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
      state.contacts.forEach((c) => { c.isOnline = state.onlineUsers.includes(c._id); });
    },

    clearError: (state) => { state.error = null; },

    resetChat: (state) => {
      state.contacts = []; state.messages = {}; state.activeContactId = null; state.onlineUsers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchContacts.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchContacts.fulfilled, (state, action) => { state.loading = false; state.contacts = action.payload; })

      .addCase(fetchMessages.pending,   (state) => { state.loading = true; })
      .addCase(fetchMessages.rejected,  (state) => { state.loading = false; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.contactId] = action.payload.messages;
      })

      .addCase(sendMessage.pending,   (state) => { state.sending = true; })
      .addCase(sendMessage.rejected,  (state) => { state.sending = false; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { contactId, message } = action.payload;
        if (!state.messages[contactId]) state.messages[contactId] = [];
        if (!state.messages[contactId].some((m) => m._id === message._id)) {
          state.messages[contactId].push(message);
        }
        const contact = state.contacts.find((c) => c._id === contactId);
        if (contact) {
          contact.lastMessage   = message.content || "📎 Attachment";
          contact.lastMessageAt = message.createdAt;
        }
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const contact = state.contacts.find((c) => c._id === action.payload);
        if (contact) contact.unread = 0;
      });
  },
});

export const {
  setActiveConversation,
  receiveMessage,
  setTyping,
  setOnlineUsers,
  clearError,
  resetChat,
} = chatSlice.actions;

export const selectTotalUnread = (state) =>
  (state.chat.contacts || []).reduce((sum, c) => sum + (c.unread || 0), 0);

export default chatSlice.reducer;