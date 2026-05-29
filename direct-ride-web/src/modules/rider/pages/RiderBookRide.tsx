import { useMemo, useState } from 'react';
import { availabilityService, type AvailabilitySlot } from '../../../services/availabilityService';
import { rideRequestService } from '../../../services/rideRequestService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import { userService, type User } from '../../../services/userService';
import AvailableDriverCard, {
  type AvailableDriver,
} from '../components/AvailableDriverCard';
import './RiderBookRide.css';

type TripForm = {
  date: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
};

const hourlyPickupTimes = Array.from({ length: 24 }, (_, hour) => {
  const value = `${hour.toString().padStart(2, '0')}:00`;
  const labelDate = new Date();
  labelDate.setHours(hour, 0, 0, 0);

  return {
    value,
    label: labelDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
});

function getTomorrowDateInputValue(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = `${tomorrow.getMonth() + 1}`.padStart(2, '0');
  const day = `${tomorrow.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForSummary(date: string): string {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function createDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function formatPickupTime(time: string): string {
  const option = hourlyPickupTimes.find((pickupTime) => pickupTime.value === time);
  return option?.label ?? time;
}

function getDayRange(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);

  return {
    startTimeFrom: start.toISOString(),
    startTimeTo: end.toISOString(),
  };
}

function getDriverName(slot: AvailabilitySlot): string {
  if (slot.driverName) return slot.driverName;
  if (slot.driver) return `${slot.driver.firstName} ${slot.driver.lastName}`;
  return 'DirectRide Driver';
}

function getBaseFare(slot: AvailabilitySlot): number {
  return slot.driver?.baseFare ?? 0;
}

function getDriverBaseFare(slot: AvailabilitySlot, driver?: User): number {
  return driver?.baseFare ?? getBaseFare(slot);
}

function getDriverId(slot: AvailabilitySlot): string {
  return slot.driver?.id ?? slot.driverId;
}

function mapAvailabilityToDriver(slot: AvailabilitySlot, driver?: User): AvailableDriver {
  return {
    id: getDriverId(slot),
    availabilitySlotId: slot.id,
    name: driver ? `${driver.firstName} ${driver.lastName}` : getDriverName(slot),
    vehicle: 'DirectRide vehicle',
    rating: 5,
    baseFare: getDriverBaseFare(slot, driver),
  };
}

function isBetterSlotForPickup(
  candidate: AvailabilitySlot,
  current: AvailabilitySlot,
  pickupTime: number
): boolean {
  const candidateStart = new Date(candidate.startTime).getTime();
  const currentStart = new Date(current.startTime).getTime();

  if (candidateStart !== currentStart) {
    return Math.abs(pickupTime - candidateStart) < Math.abs(pickupTime - currentStart);
  }

  const candidateDuration =
    new Date(candidate.endTime).getTime() - new Date(candidate.startTime).getTime();
  const currentDuration =
    new Date(current.endTime).getTime() - new Date(current.startTime).getTime();

  return candidateDuration < currentDuration;
}

function getUniqueDriverSlots(slots: AvailabilitySlot[], pickupDateTime: Date): AvailabilitySlot[] {
  const pickupTime = pickupDateTime.getTime();
  const slotsByDriver = new Map<string, AvailabilitySlot>();

  slots.forEach((slot) => {
    const driverId = getDriverId(slot);
    const existingSlot = slotsByDriver.get(driverId);

    if (!existingSlot || isBetterSlotForPickup(slot, existingSlot, pickupTime)) {
      slotsByDriver.set(driverId, slot);
    }
  });

  return Array.from(slotsByDriver.values());
}

async function mapAvailabilitySlotsToDrivers(
  slots: AvailabilitySlot[]
): Promise<AvailableDriver[]> {
  return Promise.all(
    slots.map(async (slot) => {
      try {
        const driver = await userService.getUserById(getDriverId(slot));
        return mapAvailabilityToDriver(slot, driver);
      } catch {
        return mapAvailabilityToDriver(slot);
      }
    })
  );
}

export default function RiderBookTrip() {
  const [formData, setFormData] = useState<TripForm>({
    date: getTomorrowDateInputValue(),
    pickupTime: '',
    pickupLocation: '',
    dropoffLocation: '',
  });

  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = useMemo(() => getTomorrowDateInputValue(), []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setConfirmationMessage('');
    setError('');
  };

  const handleSearchDrivers = async () => {
    setError('');
    setConfirmationMessage('');
    setSelectedDriver(null);

    if (
      !formData.date ||
      !formData.pickupTime ||
      !formData.pickupLocation.trim() ||
      !formData.dropoffLocation.trim()
    ) {
      setError('Please enter your trip date, pickup time, pickup, and dropoff.');
      setDrivers([]);
      setSearchPerformed(true);
      return;
    }

    setIsSearching(true);

    try {
      const pickupDateTime = createDateTime(formData.date, formData.pickupTime);
      const slots = await availabilityService.getAvailability(getDayRange(formData.date));
      const matchingSlots = slots.filter((slot) => {
        const startTime = new Date(slot.startTime).getTime();
        const endTime = new Date(slot.endTime).getTime();
        const pickupTime = pickupDateTime.getTime();

        return startTime <= pickupTime && pickupTime <= endTime && !slot.isBooked;
      });

      const uniqueDriverSlots = getUniqueDriverSlots(matchingSlots, pickupDateTime);
      const availableDrivers = await mapAvailabilitySlotsToDrivers(uniqueDriverSlots);

      setDrivers(availableDrivers);
      setSearchPerformed(true);
    } catch {
      setDrivers([]);
      setSearchPerformed(true);
      setError('Unable to search available drivers.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitRequest = async () => {
    setError('');
    setConfirmationMessage('');

    if (!searchPerformed) {
      setError('Search for available drivers before submitting your request.');
      return;
    }

    if (!selectedDriver) {
      setError('Please select a driver before submitting your request.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getToken();
      let riderId = token ? getUserIdFromToken(token) : null;

      if (!riderId) {
        const currentUser = await userService.getCurrentUser();
        riderId = currentUser.id;
      }

      await rideRequestService.createRideRequest({
        riderId,
        driverId: selectedDriver.id,
        availabilitySlotId: selectedDriver.availabilitySlotId,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
      });

      setConfirmationMessage(
        `Your request has been sent to ${selectedDriver.name} for ${formatDateForSummary(
          formData.date
        )} at ${formatPickupTime(formData.pickupTime)}.`
      );
      setDrivers((prev) =>
        prev.filter((driver) => driver.availabilitySlotId !== selectedDriver.availabilitySlotId)
      );
      setSelectedDriver(null);
    } catch {
      setError('Unable to submit your ride request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rider-book-trip">
      <header className="rider-book-trip__header">
        <div>
          <h1 className="rider-book-trip__title">Book a Ride</h1>
          <p className="rider-book-trip__subtitle">
            Choose a time and enter your trip details.
          </p>
        </div>
      </header>

      <section className="book-trip-grid">
        <div className="book-trip-card">
          <div className="book-trip-card__header">
            <h2>Trip Details</h2>
          </div>

          <div className="book-trip-form">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                min={minDate}
                value={formData.date}
                onChange={handleChange}
              />
              <p className="form-helper">Same-day booking is not available.</p>
            </div>

            <div className="form-group">
              <label htmlFor="pickupTime">Pick Up Time</label>
              <select
                id="pickupTime"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleChange}
              >
                <option value="">Select pickup time</option>
                {hourlyPickupTimes.map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pickupLocation">Pick Up Location</label>
              <input
                id="pickupLocation"
                name="pickupLocation"
                type="text"
                placeholder="Enter pickup location"
                value={formData.pickupLocation}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dropoffLocation">Drop Off Location</label>
              <input
                id="dropoffLocation"
                name="dropoffLocation"
                type="text"
                placeholder="Enter dropoff location"
                value={formData.dropoffLocation}
                onChange={handleChange}
              />
            </div>

            <button
              type="button"
              className="book-trip-button book-trip-button--primary"
              onClick={handleSearchDrivers}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search Drivers'}
            </button>

            {error ? <p className="form-error">{error}</p> : null}
          </div>
        </div>

        <div className="book-trip-card">
          <div className="book-trip-card__header">
            <h2>Request Summary</h2>
          </div>

          <div className="request-summary">
            <div className="request-summary__row">
              <span>Date</span>
              <span>{formData.date ? formatDateForSummary(formData.date) : 'Not set'}</span>
            </div>

            <div className="request-summary__row">
              <span>Pick Up Time</span>
              <span>{formData.pickupTime ? formatPickupTime(formData.pickupTime) : 'Not set'}</span>
            </div>

            <div className="request-summary__row">
              <span>Pickup</span>
              <span>{formData.pickupLocation || 'Not set'}</span>
            </div>

            <div className="request-summary__row">
              <span>Dropoff</span>
              <span>{formData.dropoffLocation || 'Not set'}</span>
            </div>

            <div className="request-summary__row">
              <span>Selected Driver</span>
              <span>{selectedDriver ? selectedDriver.name : 'Not selected'}</span>
            </div>
          </div>

          <button
            type="button"
            className="book-trip-button book-trip-button--dark"
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>

          {confirmationMessage ? (
            <div className="confirmation-box">
              <h3>Request Submitted</h3>
              <p>{confirmationMessage}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="book-trip-card">
        <div className="book-trip-card__header">
          <h2>Available Drivers</h2>
        </div>

        {drivers.length > 0 ? (
          <div className="available-drivers-grid">
            {drivers.map((driver) => (
              <AvailableDriverCard
                key={driver.id}
                driver={driver}
                isSelected={selectedDriver?.id === driver.id}
                onSelect={setSelectedDriver}
              />
            ))}
          </div>
        ) : searchPerformed ? (
          <div className="empty-state-block">
            <h3>No available drivers</h3>
            <p>
              We couldn&apos;t find any drivers for this trip right now. Try a different
              time or route.
            </p>
          </div>
        ) : (
          <div className="empty-state-block">
            <h3>Search for drivers</h3>
            <p>
              Enter your ride details and search to see available drivers for your trip.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
