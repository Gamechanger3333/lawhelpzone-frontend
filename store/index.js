// store/index.js  ← UPDATED — added paymentReducer
import { configureStore }          from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer                  from "./slices/authSlice";
import chatReducer                  from "./slices/chatSlice";
import notificationReducer          from "./slices/notificationSlice";
import casesReducer                 from "./slices/casesSlice";
import lawyersReducer               from "./slices/lawyersSlice";
import meetingsReducer              from "./slices/meetingsSlice";
import dashboardReducer             from "./slices/dashboardSlice";
import paymentReducer               from "./slices/paymentSlice";  // ← NEW

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    chat:          chatReducer,
    notifications: notificationReducer,
    cases:         casesReducer,
    lawyers:       lawyersReducer,
    meetings:      meetingsReducer,
    dashboard:     dashboardReducer,
    payment:       paymentReducer,   // ← NEW
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: process.env.NODE_ENV !== "production",
});

export const useAppDispatch = ()  => useDispatch();
export const useAppSelector = useSelector;
