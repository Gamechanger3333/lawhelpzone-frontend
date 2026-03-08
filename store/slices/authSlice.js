// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.message);
    if (data.token) {
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 3600}`;
    }
    return data.user; // { _id, name, email, role, profileImage, emailVerified }
  } catch {
    return rejectWithValue("Server error. Please try again.");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (formData, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API}/api/auth/sign-up`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.message);
    if (data.token) {
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 3600}`;
    }
    return data.user;
  } catch {
    return rejectWithValue("Server error. Please try again.");
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API}/api/auth/check-auth`, {
      credentials: "include",
      headers:     getAuthHeader(),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.message);
    return data.user;
  } catch {
    return rejectWithValue("Failed to fetch user.");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await fetch(`${API}/api/auth/logout`, {
      method:      "POST",
      credentials: "include",
      headers:     getAuthHeader(),
    });
  } catch { /* ignore */ }
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "accessToken=; path=/; max-age=0";
  document.cookie = "refreshToken=; path=/; max-age=0";
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (body, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API}/api/auth/profile`, {
      method:      "PUT",
      headers:     { "Content-Type": "application/json", ...getAuthHeader() },
      credentials: "include",
      body:        JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data.message);
    return data.user;
  } catch {
    return rejectWithValue("Failed to update profile.");
  }
});

// ── Helper: build a "profile" object from the MongoDB user ───────────────────
// Your dashboard components were built for Supabase and expect:
//   profile.full_name, profile.avatar_url, profile.role
// We map MongoDB's user fields to that shape here.
const buildProfile = (user) => {
  if (!user) return null;
  return {
    id:         user._id,
    full_name:  user.name  || user.fullName || "",
    email:      user.email || "",
    avatar_url: user.profileImage || null,
    role:       user.role  || "client",
  };
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    // `user`    — raw MongoDB user object (has _id, name, email, role, …)
    user:        null,
    // `profile` — Supabase-compatible shape (full_name, avatar_url, role)
    //             keeps all existing dashboard components working unchanged
    profile:     null,
    loading:     false,
    error:       null,
    initialized: false,
  },
  reducers: {
    clearError:   (state) => { state.error = null; },
    clearAuth:    (state) => { state.user = null; state.profile = null; },
    setUser:      (state, action) => {
      state.user    = action.payload;
      state.profile = buildProfile(action.payload);
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    const setUserFromPayload = (state, action) => {
      state.loading     = false;
      state.user        = action.payload;
      state.profile     = buildProfile(action.payload);
      state.initialized = true;
    };

    builder
      // login
      .addCase(loginUser.pending,   pending)
      .addCase(loginUser.fulfilled, setUserFromPayload)
      .addCase(loginUser.rejected,  rejected)
      // register
      .addCase(registerUser.pending,   pending)
      .addCase(registerUser.fulfilled, setUserFromPayload)
      .addCase(registerUser.rejected,  rejected)
      // fetchMe (called on every page load to rehydrate)
      .addCase(fetchMe.pending,   (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, setUserFromPayload)
      .addCase(fetchMe.rejected,  (state) => {
        state.loading     = false;
        state.user        = null;
        state.profile     = null;
        state.initialized = true;
      })
      // logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user        = null;
        state.profile     = null;
        state.initialized = true;
      })
      // updateProfile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user    = action.payload;
        state.profile = buildProfile(action.payload);
      });
  },
});

export const { clearError, clearAuth, setUser } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser        = (state) => state.auth.user;
export const selectProfile     = (state) => state.auth.profile;
export const selectRole        = (state) => state.auth.user?.role;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError   = (state) => state.auth.error;
export const selectInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;