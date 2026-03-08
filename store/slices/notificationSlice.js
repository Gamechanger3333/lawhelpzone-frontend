// store/slices/notificationSlice.js
// ✅ FIXED:
//   1. Removed axios dependency (was importing axios but package may not be installed)
//   2. Token key: 'accessToken' → 'token' (matches what authSlice stores)
//   3. markAsRead:    PUT  → PATCH  (matches notificationRoutes.js)
//   4. markAllAsRead: PUT  → PATCH  (matches notificationRoutes.js: PATCH /read-all)
//   5. Added receiveNotification action (was missing — useSocket needs it)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ✅ FIXED: was localStorage.getItem('accessToken') — auth stores as 'token'
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({
  "Content-Type": "application/json",
  ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
});

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/notifications?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers:     H(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      // ✅ FIXED: was PUT, backend uses PATCH
      await fetch(`${API}/api/notifications/${notificationId}/read`, {
        method:      "PATCH",
        credentials: "include",
        headers:     H(),
      });
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ FIXED: was PUT /read-all, backend uses PATCH /read-all
      await fetch(`${API}/api/notifications/read-all`, {
        method:      "PATCH",
        credentials: "include",
        headers:     H(),
      });
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await fetch(`${API}/api/notifications/${notificationId}`, {
        method:      "DELETE",
        credentials: "include",
        headers:     H(),
      });
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount:   0,
    loading:       false,
    error:         null,
    pagination:    { page: 1, pages: 1, total: 0 },
  },
  reducers: {
    // ✅ ADDED: this was missing — useSocket dispatches receiveNotification
    receiveNotification: (state, action) => {
      const notif = action.payload;
      // Prepend to list (newest first)
      state.notifications.unshift(notif);
      if (!notif.read) state.unreadCount += 1;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending,   (state) => { state.loading = true; })
      .addCase(fetchNotifications.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading       = false;
        state.notifications = action.payload.notifications  || [];
        state.unreadCount   = action.payload.unreadCount    ?? 0;
        state.pagination    = action.payload.pagination     || { page: 1, pages: 1, total: 0 };
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.notifications.find((n) => n._id === action.payload);
        if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex((n) => n._id === action.payload);
        if (idx !== -1) {
          const wasUnread = !state.notifications[idx].read;
          state.notifications.splice(idx, 1);
          if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { receiveNotification, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;