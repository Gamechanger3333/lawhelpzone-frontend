// src/features/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:5000";
const API_URL = `${API_BASE}/api/auth`;

const fetchWithTimeout = (url, options = {}, timeout = 10000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);

// REGISTER
export const registerUser = createAsyncThunk(
  "user/register",
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// LOGIN
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// CHECK AUTH
export const checkAuth = createAsyncThunk(
  "user/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/check-auth`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }, 8000);

      if (!res.ok) {
        if (res.status === 401) return rejectWithValue("Not authenticated");
        throw new Error(`Auth check failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.user) return rejectWithValue("Invalid auth response");
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// LOGOUT
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }, 8000);
      if (!res.ok) throw new Error("Logout failed");
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// SLICE
const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    loading: false,
    isAuthenticated: false,
    authChecked: false, // important to know if auth is loaded
    error: null,
  },
  reducers: {
    resetError: (state) => { state.error = null; },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload; state.isAuthenticated = true; state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.isAuthenticated = false; })

      // LOGIN
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload; state.isAuthenticated = true; state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.isAuthenticated = false; })

      // CHECK AUTH
      .addCase(checkAuth.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload; state.isAuthenticated = true; state.authChecked = true; state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false; state.user = null; state.isAuthenticated = false; state.authChecked = true;
        if (action.payload !== "Not authenticated") state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false; state.user = null; state.isAuthenticated = false; state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload; state.user = null; state.isAuthenticated = false;
      });
  },
});

export const { resetError, clearUser } = userSlice.actions;
export default userSlice.reducer;
