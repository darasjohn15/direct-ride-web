import { useMemo, useState } from 'react';
import RequestCard, {
  type RideRequest,
  type RequestStatus,
} from '../components/RequestCard';
import './DriverRequests.css';

type SortOption = 'pickup-time' | 'newest';

const initialRequests: RideRequest[] = [
  {
    id: 1,
    riderName: 'Jordan Lee',
    pickupLocation: 'Downtown Atlanta',
    dropoffLocation: 'Midtown Atlanta',
    pickupTime: '9:00 AM',
    createdAt: '2026-03-29T08:15:00',
    distanceMiles: 4.8,
    estimatedFare: 18.5,
    status: 'pending',
  },
  {
    id: 2,
    riderName: 'Avery Smith',
    pickupLocation: 'Buckhead',
    dropoffLocation: 'Hartsfield-Jackson Airport',
    pickupTime: '11:30 AM',
    createdAt: '2026-03-29T07:45:00',
    distanceMiles: 16.2,
    estimatedFare: 34.25,
    status: 'accepted',
  },
  {
    id: 3,
    riderName: 'Chris Thomas',
    pickupLocation: 'Georgia Tech',
    dropoffLocation: 'Atlantic Station',
    pickupTime: '1:15 PM',
    createdAt: '2026-03-28T18:10:00',
    distanceMiles: 2.9,
    estimatedFare: 12.0,
    status: 'denied',
  },
  {
    id: 4,
    riderName: 'Morgan Price',
    pickupLocation: 'Ponce City Market',
    dropoffLocation: 'Little Five Points',
    pickupTime: '3:45 PM',
    createdAt: '2026-03-27T16:25:00',
    distanceMiles: 5.5,
    estimatedFare: 19.75,
    status: 'completed',
  },
  {
    id: 5,
    riderName: 'Taylor Brooks',
    pickupLocation: 'West End',
    dropoffLocation: 'Decatur',
    pickupTime: '5:00 PM',
    createdAt: '2026-03-29T09:20:00',
    distanceMiles: 9.4,
    estimatedFare: 26.8,
    status: 'pending',
  },
];

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
  const [clock, period] = time.split(' ');
  const [rawHours, minutes] = clock.split(':').map(Number);
  let hours = rawHours;

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export default function DriverRequests() {
  const [activeTab, setActiveTab] = useState<RequestStatus>('pending');
  const [sortBy, setSortBy] = useState<SortOption>('pickup-time');
  const [requests, setRequests] = useState<RideRequest[]>(initialRequests);

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

  const handleAccept = (id: number) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: 'accepted' } : request
      )
    );
  };

  const handleDeny = (id: number) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: 'denied' } : request
      )
    );
  };

  const handleCancel = (id: number) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: 'denied' } : request
      )
    );
  };

  return (
    <div className="driver-requests">
      <header className="driver-requests__header">
        <div>
          <p className="driver-requests__eyebrow">Driver</p>
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
        {filteredRequests.length > 0 ? (
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