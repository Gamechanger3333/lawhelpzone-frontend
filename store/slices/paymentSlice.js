import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const H   = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const createCheckoutSession = createAsyncThunk(
  "payment/createCheckoutSession",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/payments/create-checkout-session`, {
        method: "POST", headers: H(), credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { url }
    } catch {
      return rejectWithValue("Failed to create checkout session.");
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  "payment/fetchHistory",
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append("status", status);
      const res  = await fetch(`${API}/api/payments/history?${params}`, {
        headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch payments.");
    }
  }
);

export const fetchLawyerEarnings = createAsyncThunk(
  "payment/fetchEarnings",
  async (params = {}, { rejectWithValue }) => {
    try {
      const qs   = new URLSearchParams(params).toString();
      const res  = await fetch(`${API}/api/payments/earnings${qs ? `?${qs}` : ""}`, {
        headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch earnings.");
    }
  }
);

export const fetchAdminRevenue = createAsyncThunk(
  "payment/fetchRevenue",
  async (period = "month", { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/payments/admin/revenue?period=${period}`, {
        headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch revenue.");
    }
  }
);

export const refundPayment = createAsyncThunk(
  "payment/refund",
  async ({ paymentId, reason }, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/payments/${paymentId}/refund`, {
        method: "POST", headers: H(), credentials: "include",
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data.payment;
    } catch {
      return rejectWithValue("Refund failed.");
    }
  }
);

export const fetchStripeStatus = createAsyncThunk(
  "payment/fetchStripeStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/stripe/account-status`, {
        headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch Stripe status.");
    }
  }
);

export const connectStripeAccount = createAsyncThunk(
  "payment/connectStripe",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/stripe/connect-account`, {
        method: "POST", headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { url }
    } catch {
      return rejectWithValue("Failed to start Stripe onboarding.");
    }
  }
);

export const fetchStripeDashboardLink = createAsyncThunk(
  "payment/stripeDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${API}/api/stripe/dashboard-link`, {
        headers: H(), credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { url }
    } catch {
      return rejectWithValue("Failed to get dashboard link.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments:      [],
    pagination:    null,
    earnings:      null,
    revenue:       null,
    stripeStatus:  null,
    loading:       false,
    actionLoading: false,
    error:         null,
  },
  reducers: {
    clearError:        (state) => { state.error = null; },
    clearPaymentError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending  = (state)               => { state.loading = true;  state.error = null; };
    const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };

    builder
      .addCase(createCheckoutSession.pending,   pending)
      .addCase(createCheckoutSession.fulfilled, (state) => { state.loading = false; })
      .addCase(createCheckoutSession.rejected,  rejected)

      .addCase(fetchPaymentHistory.pending,   pending)
      .addCase(fetchPaymentHistory.fulfilled, (state, { payload }) => {
        state.loading    = false;
        state.payments   = payload.payments   ?? [];
        state.pagination = payload.pagination ?? null;
      })
      .addCase(fetchPaymentHistory.rejected, rejected)

      .addCase(fetchLawyerEarnings.pending,   pending)
      .addCase(fetchLawyerEarnings.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.earnings = {
          totalEarned:        payload.totalEarned        ?? 0,
          pendingClearance:   payload.pendingClearance   ?? 0,
          successfulPayments: payload.successfulPayments ?? 0,
          payments:           Array.isArray(payload.payments) ? payload.payments : [],
        };
      })
      .addCase(fetchLawyerEarnings.rejected, rejected)

      .addCase(fetchAdminRevenue.pending,   pending)
      .addCase(fetchAdminRevenue.fulfilled, (state, { payload }) => { state.loading = false; state.revenue = payload; })
      .addCase(fetchAdminRevenue.rejected,  rejected)

      .addCase(refundPayment.pending,   (state) => { state.actionLoading = true;  state.error = null; })
      .addCase(refundPayment.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.payments.findIndex((p) => p._id === payload._id);
        if (idx !== -1) state.payments[idx] = payload;
      })
      .addCase(refundPayment.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })

      .addCase(fetchStripeStatus.pending,   pending)
      .addCase(fetchStripeStatus.fulfilled, (state, { payload }) => {
        state.loading     = false;
        state.stripeStatus = payload ?? { connected: false, onboarded: false };
      })
      .addCase(fetchStripeStatus.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
        if (!state.stripeStatus) state.stripeStatus = { connected: false, onboarded: false };
      })

      .addCase(connectStripeAccount.pending,   (state) => { state.actionLoading = true;  state.error = null; })
      .addCase(connectStripeAccount.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(connectStripeAccount.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })

      .addCase(fetchStripeDashboardLink.pending,   (state) => { state.actionLoading = true; })
      .addCase(fetchStripeDashboardLink.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(fetchStripeDashboardLink.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; });
  },
});

export const { clearError, clearPaymentError } = paymentSlice.actions;

export const selectPayments       = (s) => s.payment?.payments       ?? [];
export const selectPagination     = (s) => s.payment?.pagination     ?? null;
export const selectEarnings       = (s) => s.payment?.earnings       ?? { totalEarned: 0, pendingClearance: 0, successfulPayments: 0, payments: [] };
export const selectRevenue        = (s) => s.payment?.revenue        ?? null;
export const selectStripeStatus   = (s) => s.payment?.stripeStatus   ?? null;
export const selectPaymentLoading = (s) => s.payment?.loading        ?? false;
export const selectActionLoading  = (s) => s.payment?.actionLoading  ?? false;
export const selectPaymentError   = (s) => s.payment?.error          ?? null;

export default paymentSlice.reducer;