import { useEffect, useMemo, useState } from 'react';
import {
  getRideRequestStatusValue,
  rideRequestService,
  RideRequestStatusValue,
  type RideRequest,
} from '../../../services/rideRequestService';
import { userService } from '../../../services/userService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import './RiderTrips.css';

type TripStatus = 'scheduled' | 'pending' | 'completed';

type Trip = {
  id: string;
  pickupDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  driverName: string;
  status: TripStatus;
};

const tabs: { label: string; value: TripStatus }[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
];

const emptyStateCopy: Record<TripStatus, string> = {
  pending: 'No pending ride requests.',
  scheduled: 'No scheduled rides.',
  completed: 'No completed trips yet.',
};

function formatStatusLabel(status: TripStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTimeLabel(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateLabel} at ${timeLabel}`;
}

function getDriverName(request: RideRequest): string {
  if (request.driverName) return request.driverName;
  if (request.driver) return `${request.driver.firstName} ${request.driver.lastName}`;
  return 'Waiting for driver match';
}

function getPickupDateTime(request: RideRequest): string {
  return (
    request.slotStartTime ??
    request.availabilitySlot?.startTime ??
    request.createdAt
  );
}

function mapRequestStatus(status: RideRequest['status']): TripStatus | null {
  const statusValue = getRideRequestStatusValue(status);

  if (statusValue === RideRequestStatusValue.Accepted) return 'scheduled';
  if (statusValue === RideRequestStatusValue.Completed) return 'completed';
  if (statusValue === RideRequestStatusValue.Pending) return 'pending';

  return null;
}

function mapRideRequestToTrip(request: RideRequest): Trip | null {
  const status = mapRequestStatus(request.status);

  if (!status) return null;

  return {
    id: request.id,
    pickupDateTime: getPickupDateTime(request),
    pickupLocation: request.pickupLocation,
    dropoffLocation: request.dropoffLocation,
    driverName: getDriverName(request),
    status,
  };
}

function parseTripDateTime(trip: Trip): number {
  const time = new Date(trip.pickupDateTime).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function RiderTrips() {
  const [activeTab, setActiveTab] = useState<TripStatus>('scheduled');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTrips() {
      try {
        setIsLoading(true);
        setError('');

        const token = getToken();
        let riderId = token ? getUserIdFromToken(token) : null;

        if (!riderId) {
          const currentUser = await userService.getCurrentUser();
          riderId = currentUser.id;
        }

        const [scheduledRequests, pendingRequests, completedRequests] = await Promise.all([
          rideRequestService.getRideRequests({
            riderId,
            status: RideRequestStatusValue.Accepted,
            upcomingOnly: true,
          }),
          rideRequestService.getRideRequests({
            riderId,
            status: RideRequestStatusValue.Pending,
          }),
          rideRequestService.getRideRequests({
            riderId,
            status: RideRequestStatusValue.Completed,
          }),
        ]);
        const rideRequests = [
          ...scheduledRequests,
          ...pendingRequests,
          ...completedRequests,
        ];

        setTrips(
          rideRequests
            .map(mapRideRequestToTrip)
            .filter((trip): trip is Trip => Boolean(trip))
        );
      } catch {
        setTrips([]);
        setError('Unable to load trips.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    const next = trips.filter((trip) => trip.status === activeTab);

    next.sort((a, b) => {
      const aTime = parseTripDateTime(a);
      const bTime = parseTripDateTime(b);

      if (activeTab === 'completed') {
        return bTime - aTime;
      }

      return aTime - bTime;
    });

    return next;
  }, [activeTab, trips]);

  return (
    <div className="rider-trips">
      <header className="rider-trips__header">
        <div>
          <h1 className="rider-trips__title">Trips</h1>
          <p className="rider-trips__subtitle">
            Track your rider requests and upcoming rides.
          </p>
        </div>
      </header>

      <section className="trips-toolbar-card">
        <div className="trips-tabs" role="tablist" aria-label="Trip statuses">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={
                activeTab === tab.value ? 'trips-tab trips-tab--active' : 'trips-tab'
              }
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="trips-list">
        {isLoading ? (
          <div className="trips-empty-state">
            <h3>Loading trips...</h3>
            <p>Your latest ride requests will appear here shortly.</p>
          </div>
        ) : error ? (
          <div className="trips-empty-state">
            <h3>{error}</h3>
            <p>Refresh the page or try again in a moment.</p>
          </div>
        ) : filteredTrips.length > 0 ? (
          filteredTrips.map((trip) => (
            <article className="trip-card" key={trip.id}>
              <div className="trip-card__top">
                <div>
                  <p className="trip-card__time">
                    {formatDateTimeLabel(trip.pickupDateTime)}
                  </p>
                </div>

                <span className={`trip-card__status trip-card__status--${trip.status}`}>
                  {formatStatusLabel(trip.status)}
                </span>
              </div>

              <div className="trip-card__middle">
                <div className="trip-card__location-box">
                  <p className="trip-card__location-label">Pickup</p>
                  <p className="trip-card__location-value">{trip.pickupLocation}</p>
                </div>

                <div className="trip-card__location-box">
                  <p className="trip-card__location-label">Dropoff</p>
                  <p className="trip-card__location-value">{trip.dropoffLocation}</p>
                </div>
              </div>

              <div className="trip-card__bottom">
                <span className="trip-card__driver-label">Driver</span>
                <span className="trip-card__driver-name">{trip.driverName}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="trips-empty-state">
            <h3>{emptyStateCopy[activeTab]}</h3>
            <p>
              Check back later or book a new ride when you&apos;re ready to head
              somewhere.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
