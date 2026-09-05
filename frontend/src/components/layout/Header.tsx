"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import api from "@/lib/api";
import { AppNotification, PagedResponse } from "@/lib/types";
import { Moon, Sun, Bell, Menu, X, Shield, BookOpen, GraduationCap, Check, CheckCheck } from "lucide-react";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onToggleMobileMenu, isMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const roleIcon = {
    Admin: <Shield className="w-4 h-4 text-purple-500" />,
    Teacher: <BookOpen className="w-4 h-4 text-sky-500" />,
    Student: <GraduationCap className="w-4 h-4 text-emerald-500" />,
  }[user?.role || "Student"];

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: Set up polling here or WebSocket for truly live, but we'll fetch on mount/toggle for now
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<PagedResponse<AppNotification>>("/Notifications/my?pageSize=20");
      setNotifications(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/Notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/Notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">{roleIcon}</div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {user?.role} Portal
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Icon & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              if (!isDropdownOpen) fetchNotifications();
            }}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3 h-3 text-[8px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px]">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    You have no notifications.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.isRead ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className={`text-sm truncate ${!notif.isRead ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}>
                            {notif.title}
                          </h4>
                          <p className={`text-xs line-clamp-2 ${!notif.isRead ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="shrink-0 self-start p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
