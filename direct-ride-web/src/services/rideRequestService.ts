import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export const RideRequestStatusValue = {
  Pending: 0,
  Accepted: 1,
  Declined: 2,
  Completed: 3,
  Cancelled: 4,
} as const;

export type RideRequestStatusValue =
  (typeof RideRequestStatusValue)[keyof typeof RideRequestStatusValue];

export type RideRequest = {
  id: string;
  riderId: string;
  riderName?: string;
  driverId: string;
  driverName?: string;
  availabilitySlotId: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare?: number;
  fareAmount?: number;
  driverEarnings?: number;
  driverEarningsAmount?: number;
  status: RideRequestStatusValue | keyof typeof RideRequestStatusValue | string;
  slotStartTime?: string;
  slotEndTime?: string;
  createdAt: string;
  completedAt?: string | null;
  rider?: {
    firstName: string;
    lastName: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
  };
  availabilitySlot?: {
    startTime: string;
    endTime: string;
  };
};

export type RideRequestFilters = {
  riderId?: string;
  riderName?: string;
  driverId?: string;
  driverName?: string;
  availabilitySlotId?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  status?: RideRequestStatusValue | string;
  slotStartTimeFrom?: string;
  slotStartTimeTo?: string;
  slotEndTimeFrom?: string;
  slotEndTimeTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  upcomingOnly?: boolean;
};

export type CreateRideRequest = {
  riderId: string;
  driverId: string;
  availabilitySlotId: string;
  pickupLocation: string;
  dropoffLocation: string;
};

const RIDE_REQUESTS_URL = apiUrl('/ride-requests');

export const rideRequestService = {
  async getRideRequests(filters: RideRequestFilters = {}): Promise<RideRequest[]> {
    const response = await authFetch(`${RIDE_REQUESTS_URL}${buildQueryString(filters)}`);

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch ride requests');
    }

    return response.json();
  },

  async createRideRequest(data: CreateRideRequest): Promise<RideRequest> {
    const response = await authFetch(RIDE_REQUESTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to create ride request');
    }

    return response.json();
  },

  async updateRideRequestStatus(
    id: string,
    status: RideRequestStatusValue
  ): Promise<RideRequest> {
    const response = await authFetch(
      `${RIDE_REQUESTS_URL}/${id}/status${buildQueryString({ status })}`,
      { method: 'PATCH' }
    );

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to update ride request');
    }

    return response.json();
  },
};

export function getRideRequestStatusValue(
  status: RideRequest['status']
): RideRequestStatusValue {
  if (typeof status === 'number') return status;

  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === '1' || normalizedStatus === 'accepted') {
    return RideRequestStatusValue.Accepted;
  }
  if (
    normalizedStatus === '2' ||
    normalizedStatus === 'declined' ||
    normalizedStatus === 'denied'
  ) {
    return RideRequestStatusValue.Declined;
  }
  if (normalizedStatus === '3' || normalizedStatus === 'completed') {
    return RideRequestStatusValue.Completed;
  }
  if (
    normalizedStatus === '4' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled'
  ) {
    return RideRequestStatusValue.Cancelled;
  }

  return RideRequestStatusValue.Pending;
}
