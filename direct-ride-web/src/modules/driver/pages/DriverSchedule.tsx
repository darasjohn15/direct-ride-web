import { useMemo, useState } from 'react';
import './DriverSchedule.css';

type AvailabilitySlot = {
  id: number;
  startTime: string;
  endTime: string;
};

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
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
  return merged.map((slot, index) => ({
    ...slot,
    id: index + 1,
  }));
}

export default function DriverSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrow());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([
    {
      id: 1,
      startTime: '08:00',
      endTime: '12:00',
    },
    {
      id: 2,
      startTime: '14:00',
      endTime: '18:00',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');

  const mergedSlots = useMemo(() => mergeOverlappingSlots(slots), [slots]);

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const updated = new Date(prev);
      updated.setDate(updated.getDate() - 1);
      return updated;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const updated = new Date(prev);
      updated.setDate(updated.getDate() + 1);
      return updated;
    });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) return;

    const nextDate = new Date(year, month - 1, day);
    nextDate.setHours(0, 0, 0, 0);
    setSelectedDate(nextDate);
  };

  const handleNewSlotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewSlot((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAvailability = () => {
    setError('');

    if (!newSlot.startTime || !newSlot.endTime) {
      setError('Please choose both a start and end time.');
      return;
    }

    const startMinutes = timeStringToMinutes(newSlot.startTime);
    const endMinutes = timeStringToMinutes(newSlot.endTime);

    if (endMinutes <= startMinutes) {
      setError('End time must be later than start time.');
      return;
    }

    const updatedSlots = mergeOverlappingSlots([
      ...slots,
      {
        id: Date.now(),
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
      },
    ]);

    setSlots(updatedSlots);
    setNewSlot({
      startTime: '',
      endTime: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteSlot = (id: number) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  return (
    <div className="driver-schedule">
      <header className="driver-schedule__header">
        <div>
          <p className="driver-schedule__eyebrow">Driver</p>
          <h1 className="driver-schedule__title">Schedule</h1>
          <p className="driver-schedule__subtitle">
            Set when you&apos;re available for rides.
          </p>
        </div>
      </header>

      <section className="schedule-card">
        <div className="schedule-card__header schedule-card__header--stack">
          <div>
            <h2>Date Selector</h2>
            <p className="schedule-card__helper">
              Availability defaults to tomorrow since rides must be booked the day before.
            </p>
          </div>
        </div>

        <div className="date-selector">
          <button
            type="button"
            className="date-selector__arrow"
            onClick={handlePreviousDay}
            aria-label="Previous day"
          >
            ←
          </button>

          <div className="date-selector__center">
            <p className="date-selector__label">{formatDateLabel(selectedDate)}</p>
            <input
              type="date"
              className="date-selector__input"
              value={toInputDateValue(selectedDate)}
              onChange={handleDateChange}
            />
          </div>

          <button
            type="button"
            className="date-selector__arrow"
            onClick={handleNextDay}
            aria-label="Next day"
          >
            →
          </button>
        </div>
      </section>

      <section className="schedule-grid">
        <div className="schedule-card">
          <div className="schedule-card__header">
            <h2>Availability</h2>
            <button
              type="button"
              className="schedule-button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setError('');
              }}
            >
              {showAddForm ? 'Cancel' : 'Add Availability'}
            </button>
          </div>

          {showAddForm ? (
            <div className="add-slot-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={newSlot.startTime}
                    onChange={handleNewSlotChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={newSlot.endTime}
                    onChange={handleNewSlotChange}
                  />
                </div>
              </div>

              {error ? <p className="form-error">{error}</p> : null}

              <button
                type="button"
                className="schedule-button schedule-button--primary"
                onClick={handleAddAvailability}
              >
                Save Availability
              </button>
            </div>
          ) : null}

          {mergedSlots.length > 0 ? (
            <div className="availability-list">
              {mergedSlots.map((slot) => (
                <div className="availability-card" key={slot.id}>
                  <div>
                    <h3>
                      {formatTimeForDisplay(slot.startTime)} to{' '}
                      {formatTimeForDisplay(slot.endTime)}
                    </h3>
                    <p>Available for ride requests during this time slot.</p>
                  </div>

                  <button
                    type="button"
                    className="availability-card__delete"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Set your schedule</h3>
              <p>
                You haven&apos;t added any availability for this day yet. Add a time slot
                so riders can book with you.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}