"use client";
// app/dashboard/admin/payments/page.jsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminRevenue,
  selectRevenue,
  selectPaymentLoading,
} from "@/store/slices/paymentSlice";
import PaymentHistory from "@/app/components/payment/PaymentHistory";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";

const fmt = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const PERIODS = [
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year",  label: "This Year" },
  { value: "all",   label: "All Time" },
];

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
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

export default function AdminPaymentsPage() {
  const dispatch = useDispatch();
  const revenue  = useSelector(selectRevenue);
  const loading  = useSelector(selectPaymentLoading);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    dispatch(fetchAdminRevenue(period));
  }, [dispatch, period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Revenue</h1>
          <p className="text-gray-500 text-sm mt-1">Platform financial overview</p>
        </div>

        {/* Period selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Platform Revenue"
          value={fmt(revenue?.platformRevenue)}
          color="green"
          sub="20% fee from all payments"
        />
        <StatCard
          icon={TrendingUp}
          label="Gross Volume"
          value={fmt(revenue?.grossVolume)}
          color="blue"
          sub="Total payments processed"
        />
        <StatCard
          icon={CreditCard}
          label="Successful Payments"
          value={revenue?.successfulPayments ?? (loading ? "—" : 0)}
          color="purple"
          sub="Completed transactions"
        />
        <StatCard
          icon={Users}
          label="Lawyer Payouts"
          value={fmt(revenue?.lawyerPayouts)}
          color="orange"
          sub="80% paid out to lawyers"
        />
      </div>

      {/* Payment table */}
      <PaymentHistory role="admin" />
    </div>
  );
}
