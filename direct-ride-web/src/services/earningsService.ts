import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export type DailyEarnings = {
  date: string;
  dayLabel?: string;
  totalEarnings: number;
  totalRides: number;
};

export type WeeklyEarnings = {
  weekStart: string;
  weekEnd: string;
  totalEarnings: number;
  totalRides: number;
  days: DailyEarnings[];
};

const EARNINGS_URL = apiUrl('/earnings');

export const earningsService = {
  async getDailyEarnings(driverId: string, date: string): Promise<DailyEarnings> {
    const response = await authFetch(
      `${EARNINGS_URL}/drivers/${driverId}/daily${buildQueryString({ date })}`
    );

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch daily earnings');
    }

    return response.json();
  },

  async getWeeklyEarnings(driverId: string, weekStart: string): Promise<WeeklyEarnings> {
    const response = await authFetch(
      `${EARNINGS_URL}/drivers/${driverId}/weekly${buildQueryString({ weekStart })}`
    );

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch weekly earnings');
    }

    return response.json();
  },
};
