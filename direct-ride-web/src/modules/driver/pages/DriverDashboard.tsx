import { useNavigate } from 'react-router-dom';
import './DriverDashboard.css';

type Ride = {
  id: number;
  riderName: string;
  pickup: string;
  dropoff: string;
  time: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
};

type PendingRequest = {
  id: number;
  riderName: string;
  pickup: string;
  dropoff: string;
  requestedTime: string;
};

type AvailabilitySlot = {
  id: number;
  startTime: string;
  endTime: string;
};

const mockDriver = {
  firstName: 'Marcus',
};

const todaysEarnings = 184.5;

const todaysRides: Ride[] = [
  {
    id: 1,
    riderName: 'Jordan',
    pickup: 'Downtown Atlanta',
    dropoff: 'Midtown Atlanta',
    time: '9:00 AM',
    status: 'Completed',
  },
  {
    id: 2,
    riderName: 'Avery',
    pickup: 'Buckhead',
    dropoff: 'Hartsfield-Jackson Airport',
    time: '11:30 AM',
    status: 'In Progress',
  },
  {
    id: 3,
    riderName: 'Taylor',
    pickup: 'West End',
    dropoff: 'Decatur',
    time: '2:00 PM',
    status: 'Scheduled',
  },
];

const pendingRequests: PendingRequest[] = [
  {
    id: 101,
    riderName: 'Chris',
    pickup: 'Atlantic Station',
    dropoff: 'Georgia Tech',
    requestedTime: '4:15 PM',
  },
  {
    id: 102,
    riderName: 'Morgan',
    pickup: 'Ponce City Market',
    dropoff: 'Little Five Points',
    requestedTime: '5:00 PM',
  },
  {
    id: 103,
    riderName: 'Skyler',
    pickup: 'Inman Park',
    dropoff: 'Virginia-Highland',
    requestedTime: '6:10 PM',
  },
];

const tomorrowAvailability: AvailabilitySlot[] = [
  {
    id: 1,
    startTime: '8:00 AM',
    endTime: '12:00 PM',
  },
  {
    id: 2,
    startTime: '2:00 PM',
    endTime: '6:00 PM',
  },
];

// To test the empty state later, change this to []
// const tomorrowAvailability: AvailabilitySlot[] = [];

export default function DriverDashboard() {
  const navigate = useNavigate();
  const visiblePendingRequests = pendingRequests.slice(0, 2);

  const handleManageSchedule = () => {
    navigate('/driver/schedule');
  };

  return (
    <div className="driver-dashboard">
      <header className="driver-dashboard__header">
        <div>
          <p className="driver-dashboard__eyebrow">Driver Dashboard</p>
          <h1 className="driver-dashboard__title">
            Good morning, {mockDriver.firstName}
          </h1>
          <p className="driver-dashboard__subtitle">
            Here’s what your day is looking like.
          </p>
        </div>
      </header>

      <section className="driver-dashboard__section">
        <div className="dashboard-card dashboard-card--highlight">
          <div className="dashboard-card__header">
            <h2>Today’s Earnings</h2>
          </div>
          <p className="dashboard-card__amount">${todaysEarnings.toFixed(2)}</p>
          <p className="dashboard-card__caption">
            Earnings updated throughout the day
          </p>
        </div>
      </section>

      <section className="driver-dashboard__section">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Today’s Rides</h2>
            <span className="dashboard-card__badge">{todaysRides.length}</span>
          </div>

          {todaysRides.length > 0 ? (
            <div className="ride-list">
              {todaysRides.map((ride) => (
                <div className="ride-item" key={ride.id}>
                  <div className="ride-item__main">
                    <h3>{ride.riderName}</h3>
                    <p>
                      <strong>Pickup:</strong> {ride.pickup}
                    </p>
                    <p>
                      <strong>Dropoff:</strong> {ride.dropoff}
                    </p>
                    <p>
                      <strong>Time:</strong> {ride.time}
                    </p>
                  </div>

                  <span
                    className={`status-pill status-pill--${ride.status
                      .toLowerCase()
                      .replace(/\s+/g, '-')}`}
                  >
                    {ride.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No rides scheduled for today.</p>
          )}
        </div>
      </section>

      <section className="driver-dashboard__grid">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Pending Requests</h2>
            <span className="dashboard-card__badge">{pendingRequests.length}</span>
          </div>

          {visiblePendingRequests.length > 0 ? (
            <div className="request-list">
              {visiblePendingRequests.map((request) => (
                <div className="request-item" key={request.id}>
                  <h3>{request.riderName}</h3>
                  <p>
                    <strong>Pickup:</strong> {request.pickup}
                  </p>
                  <p>
                    <strong>Dropoff:</strong> {request.dropoff}
                  </p>
                  <p>
                    <strong>Requested:</strong> {request.requestedTime}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No pending requests right now.</p>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Tomorrow’s Availability</h2>
          </div>

          {tomorrowAvailability.length > 0 ? (
            <div className="availability-list">
              {tomorrowAvailability.map((slot) => (
                <div className="availability-item" key={slot.id}>
                  <span>{slot.startTime}</span>
                  <span className="availability-item__divider">to</span>
                  <span>{slot.endTime}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-block">
              <p className="empty-state">
                No schedule set for tomorrow yet.
              </p>
              <p className="empty-state-subtext">
                Add your availability so riders can request trips during your hours.
              </p>
            </div>
          )}

          <button
            type="button"
            className="dashboard-button"
            onClick={handleManageSchedule}
          >
            Manage Schedule
          </button>
        </div>
      </section>
    </div>
  );
}