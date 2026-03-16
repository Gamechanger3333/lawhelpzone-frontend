// store/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({
  "Content-Type": "application/json",
  ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
});

// ─────────────────────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────────────────────

/** Check whether this lawyer's Stripe account is connected + onboarded */
export const fetchStripeStatus = createAsyncThunk(
  "payment/fetchStripeStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/stripe/status`, {
        credentials: "include",
        headers: H(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data.message || "Failed to fetch Stripe status");
      }
      return await res.json(); // { connected, onboarded, accountId?, ... }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Start Stripe Connect onboarding — returns { url } to redirect to */
export const connectStripeAccount = createAsyncThunk(
  "payment/connectStripeAccount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/stripe/connect`, {
        method: "POST",
        credentials: "include",
        headers: H(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data.message || "Failed to start Stripe connect");
      }
      return await res.json(); // { url }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Get a link to the Stripe Express dashboard for this lawyer */
export const fetchStripeDashboardLink = createAsyncThunk(
  "payment/fetchStripeDashboardLink",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/stripe/dashboard-link`, {
        method: "POST",
        credentials: "include",
        headers: H(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data.message || "Failed to fetch dashboard link");
      }
      return await res.json(); // { url }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Fetch earnings summary + payment history for the lawyer */
export const fetchEarnings = createAsyncThunk(
  "payment/fetchEarnings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API}/api/payments/earnings${qs ? `?${qs}` : ""}`, {
        credentials: "include",
        headers: H(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data.message || "Failed to fetch earnings");
      }
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Create a Stripe Checkout session — returns { url } */
export const createCheckoutSession = createAsyncThunk(
  "payment/createCheckoutSession",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/create-checkout-session`, {
        method: "POST",
        credentials: "include",
        headers: H(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data.message || "Failed to create checkout session");
      }
      return await res.json(); // { url }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  // Stripe Connect status
  stripeStatus: null,       // { connected: bool, onboarded: bool, accountId?: string }
  stripeDashboardUrl: null,

  // Earnings
  earnings: {
    totalEarned: 0,
    pendingClearance: 0,
    successfulPayments: 0,
    payments: [],           // array of Payment documents
  },

  // UI
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentError(state) {
      state.error = null;
    },
    resetStripeStatus(state) {
      state.stripeStatus = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchStripeStatus ────────────────────────────────────────────────
    builder
      .addCase(fetchStripeStatus.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchStripeStatus.fulfilled, (state, { payload }) => {
        state.loading      = false;
        state.stripeStatus = payload;
      })
      .addCase(fetchStripeStatus.rejected, (state, { payload }) => {
        state.loading      = false;
        state.error        = payload;
        // Keep a safe default so UI doesn't crash on undefined
        if (!state.stripeStatus) {
          state.stripeStatus = { connected: false, onboarded: false };
        }
      });

    // ── connectStripeAccount ─────────────────────────────────────────────
    builder
      .addCase(connectStripeAccount.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(connectStripeAccount.fulfilled, (state) => {
        state.loading = false;
        // Redirect happens in the component; no state change needed
      })
      .addCase(connectStripeAccount.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // ── fetchStripeDashboardLink ─────────────────────────────────────────
    builder
      .addCase(fetchStripeDashboardLink.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStripeDashboardLink.fulfilled, (state, { payload }) => {
        state.loading            = false;
        state.stripeDashboardUrl = payload?.url || null;
      })
      .addCase(fetchStripeDashboardLink.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // ── fetchEarnings ────────────────────────────────────────────────────
    builder
      .addCase(fetchEarnings.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchEarnings.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.earnings = {
          totalEarned:        payload?.totalEarned        ?? 0,
          pendingClearance:   payload?.pendingClearance   ?? 0,
          successfulPayments: payload?.successfulPayments ?? 0,
          payments:           Array.isArray(payload?.payments) ? payload.payments : [],
        };
      })
      .addCase(fetchEarnings.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // ── createCheckoutSession ────────────────────────────────────────────
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCheckoutSession.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });
  },
});

export const { clearPaymentError, resetStripeStatus } = paymentSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors  (safe — never return undefined, always return a typed default)
// ─────────────────────────────────────────────────────────────────────────────

export const selectStripeStatus    = (state) => state.payment?.stripeStatus    ?? null;
export const selectPaymentLoading  = (state) => state.payment?.loading         ?? false;
export const selectPaymentError    = (state) => state.payment?.error           ?? null;
export const selectEarnings        = (state) => state.payment?.earnings        ?? { totalEarned: 0, pendingClearance: 0, successfulPayments: 0, payments: [] };
export const selectStripeDashboard = (state) => state.payment?.stripeDashboardUrl ?? null;

export default paymentSlice.reducer;