"use client";
// components/payment/CheckoutModal.jsx
//
// Usage (from any client page):
//   <CheckoutModal
//     isOpen={open}
//     onClose={() => setOpen(false)}
//     lawyerId="abc123"
//     lawyerName="Sarah Ahmed"
//     amount={150}          // dollars
//     caseId="xyz"          // optional
//     onSuccess={(payment) => console.log("paid!", payment)}
//   />
//
// Requires:  npm install @stripe/react-stripe-js @stripe/stripe-js
// Add to .env.local:  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createPaymentIntent,
  clearPaymentIntent,
  selectClientSecret,
  selectCurrentPayment,
  selectPaymentLoading,
  selectPaymentError,
} from "@/store/slices/paymentSlice"
import { X, Shield, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// ── Lazy-load Stripe so it never crashes SSR ──────────────────────────────────
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise && typeof window !== "undefined") {
    import("@stripe/stripe-js").then(({ loadStripe }) => {
      stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    });
  }
  return stripePromise;
};

// ── Fee display helper ────────────────────────────────────────────────────────
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

// ── Inner form (rendered once we have a clientSecret) ────────────────────────
function StripePaymentForm({ clientSecret, paymentInfo, onSuccess, onError }) {
  const [Elements, setElements]         = useState(null);
  const [PaymentElement, setPayEl]      = useState(null);
  const [stripe, setStripe]             = useState(null);
  const [elements, setElementsInst]     = useState(null);
  const [processing, setProcessing]     = useState(false);
  const [message, setMessage]           = useState(null);
  const [succeeded, setSucceeded]       = useState(false);
  const [stripeReady, setStripeReady]   = useState(false);

  // Dynamically load @stripe/react-stripe-js
  useEffect(() => {
    import("@stripe/react-stripe-js").then((mod) => {
      setElements(() => mod.Elements);
      setPayEl(() => mod.PaymentElement);
      setStripeReady(true);
    }).catch(() => {
      setMessage("Stripe library failed to load. Please refresh.");
    });

    import("@stripe/stripe-js").then(({ loadStripe }) => {
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).then(setStripe);
    });
  }, []);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      setMessage(error.message || "Payment failed. Please try again.");
      onError?.(error.message);
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      setSucceeded(true);
      onSuccess?.(paymentInfo);
    } else {
      setMessage("Payment is processing. You'll receive a confirmation shortly.");
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
        <p className="text-gray-500 text-sm text-center">
          Your payment of {fmt(paymentInfo?.amount)} has been processed.
          The lawyer will receive {fmt(paymentInfo?.lawyerAmount)}.
        </p>
      </div>
    );
  }

  if (!stripeReady || !Elements || !PaymentElement || !stripe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-500">Loading payment form…</span>
      </div>
    );
  }

  const appearance = {
    theme: "stripe",
    variables: { colorPrimary: "#2563eb", borderRadius: "8px" },
  };

  return (
    <Elements stripe={stripe} options={{ clientSecret, appearance }}>
      <PaymentElementWrapper
        PaymentElement={PaymentElement}
        onReady={(el) => setElementsInst(el)}
        processing={processing}
        message={message}
        onSubmit={handleSubmit}
        paymentInfo={paymentInfo}
      />
    </Elements>
  );
}

// Needs to be inside <Elements> to call useElements()
function PaymentElementWrapper({ PaymentElement, processing, message, onSubmit, paymentInfo }) {
  const { useStripe, useElements } = require("@stripe/react-stripe-js");
  const stripe   = useStripe();
  const elements = useElements();

  const handleClick = async () => {
    if (!stripe || !elements) return;
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      {message && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={processing || !stripe}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay {fmt(paymentInfo?.amount)}</>
        )}
      </button>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CheckoutModal({
  isOpen,
  onClose,
  lawyerId,
  lawyerName = "the lawyer",
  amount,       // dollars (e.g. 150)
  caseId,
  onSuccess,
}) {
  const dispatch       = useDispatch();
  const clientSecret   = useSelector(selectClientSecret);
  const currentPayment = useSelector(selectCurrentPayment);
  const loading        = useSelector(selectPaymentLoading);
  const error          = useSelector(selectPaymentError);

  // Create intent when modal opens
  useEffect(() => {
    if (isOpen && lawyerId && amount && !clientSecret) {
      dispatch(createPaymentIntent({ lawyerId, amount, caseId }));
    }
  }, [isOpen, lawyerId, amount, caseId, clientSecret, dispatch]);

  // Clean up on close
  const handleClose = useCallback(() => {
    dispatch(clearPaymentIntent());
    onClose?.();
  }, [dispatch, onClose]);

  const handleSuccess = useCallback((payment) => {
    onSuccess?.(payment);
    setTimeout(() => {
      dispatch(clearPaymentIntent());
      onClose?.();
    }, 2500);
  }, [onSuccess, dispatch, onClose]);

  if (!isOpen) return null;

  const amountCents      = amount * 100;
  const platformFeeCents = Math.round(amountCents * 0.20);
  const lawyerCents      = amountCents - platformFeeCents;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Secure Payment</h2>
              <p className="text-blue-200 text-sm mt-0.5">Pay {lawyerName}</p>
            </div>
            <button onClick={handleClose} className="text-blue-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Fee breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Consultation fee</span>
              <span className="font-medium">${amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Platform fee (20%)</span>
              <span>{fmt(platformFeeCents)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Lawyer receives (80%)</span>
              <span>{fmt(lawyerCents)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total charged</span>
              <span>${amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Stripe form or loading/error */}
          {loading && !clientSecret ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-500">Setting up secure payment…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-700 font-medium">Payment setup failed</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                <button
                  onClick={() => dispatch(createPaymentIntent({ lawyerId, amount, caseId }))}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : clientSecret ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              paymentInfo={currentPayment}
              onSuccess={handleSuccess}
              onError={(msg) => console.error("Payment error:", msg)}
            />
          ) : null}

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>256-bit SSL encryption · Powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
