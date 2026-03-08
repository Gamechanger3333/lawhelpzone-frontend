// hooks/useAuth.js
import { useAppSelector } from "@/store/store";

export const useAuth = () => {
  const { user, role, token, loading, error } = useAppSelector((state) => state.auth);
  return { user, role, token, loading, error };
};