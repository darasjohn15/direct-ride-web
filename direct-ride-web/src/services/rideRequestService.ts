import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export const RideRequestStatusValue = {
  Pending: 0,
  Accepted: 1,
  Declined: 2,
  Completed: 3,
  Cancelled: 4,
  InProgress: 5,
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

type RideRequestsResponseBody =
  | RideRequest[]
  | {
      rideRequests?: RideRequest[];
      data?: RideRequest[];
      items?: RideRequest[];
      results?: RideRequest[];
      value?: RideRequest[];
      $values?: RideRequest[];
      Items?: RideRequest[];
    };

type RideRequestResponseBody =
  | RideRequest
  | {
      rideRequest?: RideRequest;
      data?: RideRequest;
      item?: RideRequest;
      value?: RideRequest;
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

export type UpdateRideRequest = Partial<{
  riderId: string;
  driverId: string;
  availabilitySlotId: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  fareAmount: number;
  status: RideRequestStatusValue;
  slotStartTime: string;
  slotEndTime: string;
}>;

const RIDE_REQUESTS_URL = apiUrl('/ride-requests');

function getRideRequestsFromResponse(body: RideRequestsResponseBody): RideRequest[] {
  if (Array.isArray(body)) return body;

  const lists = [
    body.rideRequests,
    body.data,
    body.items,
    body.results,
    body.value,
    body.$values,
    body.Items,
  ];
  const rideRequests = lists.find((list) => Array.isArray(list));

  if (rideRequests) return rideRequests;

  throw new Error('Ride requests response did not include a ride request list.');
}

function getRideRequestFromResponse(body: RideRequestResponseBody): RideRequest {
  if ('id' in body) return body;

  const rideRequest = body.rideRequest ?? body.data ?? body.item ?? body.value;

  if (rideRequest) return rideRequest;

  throw new Error('Ride request response did not include a ride request.');
}

export const rideRequestService = {
  async getRideRequests(filters: RideRequestFilters = {}): Promise<RideRequest[]> {
    const response = await authFetch(`${RIDE_REQUESTS_URL}${buildQueryString(filters)}`);

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to fetch ride requests');
    }

    const body = await response.json() as RideRequestsResponseBody;
    return getRideRequestsFromResponse(body);
  },

  async getRideRequestById(id: string): Promise<RideRequest> {
    const response = await authFetch(`${RIDE_REQUESTS_URL}/${id}`);

    if (response.ok) {
      const body = await response.json() as RideRequestResponseBody;
      return getRideRequestFromResponse(body);
    }

    if (response.status !== 404) {
      throw await parseApiError(response, 'Failed to fetch ride request');
    }

    const rideRequests = await this.getRideRequests();
    const rideRequest = rideRequests.find((request) => request.id === id);

    if (!rideRequest) throw new Error('Ride request not found');

    return rideRequest;
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

  async updateRideRequest(id: string, data: UpdateRideRequest): Promise<RideRequest> {
    const response = await authFetch(`${RIDE_REQUESTS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to update ride request');
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return this.getRideRequestById(id);
    }

    const body = await response.json() as RideRequestResponseBody;
    return getRideRequestFromResponse(body);
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
  if (
    normalizedStatus === '5' ||
    normalizedStatus === 'inprogress' ||
    normalizedStatus === 'in-progress' ||
    normalizedStatus === 'in progress' ||
    normalizedStatus === 'started'
  ) {
    return RideRequestStatusValue.InProgress;
  }

  return RideRequestStatusValue.Pending;
}
