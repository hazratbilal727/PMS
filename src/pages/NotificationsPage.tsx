import React, { useMemo, useState } from 'react';
import { ArrowRight, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { NotificationCategory } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearReadNotifications,
    setActiveRoute,
  } = usePMS();

  const [filter, setFilter] = useState<'All' | 'Unread' | NotificationCategory>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchTab =
        filter === 'All' ? true : filter === 'Unread' ? !n.read : n.category === filter;
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [notifications, filter, search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Notifications & Alert Center (${unreadCount} unread)`}
        description="Real-time operational alerts for low stock, expiring batches, POS sales, and purchase updates"
        actions={
          <>
            {readCount > 0 && (
              <button
                type="button"
                onClick={() => setClearConfirmOpen(true)}
                className="pms-btn-secondary"
              >
                <Trash2 className="h-4 w-4 text-slate-500" />
                <span>Clear Read ({readCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
              className="pms-btn-secondary"
            >
              <CheckCheck className="h-4 w-4 text-teal-600" />
              <span>Mark All Read</span>
            </button>
          </>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(
            ['All', 'Unread', 'Low Stock', 'Expiry Warning', 'Expired Stock', 'New Sale', 'Purchase Update'] as const
          ).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search alerts..."
          containerClassName="w-full sm:w-72"
        />
      </div>

      {/* Notification List */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications in this view"
            description="You're all caught up, or no alerts matched your current filter."
            actionLabel={filter !== 'All' || search ? 'Show All Alerts' : undefined}
            onAction={
              filter !== 'All' || search
                ? () => {
                    setFilter('All');
                    setSearch('');
                    setPage(1);
                  }
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paged.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col gap-4 px-6 py-4.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  !n.read ? 'bg-teal-50/35 dark:bg-teal-950/15' : 'hover:bg-slate-50/75 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
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
                    <span className="text-slate-400">· {formatDateTime(n.timestamp)}</span>
                    {!n.read && (
                      <span className="font-semibold text-teal-700 dark:text-teal-400">· Unread</span>
                    )}
                  </div>
                  <p className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id, !n.read)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 text-xs font-medium text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    aria-label={`Delete notification ${n.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={clearReadNotifications}
        title="Clear Read Notifications"
        message={`Remove ${readCount} read notification(s) from the alert feed? Unread alerts will remain visible.`}
        confirmLabel="Clear Read"
        tone="danger"
      />
    </div>
  );
};
