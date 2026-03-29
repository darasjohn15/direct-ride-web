import { useMemo, useState } from 'react';
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

const mockAvailableDrivers: AvailableDriver[] = [
  {
    id: 1,
    name: 'Marcus Johnson',
    vehicle: 'Black Toyota Camry',
    rating: 4.9,
    estimatedArrival: '12 mins',
    baseFare: 8.5,
  },
  {
    id: 2,
    name: 'Jordan Lee',
    vehicle: 'Silver Honda Accord',
    rating: 4.8,
    estimatedArrival: '16 mins',
    baseFare: 9.25,
  },
  {
    id: 3,
    name: 'Taylor Brooks',
    vehicle: 'White Nissan Altima',
    rating: 4.7,
    estimatedArrival: '19 mins',
    baseFare: 7.95,
  },
];

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

  const minDate = useMemo(() => getTomorrowDateInputValue(), []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setConfirmationMessage('');
    setError('');
  };

  const handleSearchDrivers = () => {
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

    // Mock search result
    setDrivers(mockAvailableDrivers);
    setSearchPerformed(true);
  };

  const handleSubmitRequest = () => {
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

    setConfirmationMessage(
      `Your request has been sent to ${selectedDriver.name} for ${formatDateForSummary(
        formData.date
      )} at ${formData.pickupTime}.`
    );
  };

  return (
    <div className="rider-book-trip">
      <header className="rider-book-trip__header">
        <div>
          <p className="rider-book-trip__eyebrow">Rider</p>
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
              <input
                id="pickupTime"
                name="pickupTime"
                type="time"
                value={formData.pickupTime}
                onChange={handleChange}
              />
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
            >
              Search Drivers
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
              <span>{formData.pickupTime || 'Not set'}</span>
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
          >
            Submit Request
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