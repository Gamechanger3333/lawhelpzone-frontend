// store/slices/dashboardSlice.js
// Calls GET /api/dashboard  (role-aware — backend returns different data per role)
// Returns: { stats, recentCases, myCases, myClients, allUsers, recentNotifications, ... }

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const H   = () => {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/dashboard`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to load dashboard");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats:               {},
    recentCases:         [],
    myCases:             [],
    myClients:           [],
    allUsers:            [],
    allLawyers:          [],
    recentNotifications: [],
    loading:             false,
    error:               null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboard.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchDashboard.fulfilled, (s, a) => {
        s.loading             = false;
        s.stats               = a.payload.stats               || {};
        s.recentCases         = a.payload.recentCases         || a.payload.myCases || [];
        s.myCases             = a.payload.myCases             || [];
        s.myClients           = a.payload.myClients           || [];
        s.allUsers            = a.payload.allUsers            || [];
        s.allLawyers          = a.payload.allLawyers          || [];
        s.recentNotifications = a.payload.recentNotifications || [];
      });
  },
});

export default dashboardSlice.reducer;