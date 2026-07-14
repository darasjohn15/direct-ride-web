import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export type NotificationStatus = 'read' | 'unread';

export type UserNotification = {
  id: string;
  type: string;
  message: string;
  date: string;
  status: NotificationStatus;
};

type ApiNotification = {
  id: string;
  notificationType?: string;
  NotificationType?: string;
  title?: string;
  Title?: string;
  message?: string;
  Message?: string;
  isRead?: boolean;
  IsRead?: boolean;
  createdAt?: string;
  CreatedAt?: string;
};

type NotificationsResponseBody =
  | ApiNotification[]
  | {
      items?: ApiNotification[];
      Items?: ApiNotification[];
      notifications?: ApiNotification[];
      data?: ApiNotification[];
      value?: ApiNotification[];
      $values?: ApiNotification[];
    };

type GetNotificationsParams = {
  page?: number;
  pageSize?: number;
};

const NOTIFICATIONS_URL = apiUrl('/notifications');

function formatNotificationType(type: string): string {
  return type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function getNotificationsFromResponse(body: NotificationsResponseBody): ApiNotification[] {
  if (Array.isArray(body)) return body;

  const notifications =
    body.items ??
    body.Items ??
    body.notifications ??
    body.data ??
    body.value ??
    body.$values;

  if (Array.isArray(notifications)) return notifications;

  throw new Error('Notifications response did not include a notification list.');
}

function mapApiNotification(notification: ApiNotification): UserNotification {
  const notificationType = notification.notificationType ?? notification.NotificationType ?? '';
  const message = notification.message ?? notification.Message ?? notification.title ?? notification.Title ?? '';
  const isRead = notification.isRead ?? notification.IsRead ?? false;

  return {
    id: notification.id,
    type: formatNotificationType(notificationType),
    message,
    date: notification.createdAt ?? notification.CreatedAt ?? '',
    status: isRead ? 'read' : 'unread',
  };
}

export const notificationService = {
  async getNotifications(params: GetNotificationsParams = {}): Promise<UserNotification[]> {
    const response = await authFetch(`${NOTIFICATIONS_URL}${buildQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 100,
    })}`);

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch notifications');
    }

    const body = await response.json() as NotificationsResponseBody;
    return getNotificationsFromResponse(body).map(mapApiNotification);
  },

  async markAllAsRead(): Promise<UserNotification[]> {
    const response = await authFetch(`${NOTIFICATIONS_URL}/read-all`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to mark notifications as read');
    }

    return this.getNotifications();
  },
};
