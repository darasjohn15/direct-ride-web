import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRideRequestStatusValue,
  RideRequestStatusValue,
  rideRequestService,
  type RideRequest as ApiRideRequest,
} from '../../../services/rideRequestService';
import { availabilityService, type AvailabilitySlot as ApiAvailabilitySlot } from '../../../services/availabilityService';
import { earningsService } from '../../../services/earningsService';
import { userService } from '../../../services/userService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import './DriverDashboard.css';

type Ride = {
  id: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  time: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  sortTime: number;
};

type PendingRequest = {
  id: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  requestedTime: string;
  sortTime: number;
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
};

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(dateTime?: string): string {
  if (!dateTime) return 'Time unavailable';

  return new Date(dateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toTimeInputValue(dateTime: string): string {
  const date = new Date(dateTime);
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`;
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
}

function formatDateTime(dateTime?: string): string {
  if (!dateTime) return 'Time unavailable';

  const date = new Date(dateTime);
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateLabel} at ${timeLabel}`;
}

function isSameLocalDay(dateTime: string | undefined, date: Date): boolean {
  if (!dateTime) return false;

  const value = new Date(dateTime);
  return (
    value.getFullYear() === date.getFullYear() &&
    value.getMonth() === date.getMonth() &&
    value.getDate() === date.getDate()
  );
}

function getPersonName(
  directName: string | undefined,
  nestedPerson: { firstName: string; lastName: string } | undefined
): string {
  if (directName) return directName;
  if (nestedPerson) return `${nestedPerson.firstName} ${nestedPerson.lastName}`;
  return 'Rider';
}

function getRequestSlotStart(request: ApiRideRequest): string | undefined {
  return request.slotStartTime ?? request.availabilitySlot?.startTime;
}

function mapRide(request: ApiRideRequest): Ride {
  const status = getRideRequestStatusValue(request.status);
  const slotStartTime = getRequestSlotStart(request);

  return {
    id: request.id,
    riderName: getPersonName(request.riderName, request.rider),
    pickup: request.pickupLocation,
    dropoff: request.dropoffLocation,
    time: formatTime(slotStartTime),
    status: getRideStatusLabel(status),
    sortTime: slotStartTime ? new Date(slotStartTime).getTime() : Number.MAX_SAFE_INTEGER,
  };
}

function getRideStatusLabel(status: RideRequestStatusValue): Ride['status'] {
  if (status === RideRequestStatusValue.Pending) return 'Pending';
  if (status === RideRequestStatusValue.Completed) return 'Completed';
  if (status === RideRequestStatusValue.Cancelled) return 'Cancelled';

  return 'Scheduled';
}

function mapPendingRequest(request: ApiRideRequest): PendingRequest {
  const slotStartTime = getRequestSlotStart(request);

  return {
    id: request.id,
    riderName: getPersonName(request.riderName, request.rider),
    pickup: request.pickupLocation,
    dropoff: request.dropoffLocation,
    requestedTime: formatDateTime(slotStartTime),
    sortTime: slotStartTime ? new Date(slotStartTime).getTime() : Number.MAX_SAFE_INTEGER,
  };
}

function mapAvailability(slot: ApiAvailabilitySlot): AvailabilitySlot {
  return {
    id: slot.id,
    startTime: toTimeInputValue(slot.startTime),
    endTime: toTimeInputValue(slot.endTime),
  };
}

function mergeOverlappingSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  if (slots.length <= 1) return slots;

  const sorted = [...slots].sort(
    (a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
  );

  const merged: AvailabilitySlot[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    const currentEnd = timeStringToMinutes(current.endTime);
    const nextStart = timeStringToMinutes(next.startTime);
    const nextEnd = timeStringToMinutes(next.endTime);

    if (nextStart <= currentEnd) {
      current.endTime = minutesToTimeString(Math.max(currentEnd, nextEnd));
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driverFirstName, setDriverFirstName] = useState('');
  const [rideRequests, setRideRequests] = useState<ApiRideRequest[]>([]);
  const [pendingRideRequests, setPendingRideRequests] = useState<ApiRideRequest[]>([]);
  const [tomorrowAvailability, setTomorrowAvailability] = useState<AvailabilitySlot[]>([]);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError('');

        const token = getToken();
        let driverId = token ? getUserIdFromToken(token) : null;

        if (!driverId) {
          const currentUser = await userService.getCurrentUser();
          driverId = currentUser.id;
          setDriverFirstName(currentUser.firstName);
        } else {
          const currentUser = await userService.getUserById(driverId);
          setDriverFirstName(currentUser.firstName);
        }

        const today = getDayRange(new Date());
        const tomorrow = getDayRange(getTomorrow());

        const [requests, pendingRequests, availability] = await Promise.all([
          rideRequestService.getRideRequests({
            driverId,
            slotStartTimeFrom: today.from,
            slotStartTimeTo: today.to,
            upcomingOnly: true,
          }),
          rideRequestService.getRideRequests({
            driverId,
            status: RideRequestStatusValue.Pending,
            upcomingOnly: true,
          }),
          availabilityService.getAvailability({
            driverId,
            startTimeFrom: tomorrow.from,
            startTimeTo: tomorrow.to,
            isBooked: false,
          }),
        ]);

        setRideRequests(requests);
        setPendingRideRequests(pendingRequests);
        setTomorrowAvailability(availability.map(mapAvailability));

        try {
          const dailyEarnings = await earningsService.getDailyEarnings(
            driverId,
            toInputDateValue(new Date())
          );
          setTodaysEarnings(dailyEarnings.totalEarnings);
        } catch {
          setTodaysEarnings(0);
        }
      } catch {
        setRideRequests([]);
        setPendingRideRequests([]);
        setTomorrowAvailability([]);
        setTodaysEarnings(0);
        setError('Unable to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const todaysRides = useMemo(() => {
    const today = new Date();

    return rideRequests
      .filter((request) => {
        const status = getRideRequestStatusValue(request.status);
        const visibleTodayStatus =
          status === RideRequestStatusValue.Accepted ||
          status === RideRequestStatusValue.Pending ||
          status === RideRequestStatusValue.Cancelled ||
          status === RideRequestStatusValue.Completed;

        return (
          isSameLocalDay(getRequestSlotStart(request), today) &&
          visibleTodayStatus
        );
      })
      .map(mapRide)
      .sort((a, b) => a.sortTime - b.sortTime);
  }, [rideRequests]);

  const pendingRequests = useMemo(() => {
    return pendingRideRequests
      .map(mapPendingRequest)
      .sort((a, b) => a.sortTime - b.sortTime);
  }, [pendingRideRequests]);

  const visiblePendingRequests = pendingRequests.slice(0, 3);
  const mergedTomorrowAvailability = useMemo(
    () => mergeOverlappingSlots(tomorrowAvailability),
    [tomorrowAvailability]
  );

  const handleManageSchedule = () => {
    navigate('/driver/schedule');
  };

  return (
    <div className="driver-dashboard">
      <header className="driver-dashboard__header">
        <div>
          <h1 className="driver-dashboard__title">
            Good morning{driverFirstName ? `, ${driverFirstName}` : ''}
          </h1>
          <p className="driver-dashboard__subtitle">
            Here's what your day is looking like.
          </p>
        </div>
      </header>

      {error ? (
        <section className="driver-dashboard__section">
          <div className="dashboard-card">
            <p className="empty-state">{error}</p>
          </div>
        </section>
      ) : null}

      <section className="driver-dashboard__section">
        <div className="dashboard-card dashboard-card--earnings">
          <div className="dashboard-card__header">
            <h2>Today's Earnings</h2>
          </div>
          <p className="dashboard-card__amount">
            {isLoading ? '...' : todaysEarnings > 0 ? `$${todaysEarnings.toFixed(2)}` : '$0.00'}
          </p>
          <p className="dashboard-card__caption">
            Earnings updated throughout the day
          </p>
        </div>
      </section>

      <section className="driver-dashboard__section">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Today's Rides</h2>
            <span className="dashboard-card__badge">{todaysRides.length}</span>
          </div>

          {isLoading ? (
            <p className="empty-state">Loading today's rides...</p>
          ) : todaysRides.length > 0 ? (
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

          {isLoading ? (
            <p className="empty-state">Loading pending requests...</p>
          ) : visiblePendingRequests.length > 0 ? (
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
            <h2>Tomorrow's Availability</h2>
          </div>

          {isLoading ? (
            <p className="empty-state">Loading tomorrow's availability...</p>
          ) : mergedTomorrowAvailability.length > 0 ? (
            <div className="availability-list">
              {mergedTomorrowAvailability.map((slot) => (
                <div className="availability-item" key={slot.id}>
                  <span>{formatTimeForDisplay(slot.startTime)}</span>
                  <span className="availability-item__divider">to</span>
                  <span>{formatTimeForDisplay(slot.endTime)}</span>
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
