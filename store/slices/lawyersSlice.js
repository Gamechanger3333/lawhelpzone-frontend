import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Thunks ────────────────────────────────────────────────────

export const fetchLawyers = createAsyncThunk(
  "lawyers/fetchLawyers",
  async ({ specialization, search, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      if (specialization) params.set("specialization", specialization);
      if (search) params.set("search", search);

      const res = await fetch(`${API}/api/lawyers?${params}`, {
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

export const fetchPendingLawyers = createAsyncThunk(
  "lawyers/fetchPending",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/lawyers/pending`, {
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

export const fetchLawyerById = createAsyncThunk(
  "lawyers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/lawyers/${id}`, {
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

export const verifyLawyer = createAsyncThunk(
  "lawyers/verify",
  async ({ id, action }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/lawyers/${id}/verify`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return { id, action, lawyer: data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateLawyerProfile = createAsyncThunk(
  "lawyers/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/lawyers/profile/me`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────

const lawyersSlice = createSlice({
  name: "lawyers",
  initialState: {
    lawyers: [],
    pendingLawyers: [],
    selectedLawyer: null,
    pagination: { page: 1, pages: 1, total: 0 },
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedLawyer: (state) => { state.selectedLawyer = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchLawyers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLawyers.fulfilled, (state, action) => {
        state.loading = false;
        state.lawyers = action.payload.lawyers;
        state.pagination = {
          page: action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total,
        };
      })
      .addCase(fetchLawyers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Pending
      .addCase(fetchPendingLawyers.pending, (state) => { state.loading = true; })
      .addCase(fetchPendingLawyers.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingLawyers = action.payload;
      })
      .addCase(fetchPendingLawyers.rejected, (state) => { state.loading = false; })
      // By ID
      .addCase(fetchLawyerById.pending, (state) => { state.loading = true; state.selectedLawyer = null; })
      .addCase(fetchLawyerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedLawyer = action.payload;
      })
      .addCase(fetchLawyerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify
      .addCase(verifyLawyer.fulfilled, (state, action) => {
        state.pendingLawyers = state.pendingLawyers.filter((l) => l._id !== action.payload.id);
      })
      .addCase(verifyLawyer.rejected, (state, action) => { state.error = action.payload; })
      // Update profile
      .addCase(updateLawyerProfile.fulfilled, (state, action) => {
        state.selectedLawyer = action.payload;
      })
      .addCase(updateLawyerProfile.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearSelectedLawyer, clearError } = lawyersSlice.actions;
export default lawyersSlice.reducer;