"use client";
// components/payment/PaymentHistory.jsx
//
// Reusable payment history table — used in:
//   Client  → /dashboard/client/payments
//   Lawyer  → /dashboard/lawyer/earnings
//   Admin   → /dashboard/admin/payments
//
// Props:
//   role: "client" | "lawyer" | "admin"
//   onRefund: (paymentId) => void  — admin only

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentHistory,
  refundPayment,
  selectPayments,
  selectPagination,
  selectPaymentLoading,
  selectPaymentError,
} from "@/store/slices/paymentSlice";
import {
  CreditCard, Clock, CheckCircle, XCircle,
  RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Search, Filter,
} from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  succeeded: "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  failed:    "bg-red-100 text-red-700",
  refunded:  "bg-gray-100 text-gray-600",
  disputed:  "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS = {
  succeeded: <CheckCircle className="w-3 h-3" />,
  pending:   <Clock className="w-3 h-3" />,
  failed:    <XCircle className="w-3 h-3" />,
  refunded:  <RefreshCw className="w-3 h-3" />,
  disputed:  <AlertCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {STATUS_ICONS[status]}
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

// ── Money formatter ───────────────────────────────────────────────────────────
const fmt = (cents) => {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

// ── Date formatter ────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

// ── Refund confirm modal ──────────────────────────────────────────────────────
function RefundModal({ payment, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Confirm Refund</h3>
        <p className="text-sm text-gray-600">
          Refund <strong>{fmt(payment.amount)}</strong> to{" "}
          <strong>{payment.clientId?.name || "client"}</strong>?
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Reason for refund (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentHistory({ role = "client" }) {
  const dispatch   = useDispatch();
  const payments   = useSelector(selectPayments);
  const pagination = useSelector(selectPagination);
  const loading    = useSelector(selectPaymentLoading);
  const error      = useSelector(selectPaymentError);

  const [page, setPage]               = useState(1);
  const [statusFilter, setStatus]     = useState("");
  const [search, setSearch]           = useState("");
  const [refundTarget, setRefund]     = useState(null);
  const [refundLoading, setRefLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentHistory({ page, limit: 10, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  const handleRefundConfirm = async (reason) => {
    setRefLoading(true);
    await dispatch(refundPayment({ paymentId: refundTarget._id, reason }));
    setRefLoading(false);
    setRefund(null);
    dispatch(fetchPaymentHistory({ page, limit: 10 }));
  };

  // Client-side search filter over loaded page
  const filtered = search
    ? payments.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.stripePaymentIntentId?.toLowerCase().includes(q) ||
          p.clientId?.name?.toLowerCase().includes(q) ||
          p.lawyerId?.name?.toLowerCase().includes(q)
        );
      })
    : payments;

  const isAdmin  = role === "admin";
  const isLawyer = role === "lawyer";

  return (
    <>
      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onConfirm={handleRefundConfirm}
          onCancel={() => setRefund(null)}
          loading={refundLoading}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-gray-900 text-base flex-1">
            {isLawyer ? "Earnings History" : isAdmin ? "All Payments" : "Payment History"}
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                {!isLawyer && <th className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Client</th>}
                {!role.startsWith("client") && <th className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Lawyer</th>}
                <th className="px-5 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                {isLawyer && <th className="px-5 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Your Earnings</th>}
                {isAdmin && <th className="px-5 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Platform Fee</th>}
                <th className="px-5 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                {isAdmin && <th className="px-5 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isAdmin ? 7 : 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-5 py-12 text-center">
                    <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No payments found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    {!isLawyer && (
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-900">{p.clientId?.name || "—"}</span>
                      </td>
                    )}
                    {!role.startsWith("client") && (
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-900">{p.lawyerId?.name || "—"}</span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {fmt(p.amount)}
                    </td>
                    {isLawyer && (
                      <td className="px-5 py-4 text-right font-semibold text-green-600 whitespace-nowrap">
                        {fmt(p.lawyerAmount)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-5 py-4 text-right text-blue-600 font-medium whitespace-nowrap">
                        {fmt(p.platformFee)}
                      </td>
                    )}
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-center">
                        {p.paymentStatus === "succeeded" && (
                          <button
                            onClick={() => setRefund(p)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50 transition-colors"
                          >
                            Refund
                          </button>
                        )}
                        {p.paymentStatus === "refunded" && (
                          <span className="text-xs text-gray-400">Refunded</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.pages || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
