import { useEffect, useMemo, useState } from 'react';
import {
  notificationService,
  type UserNotification,
} from '../../../services/notificationService';
import './Notifications.css';

function formatNotificationDate(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatStatus(status: UserNotification['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadNotifications() {
      try {
        setIsLoading(true);
        setError('');
        const nextNotifications = await notificationService.getNotifications();
        setNotifications(nextNotifications);
      } catch {
        setNotifications([]);
        setError('Unable to load notifications.');
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const hasUnreadNotifications = useMemo(
    () => notifications.some((notification) => notification.status === 'unread'),
    [notifications]
  );

  const handleMarkAllAsRead = async () => {
    try {
      setError('');
      const readNotifications = await notificationService.markAllAsRead();
      setNotifications(readNotifications);
    } catch {
      setError('Unable to update notifications.');
    }
  };

  return (
    <div className="notifications-page">
      <header className="notifications-page__header">
        <div>
          <h1 className="notifications-page__title">Notifications</h1>
          <p className="notifications-page__subtitle">
            Review recent updates about your rides and account.
          </p>
        </div>

        <button
          type="button"
          className="notifications-page__mark-read-button"
          onClick={handleMarkAllAsRead}
          disabled={!hasUnreadNotifications || isLoading}
        >
          Mark all as read
        </button>
      </header>

      <section className="notifications-table-card">
        {error ? (
          <div className="notifications-empty-state">
            <h3>Notifications unavailable</h3>
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="notifications-empty-state">
            <h3>Loading notifications</h3>
            <p>Checking for your latest updates.</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="notifications-table-wrap">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th aria-label="Unread indicator" />
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className={
                      notification.status === 'unread'
                        ? 'notifications-table__row notifications-table__row--unread'
                        : 'notifications-table__row'
                    }
                  >
                    <td className="notifications-table__indicator-cell">
                      {notification.status === 'unread' ? (
                        <span
                          className="notifications-table__unread-dot"
                          aria-label="Unread notification"
                        />
                      ) : null}
                    </td>
                    <td data-label="Type">{notification.type}</td>
                    <td data-label="Message">{notification.message}</td>
                    <td data-label="Date">{formatNotificationDate(notification.date)}</td>
                    <td data-label="Status">
                      <span
                        className={`notifications-table__status notifications-table__status--${notification.status}`}
                      >
                        {formatStatus(notification.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="notifications-empty-state">
            <h3>No notifications yet</h3>
            <p>Updates about rides, schedules, and your account will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
