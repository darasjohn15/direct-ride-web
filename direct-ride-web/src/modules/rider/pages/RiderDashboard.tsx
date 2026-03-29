import { useNavigate } from 'react-router-dom';
import './RiderDashboard.css';

type RideStatus = 'driver-assigned' | 'on-the-way' | 'scheduled';

type ActiveRide = {
  driverName: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: RideStatus;
};

type RecentTrip = {
  id: number;
  date: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
};

const mockRider = {
  firstName: 'Avery',
};

const activeRide: ActiveRide | null = {
  driverName: 'Marcus Johnson',
  pickupTime: 'Today at 5:15 PM',
  pickupLocation: 'Ponce City Market',
  dropoffLocation: 'Midtown Atlanta',
  status: 'driver-assigned',
};

// To test empty state later, change this to null
// const activeRide: ActiveRide | null = null;

const recentTrips: RecentTrip[] = [
  {
    id: 1,
    date: 'Mar 27, 2026',
    pickupLocation: 'Downtown Atlanta',
    dropoffLocation: 'Buckhead',
    fare: 22.5,
  },
  {
    id: 2,
    date: 'Mar 24, 2026',
    pickupLocation: 'Old Fourth Ward',
    dropoffLocation: 'Hartsfield-Jackson Airport',
    fare: 36.75,
  },
  {
    id: 3,
    date: 'Mar 21, 2026',
    pickupLocation: 'West Midtown',
    dropoffLocation: 'Virginia-Highland',
    fare: 18.2,
  },
];

function formatRideStatus(status: RideStatus): string {
  if (status === 'driver-assigned') return 'Driver Assigned';
  if (status === 'on-the-way') return 'On the Way';
  return 'Scheduled';
}

export default function RiderDashboard() {
  const navigate = useNavigate();

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
          <p className="rider-dashboard__eyebrow">Rider</p>
          <h1 className="rider-dashboard__title">
            Good afternoon, {mockRider.firstName}
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
            <h2>Current Ride Status</h2>
          </div>

          {activeRide ? (
            <div className="active-ride-card">
              <div className="active-ride-card__top">
                <div>
                  <p className="active-ride-card__time">{activeRide.pickupTime}</p>
                  <h3>{activeRide.driverName}</h3>
                </div>

                <span
                  className={`status-pill status-pill--${activeRide.status}`}
                >
                  {formatRideStatus(activeRide.status)}
                </span>
              </div>

              <div className="active-ride-card__route">
                <div className="route-box">
                  <p className="route-box__label">Pickup</p>
                  <p className="route-box__value">{activeRide.pickupLocation}</p>
                </div>

                <div className="route-box">
                  <p className="route-box__label">Dropoff</p>
                  <p className="route-box__value">{activeRide.dropoffLocation}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-block">
              <h3>No active ride</h3>
              <p>
                You don&apos;t have a current or upcoming ride right now.
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

          {recentTrips.length > 0 ? (
            <div className="recent-trips-list">
              {recentTrips.map((trip) => (
                <div className="trip-item" key={trip.id}>
                  <div className="trip-item__left">
                    <p className="trip-item__date">{trip.date}</p>
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