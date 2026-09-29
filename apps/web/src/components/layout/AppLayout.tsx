import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PenSquare,
  BarChart3,
  Briefcase,
  GraduationCap,
  CheckSquare,
  Settings,
  Bell,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { api } from '../../lib/api.js';
import { NotificationItem } from '@linkedin-growth/shared';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Load recent notifications
    api.getNotifications()
      .then(setNotifications)
      .catch((err) => console.error('Failed to load notifications:', err));
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Networking', path: '/networking', icon: Users, badge: 'Pipeline' },
    { name: 'Content', path: '/content', icon: PenSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Leads', path: '/leads', icon: Briefcase, badge: 'Freelance' },
    { name: 'Internships', path: '/internships', icon: GraduationCap },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-800/80 lg:bg-slate-900/60 lg:backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-heading">
              LinkedIn Growth
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
              Assistant v1.0
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Human in the Loop Compliance Box */}
        <div className="p-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider">Human in the Loop</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              No unauthorized bots or scraping. Discover, analyze, approve, and act manually.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-300">System Ready</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Model: Deterministic Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl backdrop-blur-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Notifications ({unreadCount} unread)
                    </h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'rounded-lg p-2.5 text-xs transition-colors border',
                            n.read
                              ? 'border-slate-800/40 bg-slate-900/40 text-slate-400'
                              : 'border-indigo-500/30 bg-indigo-500/5 text-slate-200'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {n.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-400">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student Avatar / Profile */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                AC
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white">Alex Chen</p>
                <p className="text-[10px] text-slate-400">CS Student & Engineer</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
