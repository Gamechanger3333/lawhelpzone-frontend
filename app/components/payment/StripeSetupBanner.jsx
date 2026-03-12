"use client";
// components/payment/StripeSetupBanner.jsx
//
// Shows a banner on the lawyer dashboard if Stripe is not yet connected.
// Once connected + onboarded, renders null.
//
// Usage:
//   <StripeSetupBanner />   ← place near top of any lawyer dashboard page

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStripeStatus,
  connectStripeAccount,
  fetchStripeDashboardLink,
  selectStripeStatus,
  selectPaymentLoading,
} from "@/store/slices/paymentSlice";
import { AlertTriangle, ExternalLink, CheckCircle, Loader2, CreditCard } from "lucide-react";

export default function StripeSetupBanner() {
  const dispatch     = useDispatch();
  const status       = useSelector(selectStripeStatus);
  const loading      = useSelector(selectPaymentLoading);

  useEffect(() => {
    dispatch(fetchStripeStatus());
  }, [dispatch]);

  // Still loading initial status
  if (!status && loading) return null;

  // Fully set up — show nothing
  if (status?.onboarded) return null;

  const handleConnect = async () => {
    const result = await dispatch(connectStripeAccount());
    if (result.payload?.url) {
      window.location.href = result.payload.url;
    }
  };

  const handleDashboard = async () => {
    const result = await dispatch(fetchStripeDashboardLink());
    if (result.payload?.url) {
      window.open(result.payload.url, "_blank");
    }
  };

  // Connected but not fully onboarded
  if (status?.connected && !status?.onboarded) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 mb-5">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-yellow-800 text-sm">Stripe setup incomplete</p>
          <p className="text-yellow-700 text-xs mt-0.5">
            Complete your Stripe onboarding to start receiving payments.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
          Continue Setup
        </button>
      </div>
    );
  }

  // Not connected at all
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
        <CreditCard className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-blue-900 text-sm">Connect Stripe to receive payments</p>
        <p className="text-blue-700 text-xs mt-0.5">
          LawHelpZone pays you 80% of every client payment directly to your Stripe account.
          Setup takes about 5 minutes.
        </p>
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
        Connect Stripe
      </button>
    </div>
  );
}

// ── Compact version for sidebar / profile cards ───────────────────────────────
export function StripeStatusChip() {
  const dispatch = useDispatch();
  const status   = useSelector(selectStripeStatus);

  useEffect(() => {
    dispatch(fetchStripeStatus());
  }, [dispatch]);

  if (!status) return null;

  if (status.onboarded) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        Stripe Connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
      <AlertTriangle className="w-3 h-3" />
      Stripe Not Set Up
    </span>
  );
}
