"use client";
// app/dashboard/client/payments/page.jsx

import PaymentHistory from "@/components/payment/PaymentHistory";
import { CreditCard, ShieldCheck } from "lucide-react";

export default function ClientPaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Track all your legal service payments</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-green-700 text-sm font-medium">Secured by Stripe</span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">How payments work</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Payments are processed securely through Stripe. Your lawyer receives 80% of the fee directly.
            LawHelpZone retains a 20% platform fee to maintain the service.
          </p>
        </div>
      </div>

      {/* Payment history table */}
      <PaymentHistory role="client" />
    </div>
  );
}
