import { useEffect, useMemo, useState } from 'react';
import {
  getRideRequestStatusValue,
  rideRequestService,
  RideRequestStatusValue,
  type RideRequest as ApiRideRequest,
} from '../../../services/rideRequestService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import { userService } from '../../../services/userService';
import RequestCard, {
  type RideRequest,
  type RequestStatus,
} from '../components/RequestCard';
import './DriverRequests.css';

type SortOption = 'pickup-time' | 'newest';

const tabs: { label: string; value: RequestStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Denied', value: 'denied' },
  { label: 'Completed', value: 'completed' },
];

const emptyStateCopy: Record<RequestStatus, { title: string; body: string }> = {
  pending: {
    title: 'No pending requests',
    body: 'New incoming ride requests will show up here when riders book with you.',
  },
  accepted: {
    title: 'No accepted requests',
    body: 'Accepted ride requests will appear here so you can keep track of upcoming trips.',
  },
  denied: {
    title: 'No denied requests',
    body: 'Any requests you deny will appear here in case you need to review them later.',
  },
  completed: {
    title: 'No completed requests',
    body: 'Completed rides will appear here once you finish trips.',
  },
};

function parsePickupTime(time: string): number {
  if (!time.includes(':')) return Number.MAX_SAFE_INTEGER;

  const [clock, period] = time.split(' ');
  const [rawHours, minutes] = clock.split(':').map(Number);
  let hours = rawHours;

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function formatPickupTime(dateTime?: string): string {
  if (!dateTime) return 'Time unavailable';

  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPersonName(
  directName: string | undefined,
  nestedPerson: { firstName: string; lastName: string } | undefined
): string {
  if (directName) return directName;
  if (nestedPerson) return `${nestedPerson.firstName} ${nestedPerson.lastName}`;
  return 'Rider';
}

function mapRequestStatus(status: ApiRideRequest['status']): RequestStatus {
  const value = getRideRequestStatusValue(status);

  if (value === RideRequestStatusValue.Accepted) return 'accepted';
  if (value === RideRequestStatusValue.Declined || value === RideRequestStatusValue.Cancelled) {
    return 'denied';
  }
  if (value === RideRequestStatusValue.Completed) return 'completed';

  return 'pending';
}

function mapApiRideRequest(request: ApiRideRequest): RideRequest {
  const slotStartTime = request.slotStartTime ?? request.availabilitySlot?.startTime;

  return {
    id: request.id,
    riderName: getPersonName(request.riderName, request.rider),
    pickupLocation: request.pickupLocation,
    dropoffLocation: request.dropoffLocation,
    pickupTime: formatPickupTime(slotStartTime),
    createdAt: request.createdAt,
    distanceMiles: 0,
    estimatedFare: request.fare ?? 0,
    status: mapRequestStatus(request.status),
  };
}

export default function DriverRequests() {
  const [activeTab, setActiveTab] = useState<RequestStatus>('pending');
  const [sortBy, setSortBy] = useState<SortOption>('pickup-time');
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRequests() {
      try {
        setIsLoading(true);
        setError('');

        const token = getToken();
        let driverId = token ? getUserIdFromToken(token) : null;

        if (!driverId) {
          const currentUser = await userService.getCurrentUser();
          driverId = currentUser.id;
        }

        const rideRequests = await rideRequestService.getRideRequests({ driverId });
        setRequests(rideRequests.map(mapApiRideRequest));
      } catch {
        setRequests([]);
        setError('Unable to load ride requests.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const next = requests.filter((request) => request.status === activeTab);

    next.sort((a, b) => {
      if (sortBy === 'pickup-time') {
        return parsePickupTime(a.pickupTime) - parsePickupTime(b.pickupTime);
      }

      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return next;
  }, [activeTab, requests, sortBy]);

  const updateRequestStatus = async (id: string, status: RideRequestStatusValue) => {
    setError('');

    try {
      const updatedRequest = await rideRequestService.updateRideRequestStatus(id, status);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === id ? mapApiRideRequest(updatedRequest) : request
        )
      );
    } catch {
      setError('Unable to update ride request.');
    }
  };

  const handleAccept = (id: string) => {
    updateRequestStatus(id, RideRequestStatusValue.Accepted);
  };

  const handleDeny = (id: string) => {
    updateRequestStatus(id, RideRequestStatusValue.Declined);
  };

  const handleCancel = (id: string) => {
    updateRequestStatus(id, RideRequestStatusValue.Cancelled);
  };

  return (
    <div className="driver-requests">
      <header className="driver-requests__header">
        <div>
          <h1 className="driver-requests__title">Requests</h1>
          <p className="driver-requests__subtitle">
            Manage your ride requests.
          </p>
        </div>
      </header>

      <section className="requests-toolbar-card">
        <div className="requests-tabs" role="tablist" aria-label="Request statuses">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={
                activeTab === tab.value
                  ? 'requests-tab requests-tab--active'
                  : 'requests-tab'
              }
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="requests-filter">
          <label htmlFor="requestSort">Sort by</label>
          <select
            id="requestSort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="pickup-time">Pickup Time</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </section>

      <section className="requests-list">
        {error ? (
          <div className="requests-empty-state">
            <h3>Requests unavailable</h3>
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="requests-empty-state">
            <h3>Loading requests</h3>
            <p>Checking your ride requests.</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onDeny={handleDeny}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <div className="requests-empty-state">
            <h3>{emptyStateCopy[activeTab].title}</h3>
            <p>{emptyStateCopy[activeTab].body}</p>
          </div>
        )}
      </section>
    </div>
  );
}
