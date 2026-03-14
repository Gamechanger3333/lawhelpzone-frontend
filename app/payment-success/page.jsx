"use client";
// app/payment-success/page.jsx
//
// Stripe redirects here after payment (return_url in confirmPayment).
// We read the payment_intent query param to show status.

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const user         = useSelector(selectUser);

  const paymentIntentId            = searchParams.get("payment_intent");
  const paymentIntentClientSecret  = searchParams.get("payment_intent_client_secret");
  const redirectStatus             = searchParams.get("redirect_status");

  const [status, setStatus] = useState("loading"); // loading | succeeded | processing | failed

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus("failed");
      return;
    }
    // Map Stripe redirect_status to our UI state
    if (redirectStatus === "succeeded") setStatus("succeeded");
    else if (redirectStatus === "processing") setStatus("processing");
    else setStatus("failed");
  }, [paymentIntentId, redirectStatus]);

  const dashBase = user ? `/dashboard/${user.role}` : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center space-y-5">

        {status === "loading" && (
          <>
            <Loader2 className="w-14 h-14 animate-spin text-blue-600 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Checking payment…</h1>
          </>
        )}

        {status === "succeeded" && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
              <p className="text-gray-500 text-sm mt-2">
                Your payment has been confirmed. You'll receive a notification shortly.
              </p>
            </div>
          </>
        )}

        {status === "processing" && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
              <p className="text-gray-500 text-sm mt-2">
                Your payment is being processed. This can take a moment.
                You'll receive a confirmation email once completed.
              </p>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
              <p className="text-gray-500 text-sm mt-2">
                Something went wrong. Your card was not charged. Please try again.
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            onClick={() => router.push(dashBase)}
            className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          {(status === "succeeded" || status === "processing") && user?.role === "client" && (
            <button
              onClick={() => router.push("/dashboard/client/payments")}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              View Payments
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}