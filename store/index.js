// store/index.js
import { configureStore }          from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer                  from "./slices/authSlice";
import chatReducer                  from "./slices/chatSlice";
import notificationReducer          from "./slices/notificationSlice";
import casesReducer                 from "./slices/casesSlice";
import lawyersReducer               from "./slices/lawyersSlice";
import meetingsReducer              from "./slices/meetingsSlice";
import dashboardReducer             from "./slices/dashboardSlice";
// ✅ FIXED: removed broken import from "../features/userSlice" (path didn't exist → crashed whole app)
// ✅ FIXED: added dashboardReducer so s.dashboard is never undefined

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    chat:          chatReducer,
    notifications: notificationReducer,
    cases:         casesReducer,
    lawyers:       lawyersReducer,
    meetings:      meetingsReducer,
    dashboard:     dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: process.env.NODE_ENV !== "production",
});

// ✅ FIXED: typed hooks — any file that does `import { useAppSelector } from "@/store"`
//    will now get a real function instead of undefined.
export const useAppDispatch = ()  => useDispatch();
export const useAppSelector = useSelector;   // useSelector IS a function; this just re-exports it under the expected name