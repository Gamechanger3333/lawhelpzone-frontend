// app/providers/ReduxProvider.jsx
"use client";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "../../store/index";
import { fetchMe } from "../../store/slices/authSlice";

export default function ReduxProvider({ children }) {
  useEffect(() => {
    store.dispatch(fetchMe()); // ← this is the missing piece
  }, []);

  return <Provider store={store}>{children}</Provider>;
}