"use client";
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  markAsRead, 
  markAllAsRead, 
  clearNotifications 
} from '../store/slices/notificationsSlice';
import { requestNotificationPermission } from '../utils/notifications';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const router = useRouter();
  const dropdownRef = useRef(null);
  
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification._id}/read`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          }
        );
        dispatch(markAsRead(notification._id));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
      dispatch(markAllAsRead());
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      message: '💬',
      case_update: '📋',
      proposal: '📝',
      payment: '💰',
      review: '⭐',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-900 mb-1`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => router.push('/notifications')}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// frontend/app/notifications/page.js - Full Notifications Page
"use client";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  ArrowLeft 
} from 'lucide-react';
import { 
  markAsRead, 
  markAllAsRead 
} from '../../store/slices/notificationSlice';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [filter, setFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          }
        );
        const data = await response.json();
        // Update Redux store if needed
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (selectedType !== 'all' && n.type !== selectedType) return false;
    return true;
  });

  const types = ['all', 'message', 'case_update', 'proposal', 'payment', 'review', 'system'];

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
      dispatch(markAsRead(notificationId));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
      // Remove from Redux store
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      message: '💬',
      case_update: '📋',
      proposal: '📝',
      payment: '💰',
      review: '⭐',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {types.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg p-4 shadow-sm border transition hover:shadow-md ${
                  !notification.read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-gray-900 mb-2 ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {formatTime(notification.createdAt)}
                    </p>

                    {notification.link && (
                      <button
                        onClick={() => router.push(notification.link)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View details →
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}