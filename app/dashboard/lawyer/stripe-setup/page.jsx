"use client";
// app/dashboard/lawyer/stripe-setup/page.jsx
//
// Stripe redirects lawyer back here after onboarding.
// Query params from Stripe: none (just a return URL).
// We re-check account status and show result.
import { Suspense } from "react";   // add Suspense here
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStripeStatus,
  connectStripeAccount,
  fetchStripeDashboardLink,
  selectStripeStatus,
  selectPaymentLoading,
} from "@/store/slices/paymentSlice";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle, Clock, AlertTriangle, ExternalLink,
  Loader2, ArrowRight, RefreshCw,
} from "lucide-react";

export default function StripeSetupContent() {
  const dispatch      = useDispatch();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const status        = useSelector(selectStripeStatus);
  const loading       = useSelector(selectPaymentLoading);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Re-fetch Stripe status every time this page loads
    dispatch(fetchStripeStatus()).then(() => setChecked(true));
  }, [dispatch]);

  const handleRetry = async () => {
    const result = await dispatch(connectStripeAccount());
    if (result.payload?.url) window.location.href = result.payload.url;
  };

  const handleDashboard = async () => {
    const result = await dispatch(fetchStripeDashboardLink());
    if (result.payload?.url) window.open(result.payload.url, "_blank");
  };

  const handleRefresh = () => {
    setChecked(false);
    dispatch(fetchStripeStatus()).then(() => setChecked(true));
  };

  if (!checked || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 text-sm">Checking your Stripe account…</p>
        </div>
      </div>
    );
  }

  // ── Fully onboarded ───────────────────────────────────────────────────────
  if (status?.onboarded) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stripe Connected!</h1>
          <p className="text-gray-500 text-sm mt-2">
            You're all set. Clients can now pay you through LawHelpZone and you'll
            receive 80% of every payment directly to your Stripe account.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDashboard}
            className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Stripe Dashboard
          </button>
          <button
            onClick={() => router.push("/dashboard/lawyer/earnings")}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            View Earnings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Connected but onboarding incomplete ───────────────────────────────────
  if (status?.connected && !status?.onboarded) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almost there!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Your Stripe account exists but onboarding isn't complete yet.
            Please finish the setup to start receiving payments.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Re-check Status
          </button>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Continue Stripe Setup
          </button>
        </div>
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stripe Not Connected</h1>
        <p className="text-gray-500 text-sm mt-2">
          Connect your Stripe account to receive payments from clients.
        </p>
      </div>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-semibold"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
        Connect Stripe Account
      </button>
    </div>
  );
}

export default function StripeSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StripeSetupContent />
    </Suspense>
  );
}
