import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export type AvailabilitySlot = {
  id: string;
  driverId: string;
  driverName?: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  createdAt?: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    baseFare?: number;
  };
};

export type AvailabilityFilters = {
  driverId?: string;
  driverName?: string;
  startTimeFrom?: string;
  startTimeTo?: string;
  endTimeFrom?: string;
  endTimeTo?: string;
  isBooked?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type CreateAvailabilityRequest = {
  driverId: string;
  startTime: string;
  endTime: string;
};

const AVAILABILITY_URL = apiUrl('/availability');

export const availabilityService = {
  async getAvailability(filters: AvailabilityFilters = {}): Promise<AvailabilitySlot[]> {
    const response = await authFetch(`${AVAILABILITY_URL}${buildQueryString(filters)}`);

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch availability');
    }

    return response.json();
  },

  async createAvailability(data: CreateAvailabilityRequest): Promise<AvailabilitySlot> {
    const response = await authFetch(AVAILABILITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to create availability');
    }

    return response.json();
  },

  async createAvailabilityWindow(data: CreateAvailabilityRequest): Promise<AvailabilitySlot[]> {
    const response = await authFetch(AVAILABILITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to create availability');
    }

    const body = await response.json();
    return Array.isArray(body) ? body : [body];
  },
};
