"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/store/slices/notificationSlice";

const TYPE_CONFIG = {
  case_assigned:   { color: "bg-blue-100 text-blue-600",   label: "Case Assigned"   },
  case_updated:    { color: "bg-yellow-100 text-yellow-600", label: "Case Updated"  },
  case_closed:     { color: "bg-gray-100 text-gray-600",   label: "Case Closed"     },
  message_received:{ color: "bg-indigo-100 text-indigo-600", label: "Message"       },
  meeting_scheduled:{ color: "bg-green-100 text-green-600", label: "Meeting"        },
  lawyer_approved: { color: "bg-emerald-100 text-emerald-600", label: "Approved"    },
  lawyer_rejected: { color: "bg-red-100 text-red-600",     label: "Rejected"        },
  payment_received:{ color: "bg-purple-100 text-purple-600", label: "Payment"       },
  document_uploaded:{ color: "bg-orange-100 text-orange-600", label: "Document"     },
  system:          { color: "bg-gray-100 text-gray-600",   label: "System"          },
};

export default function NotificationsPanel() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading, pagination } = useSelector(
    (s) => s.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleMarkRead = (id) => dispatch(markAsRead(id));
  const handleMarkAll = () => dispatch(markAllAsRead());
  const handleDelete = (id) => dispatch(deleteNotification(id));

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <div
                key={n._id}
                className={`px-5 py-3.5 flex gap-3 items-start group hover:bg-gray-50 transition ${
                  !n.read ? "bg-indigo-50/40" : ""
                }`}
              >
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${config.color}`}
                >
                  {config.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? "text-gray-600" : "text-gray-900"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {!n.read && (
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>

      {pagination.pages > 1 && pagination.page < pagination.pages && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => dispatch(fetchNotifications({ page: pagination.page + 1, limit: 20 }))}
            className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}