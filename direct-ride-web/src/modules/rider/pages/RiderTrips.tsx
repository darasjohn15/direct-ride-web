import { useMemo, useState } from 'react';
import './RiderTrips.css';

type TripStatus = 'confirmed' | 'pending' | 'completed';

type Trip = {
  id: number;
  pickupTime: string;
  tripDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  driverName: string;
  status: TripStatus;
};

const tabs: { label: string; value: TripStatus }[] = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
];

const emptyStateCopy: Record<TripStatus, string> = {
  pending: 'No pending ride requests.',
  confirmed: 'No upcoming rides.',
  completed: 'No completed trips yet.',
};

const mockTrips: Trip[] = [
  {
    id: 1,
    pickupTime: '9:30 AM',
    tripDate: '2026-03-30',
    pickupLocation: 'Ponce City Market',
    dropoffLocation: 'Midtown Atlanta',
    driverName: 'Marcus Johnson',
    status: 'confirmed',
  },
  {
    id: 2,
    pickupTime: '1:15 PM',
    tripDate: '2026-03-31',
    pickupLocation: 'Downtown Atlanta',
    dropoffLocation: 'Buckhead',
    driverName: 'Jordan Lee',
    status: 'confirmed',
  },
  {
    id: 3,
    pickupTime: '6:00 PM',
    tripDate: '2026-03-30',
    pickupLocation: 'Old Fourth Ward',
    dropoffLocation: 'Virginia-Highland',
    driverName: 'Waiting for driver match',
    status: 'pending',
  },
  {
    id: 4,
    pickupTime: '8:45 AM',
    tripDate: '2026-03-28',
    pickupLocation: 'West Midtown',
    dropoffLocation: 'Hartsfield-Jackson Airport',
    driverName: 'Taylor Brooks',
    status: 'completed',
  },
  {
    id: 5,
    pickupTime: '7:10 PM',
    tripDate: '2026-03-26',
    pickupLocation: 'Atlantic Station',
    dropoffLocation: 'Downtown Atlanta',
    driverName: 'Avery Smith',
    status: 'completed',
  },
];

function formatStatusLabel(status: TripStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function parseTripDateTime(trip: Trip): number {
  const [hourMinute, period] = trip.pickupTime.split(' ');
  const [rawHours, minutes] = hourMinute.split(':').map(Number);

  let hours = rawHours;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const date = new Date(`${trip.tripDate}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);

  return date.getTime();
}

export default function RiderTrips() {
  const [activeTab, setActiveTab] = useState<TripStatus>('confirmed');

  const filteredTrips = useMemo(() => {
    const next = mockTrips.filter((trip) => trip.status === activeTab);

    next.sort((a, b) => {
      const aTime = parseTripDateTime(a);
      const bTime = parseTripDateTime(b);

      if (activeTab === 'completed') {
        return bTime - aTime;
      }

      return aTime - bTime;
    });

    return next;
  }, [activeTab]);

  return (
    <div className="rider-trips">
      <header className="rider-trips__header">
        <div>
          <p className="rider-trips__eyebrow">Rider</p>
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
        {filteredTrips.length > 0 ? (
          filteredTrips.map((trip) => (
            <article className="trip-card" key={trip.id}>
              <div className="trip-card__top">
                <div>
                  <p className="trip-card__time">
                    {formatDateLabel(trip.tripDate)} at {trip.pickupTime}
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