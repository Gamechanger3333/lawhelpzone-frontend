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
    recentUsers:         [],
    recentNotifications: [],
    lawyerProfile:       {},
    loading:             false,
    error:               null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        const p             = action.payload;
        state.loading             = false;
        state.stats               = p.stats               || {};
        state.recentCases         = p.recentCases         || p.myCases || [];
        state.myCases             = p.myCases             || [];
        state.myClients           = p.myClients           || [];
        state.recentUsers         = p.recentUsers         || [];
        state.lawyerProfile       = p.lawyerProfile       || {};
        state.recentNotifications = p.recentNotifications || [];
      });
  },
});

export default dashboardSlice.reducer;