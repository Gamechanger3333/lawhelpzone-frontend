import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchMeetings = createAsyncThunk(
  "meetings/fetchMeetings",
  async ({ upcoming } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (upcoming) params.set("upcoming", "true");
      const res = await fetch(`${API}/api/meetings?${params}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createMeeting = createAsyncThunk(
  "meetings/createMeeting",
  async (meetingData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/meetings`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify(meetingData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateMeeting = createAsyncThunk(
  "meetings/updateMeeting",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/meetings/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  "meetings/deleteMeeting",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/meetings/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.message);
      }
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const meetingsSlice = createSlice({
  name: "meetings",
  initialState: {
    meetings: [],
    activeMeeting: null,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveMeeting: (state, action) => { state.activeMeeting = action.payload; },
    clearActiveMeeting: (state) => { state.activeMeeting = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMeeting.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings.unshift(action.payload);
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const idx = state.meetings.findIndex((m) => m._id === action.payload._id);
        if (idx !== -1) state.meetings[idx] = action.payload;
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.meetings = state.meetings.filter((m) => m._id !== action.payload);
      });
  },
});

export const { setActiveMeeting, clearActiveMeeting, clearError } = meetingsSlice.actions;
export default meetingsSlice.reducer;