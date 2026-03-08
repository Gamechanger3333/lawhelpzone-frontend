// app/hooks/use-toast.js
import { toast as sonnerToast } from "../app/components/ui/sonner";
import { useCallback } from "react";

// Custom hook wrapper (optional, you can extend if needed)
export const useToast = () => {
  const notify = useCallback(
    ({ title, description, type = "default" }) => {
      if (type === "success") sonnerToast.success(title, { description });
      else if (type === "error") sonnerToast.error(title, { description });
      else if (type === "info") sonnerToast.info(title, { description });
      else sonnerToast(title, { description });
    },
    []
  );
  return { notify };
};

export const toast = sonnerToast;