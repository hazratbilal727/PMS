import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCheck } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { NotificationCategory } from '../types';
import { StatusText } from '../components/ui/StatusText';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, setActiveRoute } = usePMS();
  const [filter, setFilter] = useState<'All' | 'Unread' | NotificationCategory>('All');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'All') return true;
      if (filter === 'Unread') return !n.read;
      return n.category === filter;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Notifications & Alert Center ({unreadCount} unread)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time operational alerts for low stock, expiring batches, POS sales, and purchase updates
          </p>
        </div>

        <button
          type="button"
          onClick={markAllNotificationsRead}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <CheckCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(
          ['All', 'Unread', 'Low Stock', 'Expiry Warning', 'Expired Stock', 'New Sale', 'Purchase Update'] as const
        ).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No notifications in this category.</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                !n.read ? 'bg-teal-50/30 dark:bg-teal-950/15' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusText
                    label={n.category}
                    tone={
                      n.severity === 'critical'
                        ? 'critical'
                        : n.severity === 'warning'
                        ? 'warning'
                        : n.severity === 'success'
                        ? 'ok'
                        : 'neutral'
                    }
                  />
                  <span className="text-[11px] text-slate-400">· {formatDateTime(n.timestamp)}</span>
                  {!n.read && <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">· Unread</span>}
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id, !n.read)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{n.read ? 'Mark Unread' : 'Mark Read'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id, true);
                    setActiveRoute(n.targetRoute);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                >
                  <span>Open Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
