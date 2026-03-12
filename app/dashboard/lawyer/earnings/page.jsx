"use client";
// app/dashboard/lawyer/earnings/page.jsx

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLawyerEarnings,
  fetchStripeDashboardLink,
  selectEarnings,
  selectStripeStatus,
  selectPaymentLoading,
} from "@/store/slices/paymentSlice";
import StripeSetupBanner from "@/components/payment/StripeSetupBanner";
import PaymentHistory from "@/components/payment/PaymentHistory";
import { DollarSign, TrendingUp, Clock, ExternalLink, Loader2 } from "lucide-react";

const fmt = (cents) =>
  cents == null
    ? "$0.00"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function StatCard({ icon: Icon, label, value, color = "blue", sub }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function LawyerEarningsPage() {
  const dispatch  = useDispatch();
  const earnings  = useSelector(selectEarnings);
  const status    = useSelector(selectStripeStatus);
  const loading   = useSelector(selectPaymentLoading);

  useEffect(() => {
    dispatch(fetchLawyerEarnings());
  }, [dispatch]);

  const handleOpenStripeDashboard = async () => {
    const result = await dispatch(fetchStripeDashboardLink());
    if (result.payload?.url) {
      window.open(result.payload.url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500 text-sm mt-1">Your payment history and earnings summary</p>
        </div>

        {status?.onboarded && (
          <button
            onClick={handleOpenStripeDashboard}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Stripe Dashboard
          </button>
        )}
      </div>

      {/* Stripe setup banner */}
      <StripeSetupBanner />

      {/* Stats */}
      {earnings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Earned"
            value={fmt(earnings.totalEarnings)}
            color="green"
            sub="All-time net earnings (80% of payments)"
          />
          <StatCard
            icon={Clock}
            label="Pending Clearance"
            value={fmt(earnings.pendingEarnings)}
            color="yellow"
            sub="Payments not yet cleared by Stripe"
          />
          <StatCard
            icon={TrendingUp}
            label="Successful Payments"
            value={earnings.successfulPayments ?? 0}
            color="blue"
            sub="Total completed transactions"
          />
        </div>
      )}

      {/* Table */}
      <PaymentHistory role="lawyer" />
    </div>
  );
}
