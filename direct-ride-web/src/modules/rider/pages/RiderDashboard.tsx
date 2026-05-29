import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  rideRequestService,
  RideRequestStatusValue,
  type RideRequest,
} from '../../../services/rideRequestService';
import { userService } from '../../../services/userService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import './RiderDashboard.css';

type UpcomingRide = {
  id: string;
  driverName: string;
  pickupDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
};

type RecentTrip = {
  id: string;
  completedDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
};

function getDriverName(request: RideRequest): string {
  if (request.driverName) return request.driverName;
  if (request.driver) return `${request.driver.firstName} ${request.driver.lastName}`;
  return 'Driver pending';
}

function getPickupDateTime(request: RideRequest): string {
  return (
    request.slotStartTime ??
    request.availabilitySlot?.startTime ??
    request.createdAt
  );
}

function getCompletedDateTime(request: RideRequest): string {
  return request.completedAt ?? getPickupDateTime(request);
}

function getFare(request: RideRequest): number {
  return request.fareAmount ?? request.fare ?? 0;
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

function mapUpcomingRide(request: RideRequest): UpcomingRide {
  return {
    id: request.id,
    driverName: getDriverName(request),
    pickupDateTime: getPickupDateTime(request),
    pickupLocation: request.pickupLocation,
    dropoffLocation: request.dropoffLocation,
  };
}

function mapRecentTrip(request: RideRequest): RecentTrip {
  return {
    id: request.id,
    completedDateTime: getCompletedDateTime(request),
    pickupLocation: request.pickupLocation,
    dropoffLocation: request.dropoffLocation,
    fare: getFare(request),
  };
}

function parseDateTime(dateTime: string): number {
  const time = new Date(dateTime).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const [riderFirstName, setRiderFirstName] = useState('');
  const [upcomingRide, setUpcomingRide] = useState<UpcomingRide | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError('');

        const token = getToken();
        let riderId = token ? getUserIdFromToken(token) : null;

        if (riderId) {
          const rider = await userService.getUserById(riderId);
          setRiderFirstName(rider.firstName);
        } else {
          const rider = await userService.getCurrentUser();
          riderId = rider.id;
          setRiderFirstName(rider.firstName);
        }

        const [upcomingRequests, completedRequests] = await Promise.all([
          rideRequestService.getRideRequests({
            riderId,
            status: RideRequestStatusValue.Accepted,
            upcomingOnly: true,
          }),
          rideRequestService.getRideRequests({
            riderId,
            status: RideRequestStatusValue.Completed,
          }),
        ]);

        const nextUpcomingRide = upcomingRequests
          .map(mapUpcomingRide)
          .sort((a, b) => parseDateTime(a.pickupDateTime) - parseDateTime(b.pickupDateTime))[0] ?? null;
        const latestRecentTrips = completedRequests
          .map(mapRecentTrip)
          .sort(
            (a, b) =>
              parseDateTime(b.completedDateTime) - parseDateTime(a.completedDateTime)
          )
          .slice(0, 3);

        setUpcomingRide(nextUpcomingRide);
        setRecentTrips(latestRecentTrips);
      } catch {
        setUpcomingRide(null);
        setRecentTrips([]);
        setError('Unable to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleBookRide = () => {
    navigate('/rider/book-ride');
  };

  const handleViewTrips = () => {
    navigate('/rider/trips');
  };

  return (
    <div className="rider-dashboard">
      <header className="rider-dashboard__header">
        <div>
          <h1 className="rider-dashboard__title">
            {greeting}{riderFirstName ? `, ${riderFirstName}` : ''}
          </h1>
          <p className="rider-dashboard__subtitle">
            Ready to go somewhere?
          </p>
        </div>
      </header>

      <section className="rider-dashboard__section">
        <div className="rider-dashboard__cta-card">
          <div>
            <p className="rider-dashboard__cta-eyebrow">Quick Action</p>
            <h2>Book your next ride</h2>
            <p>
              Request a trip, choose your route, and get moving with DirectRide.
            </p>
          </div>

          <button
            type="button"
            className="rider-dashboard__button rider-dashboard__button--primary"
            onClick={handleBookRide}
          >
            Book a Ride
          </button>
        </div>
      </section>

      <section className="rider-dashboard__section">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Upcoming Ride</h2>
          </div>

          {isLoading ? (
            <div className="empty-state-block">
              <h3>Loading upcoming ride...</h3>
              <p>Your next scheduled ride will appear here shortly.</p>
            </div>
          ) : error ? (
            <div className="empty-state-block">
              <h3>{error}</h3>
              <p>Refresh the page or try again in a moment.</p>
            </div>
          ) : upcomingRide ? (
            <div className="active-ride-card">
              <div className="active-ride-card__top">
                <div>
                  <p className="active-ride-card__time">
                    {formatDateTimeLabel(upcomingRide.pickupDateTime)}
                  </p>
                  <h3>{upcomingRide.driverName}</h3>
                </div>

                <span className="status-pill status-pill--scheduled">Scheduled</span>
              </div>

              <div className="active-ride-card__route">
                <div className="route-box">
                  <p className="route-box__label">Pickup</p>
                  <p className="route-box__value">{upcomingRide.pickupLocation}</p>
                </div>

                <div className="route-box">
                  <p className="route-box__label">Dropoff</p>
                  <p className="route-box__value">{upcomingRide.dropoffLocation}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-block">
              <h3>No upcoming ride</h3>
              <p>
                You don&apos;t have an accepted upcoming ride right now.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rider-dashboard__section">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Recent Trips</h2>
            <button
              type="button"
              className="rider-dashboard__button rider-dashboard__button--secondary"
              onClick={handleViewTrips}
            >
              View All Trips
            </button>
          </div>

          {isLoading ? (
            <div className="empty-state-block">
              <h3>Loading recent trips...</h3>
              <p>Your completed rides will appear here shortly.</p>
            </div>
          ) : error ? (
            <div className="empty-state-block">
              <h3>{error}</h3>
              <p>Refresh the page or try again in a moment.</p>
            </div>
          ) : recentTrips.length > 0 ? (
            <div className="recent-trips-list">
              {recentTrips.map((trip) => (
                <div className="trip-item" key={trip.id}>
                  <div className="trip-item__left">
                    <p className="trip-item__date">
                      {formatDateTimeLabel(trip.completedDateTime)}
                    </p>
                    <h3>
                      {trip.pickupLocation} to {trip.dropoffLocation}
                    </h3>
                  </div>

                  <p className="trip-item__fare">${trip.fare.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-block">
              <h3>No recent trips yet</h3>
              <p>Your recent rides will show up here once you start booking.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
