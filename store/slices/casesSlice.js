import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const H = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchCases = createAsyncThunk(
  "cases/fetchCases",
  async ({ status, category, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      if (status)   params.set("status",   status);
      if (category) params.set("category", category);
      const res  = await fetch(`${API}/api/cases?${params}`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCaseStats = createAsyncThunk(
  "cases/fetchCaseStats",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases/stats`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  "cases/fetchCaseById",
  async (id, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases/${id}`, { credentials: "include", headers: H() });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createCase = createAsyncThunk(
  "cases/createCase",
  async (caseData, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases`, {
        method: "POST", credentials: "include", headers: H(),
        body: JSON.stringify(caseData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCase = createAsyncThunk(
  "cases/updateCase",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases/${id}`, {
        method: "PUT", credentials: "include", headers: H(),
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

export const assignLawyer = createAsyncThunk(
  "cases/assignLawyer",
  async ({ caseId, lawyerId }, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases/${caseId}/assign`, {
        method: "POST", credentials: "include", headers: H(),
        body: JSON.stringify({ lawyerId }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCase = createAsyncThunk(
  "cases/deleteCase",
  async (id, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/cases/${id}`, {
        method: "DELETE", credentials: "include", headers: H(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const casesSlice = createSlice({
  name: "cases",
  initialState: {
    cases:        [],
    selectedCase: null,
    stats:        { pending: 0, active: 0, resolved: 0, closed: 0, total: 0 },
    pagination:   { page: 1, pages: 1, total: 0 },
    loading:      false,
    statsLoading: false,
    error:        null,
  },
  reducers: {
    clearSelectedCase:  (state) => { state.selectedCase = null; },
    clearError:         (state) => { state.error = null; },
    updateCaseLocally:  (state, action) => {
      const idx = state.cases.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.cases[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading    = false;
        state.cases      = action.payload.cases;
        state.pagination = {
          page:  action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total,
        };
      })
      .addCase(fetchCases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchCaseStats.pending,   (state) => { state.statsLoading = true; })
      .addCase(fetchCaseStats.fulfilled, (state, action) => { state.statsLoading = false; state.stats = action.payload; })
      .addCase(fetchCaseStats.rejected,  (state) => { state.statsLoading = false; })

      .addCase(fetchCaseById.pending,   (state) => { state.loading = true; state.selectedCase = null; })
      .addCase(fetchCaseById.fulfilled, (state, action) => { state.loading = false; state.selectedCase = action.payload; })
      .addCase(fetchCaseById.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createCase.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(createCase.fulfilled, (state, action) => {
        state.loading = false;
        state.cases.unshift(action.payload);
        state.stats.total += 1;
      })
      .addCase(createCase.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateCase.fulfilled, (state, action) => {
        const idx = state.cases.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.cases[idx] = action.payload;
        if (state.selectedCase?._id === action.payload._id) state.selectedCase = action.payload;
      })
      .addCase(updateCase.rejected, (state, action) => { state.error = action.payload; })

      .addCase(assignLawyer.fulfilled, (state, action) => {
        const idx = state.cases.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.cases[idx] = action.payload;
      })

      .addCase(deleteCase.fulfilled, (state, action) => {
        state.cases       = state.cases.filter((c) => c._id !== action.payload);
        state.stats.total = Math.max(0, state.stats.total - 1);
      })
      .addCase(deleteCase.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearSelectedCase, clearError, updateCaseLocally } = casesSlice.actions;
export default casesSlice.reducer;