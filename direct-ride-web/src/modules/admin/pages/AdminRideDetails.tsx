import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRideRequestStatusValue,
  rideRequestService,
  RideRequestStatusValue,
  type RideRequest,
} from '../../../services/rideRequestService';
import { type User, userService } from '../../../services/userService';
import './AdminPages.css';
import './AdminUserDetails.css';

type RideStatusLabel = 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled';

type PersonOption = {
  id: string;
  name: string;
};

type RideForm = {
  riderId: string;
  driverId: string;
  date: string;
  time: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: string;
  status: RideStatusLabel;
};

const statusOptions: { label: RideStatusLabel; value: RideRequestStatusValue }[] = [
  { label: 'Pending', value: RideRequestStatusValue.Pending },
  { label: 'Accepted', value: RideRequestStatusValue.Accepted },
  { label: 'Declined', value: RideRequestStatusValue.Declined },
  { label: 'Completed', value: RideRequestStatusValue.Completed },
  { label: 'Cancelled', value: RideRequestStatusValue.Cancelled },
];

function getPersonName(
  directName: string | undefined,
  nestedPerson: { firstName: string; lastName: string } | undefined,
  fallback: string
): string {
  if (directName) return directName;
  if (nestedPerson) return `${nestedPerson.firstName} ${nestedPerson.lastName}`;
  return fallback;
}

function mapUserToOption(user: User): PersonOption {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
  };
}

function getRideDateTime(request: RideRequest): string {
  return request.slotStartTime ?? request.availabilitySlot?.startTime ?? request.createdAt;
}

function toDateInputValue(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-');
}

function toTimeInputValue(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) return '';

  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

function combineDateAndTime(dateValue: string, timeValue: string): string | undefined {
  if (!dateValue || !timeValue) return undefined;

  const date = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getFare(request: RideRequest): number {
  return request.fareAmount ?? request.fare ?? 0;
}

function getRideStatusLabel(status: RideRequest['status']): RideStatusLabel {
  const statusValue = getRideRequestStatusValue(status);

  if (statusValue === RideRequestStatusValue.Accepted) return 'Accepted';
  if (statusValue === RideRequestStatusValue.Declined) return 'Declined';
  if (statusValue === RideRequestStatusValue.Completed) return 'Completed';
  if (statusValue === RideRequestStatusValue.Cancelled) return 'Cancelled';

  return 'Pending';
}

function getRideStatusValue(label: RideStatusLabel): RideRequestStatusValue {
  return statusOptions.find((status) => status.label === label)?.value ?? RideRequestStatusValue.Pending;
}

function mapRideToForm(ride: RideRequest): RideForm {
  const dateTime = getRideDateTime(ride);

  return {
    riderId: ride.riderId,
    driverId: ride.driverId,
    date: toDateInputValue(dateTime),
    time: toTimeInputValue(dateTime),
    pickupLocation: ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    fare: getFare(ride).toFixed(2),
    status: getRideStatusLabel(ride.status),
  };
}

function addOptionIfMissing(options: PersonOption[], id: string, name: string): PersonOption[] {
  if (!id || options.some((option) => option.id === id)) return options;
  return [...options, { id, name }];
}

export default function AdminRideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState<RideRequest>();
  const [form, setForm] = useState<RideForm>();
  const [drivers, setDrivers] = useState<PersonOption[]>([]);
  const [riders, setRiders] = useState<PersonOption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingRide, setIsLoadingRide] = useState(true);
  const [isSavingRide, setIsSavingRide] = useState(false);
  const [rideError, setRideError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function loadPeople() {
      const [driverData, riderData] = await Promise.all([
        userService.getUsers({ pageSize: 500, role: 'Driver' }),
        userService.getUsers({ pageSize: 500, role: 'Rider' }),
      ]);

      setDrivers(driverData.items.map(mapUserToOption));
      setRiders(riderData.items.map(mapUserToOption));
    }

    loadPeople().catch(() => {
      setDrivers([]);
      setRiders([]);
    });
  }, []);

  useEffect(() => {
    async function loadRide() {
      if (!rideId) {
        setRideError('Missing ride id.');
        setIsLoadingRide(false);
        return;
      }

      try {
        setIsLoadingRide(true);
        setRideError('');

        const data = await rideRequestService.getRideRequestById(rideId);
        setRide(data);
        setForm(mapRideToForm(data));
      } catch (error) {
        setRideError(error instanceof Error ? error.message : 'Unable to load ride.');
      } finally {
        setIsLoadingRide(false);
      }
    }

    loadRide();
  }, [rideId]);

  useEffect(() => {
    if (!ride) return;

    setDrivers((prev) =>
      addOptionIfMissing(
        prev,
        ride.driverId,
        getPersonName(ride.driverName, ride.driver, 'Current driver')
      )
    );
    setRiders((prev) =>
      addOptionIfMissing(
        prev,
        ride.riderId,
        getPersonName(ride.riderName, ride.rider, 'Current rider')
      )
    );
  }, [ride]);

  const riderName = useMemo(() => {
    if (!ride) return 'Rider unavailable';
    return getPersonName(ride.riderName, ride.rider, 'Rider unavailable');
  }, [ride]);

  const driverName = useMemo(() => {
    if (!ride) return 'Driver unavailable';
    return getPersonName(ride.driverName, ride.driver, 'Driver unavailable');
  }, [ride]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
    setSaveMessage('');
    setRideError('');
  };

  const handleSaveRide = async () => {
    if (!rideId || !form) return;

    const fare = Number(form.fare);
    const slotStartTime = combineDateAndTime(form.date, form.time);

    if (!form.riderId || !form.driverId) {
      setRideError('Choose both a rider and driver.');
      return;
    }

    if (!form.pickupLocation.trim() || !form.dropoffLocation.trim()) {
      setRideError('Pickup and dropoff locations are required.');
      return;
    }

    if (Number.isNaN(fare) || fare < 0) {
      setRideError('Enter a valid fare.');
      return;
    }

    if (!slotStartTime) {
      setRideError('Choose a valid ride date and time.');
      return;
    }

    try {
      setIsSavingRide(true);
      setRideError('');
      setSaveMessage('');

      const updatedRide = await rideRequestService.updateRideRequest(rideId, {
        riderId: form.riderId,
        driverId: form.driverId,
        availabilitySlotId: ride?.availabilitySlotId,
        pickupLocation: form.pickupLocation.trim(),
        dropoffLocation: form.dropoffLocation.trim(),
        fare,
        fareAmount: fare,
        status: getRideStatusValue(form.status),
        slotStartTime,
      });

      setRide(updatedRide);
      setForm(mapRideToForm(updatedRide));
      setIsEditing(false);
      setSaveMessage('Ride details updated.');
    } catch (error) {
      setRideError(error instanceof Error ? error.message : 'Unable to update ride.');
    } finally {
      setIsSavingRide(false);
    }
  };

  const handleCancelEdit = () => {
    if (ride) {
      setForm(mapRideToForm(ride));
    }

    setIsEditing(false);
    setRideError('');
    setSaveMessage('');
  };

  if (isLoadingRide) {
    return <div className="admin-user-details-state">Loading ride details...</div>;
  }

  if (rideError && !ride) {
    return <div className="admin-user-details-state admin-user-details-state--error">{rideError}</div>;
  }

  if (!ride || !form) {
    return <div className="admin-user-details-state admin-user-details-state--error">Ride unavailable.</div>;
  }

  return (
    <section className="admin-user-details">
      <header className="admin-user-details__header">
        <div>
          <button
            type="button"
            className="admin-user-details__back"
            onClick={() => navigate('/admin/rides')}
          >
            Back to Rides
          </button>
          <p className="admin-page__eyebrow">Admin</p>
          <h1 className="admin-user-details__title">Ride Details</h1>
          <p className="admin-user-details__subtitle">
            View trip information, update ride values, and manage request status.
          </p>
        </div>

        <div className="admin-user-details__actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="admin-detail-button admin-detail-button--secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-detail-button admin-detail-button--primary"
                onClick={handleSaveRide}
                disabled={isSavingRide}
              >
                {isSavingRide ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-detail-button admin-detail-button--primary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </header>

      {saveMessage ? <p className="admin-user-details__message">{saveMessage}</p> : null}
      {rideError ? <p className="admin-user-details__error">{rideError}</p> : null}

      <div className="admin-user-details-grid">
        <section className="admin-user-card">
          <div className="admin-user-card__header">
            <h2>Ride Info</h2>
            <span className={`admin-status-badge admin-ride-status--${form.status.toLowerCase()}`}>
              {form.status}
            </span>
          </div>

          <div className="admin-detail-fields">
            <label>
              <span>Date</span>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Time</span>
              <input
                name="time"
                type="time"
                value={form.time}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Rider</span>
              <select
                name="riderId"
                value={form.riderId}
                onChange={handleFormChange}
                disabled={!isEditing}
              >
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Driver</span>
              <select
                name="driverId"
                value={form.driverId}
                onChange={handleFormChange}
                disabled={!isEditing}
              >
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Pickup</span>
              <input
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Dropoff</span>
              <input
                name="dropoffLocation"
                value={form.dropoffLocation}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Fare</span>
              <input
                name="fare"
                type="number"
                min="0"
                step="0.01"
                value={form.fare}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                disabled={!isEditing}
              >
                {statusOptions.map((status) => (
                  <option key={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-user-card">
          <div className="admin-user-card__header">
            <h2>Trip Summary</h2>
          </div>

          <dl className="admin-ride-summary">
            <div>
              <dt>Ride ID</dt>
              <dd>{ride.id}</dd>
            </div>
            <div>
              <dt>Rider</dt>
              <dd>{riderName}</dd>
            </div>
            <div>
              <dt>Driver</dt>
              <dd>{driverName}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{formatDateTime(ride.createdAt)}</dd>
            </div>
            <div>
              <dt>Scheduled</dt>
              <dd>{formatDateTime(getRideDateTime(ride))}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{ride.completedAt ? formatDateTime(ride.completedAt) : 'Not completed'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}
