"use client";
// components/payment/PayButton.jsx
//
// Drop-in pay button that opens CheckoutModal.
// Works on the lawyer profile page, case detail page, etc.
//
// Usage:
//   <PayButton
//     lawyerId={lawyer._id}
//     lawyerName={lawyer.name}
//     amount={lawyer.lawyerProfile.consultationFee}
//     caseId={caseId}              // optional
//     onSuccess={() => refetch()}
//   />

import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import CheckoutModal from "./CheckoutModal";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayButton({
  lawyerId,
  lawyerName,
  amount,
  caseId,
  onSuccess,
  label = "Pay Now",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const user            = useSelector(selectUser);
  const router          = useRouter();

  const handleClick = () => {
    if (!user) {
      // Not logged in — redirect to login
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (user.role !== "client") {
      alert("Only clients can make payments.");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || !amount}
        className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm
                    ${className}`}
      >
        <CreditCard className="w-4 h-4" />
        {label}{amount ? ` · $${Number(amount).toFixed(2)}` : ""}
      </button>

      <CheckoutModal
        isOpen={open}
        onClose={() => setOpen(false)}
        lawyerId={lawyerId}
        lawyerName={lawyerName}
        amount={Number(amount)}
        caseId={caseId}
        onSuccess={(payment) => {
          setOpen(false);
          onSuccess?.(payment);
        }}
      />
    </>
  );
}
