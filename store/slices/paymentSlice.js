// store/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Client: create a PaymentIntent → returns { clientSecret, paymentId } */
export const createPaymentIntent = createAsyncThunk(
  "payment/createIntent",
  async ({ lawyerId, amount, caseId }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/create-payment-intent`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ lawyerId, amount, caseId }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { clientSecret, paymentId, platformFee, lawyerAmount, amount }
    } catch {
      return rejectWithValue("Failed to create payment.");
    }
  }
);

/** All roles: fetch payment history (role-aware on backend) */
export const fetchPaymentHistory = createAsyncThunk(
  "payment/fetchHistory",
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append("status", status);
      const res = await fetch(`${API}/api/payments/history?${params}`, {
        headers: getHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { payments, pagination }
    } catch {
      return rejectWithValue("Failed to fetch payments.");
    }
  }
);

/** Lawyer: fetch earnings summary */
export const fetchLawyerEarnings = createAsyncThunk(
  "payment/fetchEarnings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/lawyer/earnings`, {
        headers: getHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { totalEarnings, pendingEarnings, successfulPayments, payments }
    } catch {
      return rejectWithValue("Failed to fetch earnings.");
    }
  }
);

/** Admin: fetch revenue stats */
export const fetchAdminRevenue = createAsyncThunk(
  "payment/fetchRevenue",
  async (period = "month", { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/admin/revenue?period=${period}`, {
        headers: getHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch revenue.");
    }
  }
);

/** Admin: refund a payment */
export const refundPayment = createAsyncThunk(
  "payment/refund",
  async ({ paymentId, reason }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/payments/${paymentId}/refund`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
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

/** Lawyer: get Stripe Connect account status */
export const fetchStripeStatus = createAsyncThunk(
  "payment/fetchStripeStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/stripe/account-status`, {
        headers: getHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { connected, onboarded, accountId, details }
    } catch {
      return rejectWithValue("Failed to fetch Stripe status.");
    }
  }
);

/** Lawyer: start Stripe Connect onboarding → returns { url } */
export const connectStripeAccount = createAsyncThunk(
  "payment/connectStripe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/stripe/connect-account`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // { url }
    } catch {
      return rejectWithValue("Failed to start Stripe onboarding.");
    }
  }
);

/** Lawyer: get Stripe Express dashboard login link */
export const fetchStripeDashboardLink = createAsyncThunk(
  "payment/stripeDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/stripe/dashboard-link`, {
        headers: getHeaders(),
        credentials: "include",
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
    // client secret for current checkout
    clientSecret:   null,
    currentPayment: null,   // { paymentId, amount, platformFee, lawyerAmount }

    // payment history list
    payments:    [],
    pagination:  null,

    // lawyer earnings
    earnings:    null,

    // admin revenue
    revenue:     null,

    // stripe connect
    stripeStatus: null,      // { connected, onboarded, accountId }

    loading:     false,
    actionLoading: false,    // for refund / connect actions
    error:       null,
  },
  reducers: {
    clearPaymentIntent: (state) => {
      state.clientSecret   = null;
      state.currentPayment = null;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending   = (state) => { state.loading = true;  state.error = null; };
    const rejected  = (state, { payload }) => { state.loading = false; state.error = payload; };

    builder
      // createPaymentIntent
      .addCase(createPaymentIntent.pending,   pending)
      .addCase(createPaymentIntent.fulfilled, (state, { payload }) => {
        state.loading       = false;
        state.clientSecret  = payload.clientSecret;
        state.currentPayment = {
          paymentId:    payload.paymentId,
          amount:       payload.amount,
          platformFee:  payload.platformFee,
          lawyerAmount: payload.lawyerAmount,
        };
      })
      .addCase(createPaymentIntent.rejected, rejected)

      // fetchPaymentHistory
      .addCase(fetchPaymentHistory.pending,   pending)
      .addCase(fetchPaymentHistory.fulfilled, (state, { payload }) => {
        state.loading    = false;
        state.payments   = payload.payments;
        state.pagination = payload.pagination;
      })
      .addCase(fetchPaymentHistory.rejected, rejected)

      // fetchLawyerEarnings
      .addCase(fetchLawyerEarnings.pending,   pending)
      .addCase(fetchLawyerEarnings.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.earnings = payload;
      })
      .addCase(fetchLawyerEarnings.rejected, rejected)

      // fetchAdminRevenue
      .addCase(fetchAdminRevenue.pending,   pending)
      .addCase(fetchAdminRevenue.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.revenue = payload;
      })
      .addCase(fetchAdminRevenue.rejected, rejected)

      // refundPayment
      .addCase(refundPayment.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(refundPayment.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        // update the payment in list
        const idx = state.payments.findIndex((p) => p._id === payload._id);
        if (idx !== -1) state.payments[idx] = payload;
      })
      .addCase(refundPayment.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload;
      })

      // fetchStripeStatus
      .addCase(fetchStripeStatus.pending,   pending)
      .addCase(fetchStripeStatus.fulfilled, (state, { payload }) => {
        state.loading      = false;
        state.stripeStatus = payload;
      })
      .addCase(fetchStripeStatus.rejected, rejected)

      // connectStripeAccount — just redirect, no state change needed
      .addCase(connectStripeAccount.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(connectStripeAccount.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(connectStripeAccount.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })

      // fetchStripeDashboardLink
      .addCase(fetchStripeDashboardLink.pending,   (state) => { state.actionLoading = true; })
      .addCase(fetchStripeDashboardLink.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(fetchStripeDashboardLink.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; });
  },
});

export const { clearPaymentIntent, clearError } = paymentSlice.actions;

// Selectors
export const selectClientSecret   = (s) => s.payment.clientSecret;
export const selectCurrentPayment = (s) => s.payment.currentPayment;
export const selectPayments       = (s) => s.payment.payments;
export const selectPagination     = (s) => s.payment.pagination;
export const selectEarnings       = (s) => s.payment.earnings;
export const selectRevenue        = (s) => s.payment.revenue;
export const selectStripeStatus   = (s) => s.payment.stripeStatus;
export const selectPaymentLoading = (s) => s.payment.loading;
export const selectPaymentError   = (s) => s.payment.error;

export default paymentSlice.reducer;
