import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  availabilityService,
  type AvailabilitySlot as ApiAvailabilitySlot,
} from '../../../services/availabilityService';
import {
  getUserRoleLabel,
  getUserRoleValue,
  type User,
  userService,
} from '../../../services/userService';
import './AdminUserDetails.css';
import '../../driver/pages/DriverSchedule.css';

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'Rider' | 'Driver' | 'Admin';
  baseFare: string;
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

function toTimeInputValue(dateTime: string): string {
  const date = new Date(dateTime);
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate.toISOString();
}

function formatJoinedOn(dateValue?: string): string {
  if (!dateValue) return 'Not available';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDayAvailabilityFilters(date: Date, driverId: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    driverId,
    startTimeFrom: start.toISOString(),
    startTimeTo: end.toISOString(),
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

function mapAvailability(slot: ApiAvailabilitySlot): AvailabilitySlot {
  return {
    id: slot.id,
    startTime: toTimeInputValue(slot.startTime),
    endTime: toTimeInputValue(slot.endTime),
  };
}

function mapUserToForm(user: User): UserForm {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: getUserRoleLabel(user.role),
    baseFare: user.baseFare.toFixed(2),
  };
}

export default function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User>();
  const [form, setForm] = useState<UserForm>();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userError, setUserError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrow());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
  });
  const [availabilityError, setAvailabilityError] = useState('');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const isDriver = user ? getUserRoleLabel(user.role) === 'Driver' : false;
  const mergedSlots = useMemo(() => mergeOverlappingSlots(slots), [slots]);

  useEffect(() => {
    async function loadUser() {
      if (!userId) {
        setUserError('Missing user id.');
        setIsLoadingUser(false);
        return;
      }

      try {
        setIsLoadingUser(true);
        setUserError('');

        const data = await userService.getUserById(userId);
        setUser(data);
        setForm(mapUserToForm(data));
      } catch (error) {
        setUserError(error instanceof Error ? error.message : 'Unable to load user.');
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUser();
  }, [userId]);

  useEffect(() => {
    async function loadAvailability() {
      if (!userId || !isDriver) {
        setSlots([]);
        return;
      }

      try {
        setIsLoadingAvailability(true);
        setAvailabilityError('');

        const availability = await availabilityService.getAvailability(
          getDayAvailabilityFilters(selectedDate, userId)
        );

        setSlots(availability.map(mapAvailability));
      } catch (error) {
        setSlots([]);
        setAvailabilityError(
          error instanceof Error ? error.message : 'Unable to load availability.'
        );
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [isDriver, selectedDate, userId]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => prev ? { ...prev, [name]: value } : prev);
    setSaveMessage('');
    setUserError('');
  };

  const handleSaveUser = async () => {
    if (!userId || !form) return;

    const baseFare = Number(form.baseFare);

    if (Number.isNaN(baseFare) || baseFare < 0) {
      setUserError('Enter a valid base fare.');
      return;
    }

    try {
      setIsSavingUser(true);
      setUserError('');
      setSaveMessage('');

      const updatedUser = await userService.patchUser(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        role: getUserRoleValue(form.role),
        baseFare,
      });

      setUser(updatedUser);
      setForm(mapUserToForm(updatedUser));
      setIsEditing(false);
      setSaveMessage('User details updated.');
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Unable to update user.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setForm(mapUserToForm(user));
    }

    setIsEditing(false);
    setUserError('');
    setSaveMessage('');
  };

  const handleDeactivate = () => {
    setIsDeactivated(true);
    setSaveMessage('User marked as deactivated for this admin session.');
  };

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const updated = new Date(prev);
      updated.setDate(updated.getDate() - 1);
      updated.setHours(0, 0, 0, 0);
      return updated;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const updated = new Date(prev);
      updated.setDate(updated.getDate() + 1);
      updated.setHours(0, 0, 0, 0);
      return updated;
    });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = event.target.value.split('-').map(Number);
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
    setAvailabilityError('');
  };

  const handleAddAvailability = async () => {
    if (!userId) return;

    setAvailabilityError('');

    if (!newSlot.startTime || !newSlot.endTime) {
      setAvailabilityError('Please choose both a start and end time.');
      return;
    }

    const startMinutes = timeStringToMinutes(newSlot.startTime);
    const endMinutes = timeStringToMinutes(newSlot.endTime);

    if (endMinutes <= startMinutes) {
      setAvailabilityError('End time must be later than start time.');
      return;
    }

    try {
      setIsSavingAvailability(true);

      const createdSlots = await availabilityService.createAvailabilityWindow({
        driverId: userId,
        startTime: combineDateAndTime(selectedDate, newSlot.startTime),
        endTime: combineDateAndTime(selectedDate, newSlot.endTime),
      });

      setSlots((prev) => mergeOverlappingSlots([
        ...prev,
        ...createdSlots.map(mapAvailability),
      ]));
      setNewSlot({
        startTime: '',
        endTime: '',
      });
      setShowAddForm(false);
    } catch (error) {
      setAvailabilityError(
        error instanceof Error ? error.message : 'Unable to save availability.'
      );
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleRemoveSlot = (id: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  if (isLoadingUser) {
    return <div className="admin-user-details-state">Loading user details...</div>;
  }

  if (userError && !user) {
    return <div className="admin-user-details-state admin-user-details-state--error">{userError}</div>;
  }

  if (!user || !form) {
    return <div className="admin-user-details-state admin-user-details-state--error">User unavailable.</div>;
  }

  return (
    <section className="admin-user-details">
      <header className="admin-user-details__header">
        <div>
          <button
            type="button"
            className="admin-user-details__back"
            onClick={() => navigate('/admin/users')}
          >
            Back to Users
          </button>
          <p className="admin-page__eyebrow">Admin</p>
          <h1 className="admin-user-details__title">
            {user.firstName} {user.lastName}
          </h1>
          <p className="admin-user-details__subtitle">
            View account details, edit profile information, and manage access.
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
                onClick={handleSaveUser}
                disabled={isSavingUser}
              >
                {isSavingUser ? 'Saving...' : 'Save Changes'}
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
      {userError ? <p className="admin-user-details__error">{userError}</p> : null}

      <div className="admin-user-details-grid">
        <section className="admin-user-card">
          <div className="admin-user-card__header">
            <h2>User Info</h2>
            <span className={isDeactivated ? 'admin-user-status admin-user-status--deactivated' : 'admin-user-status'}>
              {isDeactivated ? 'Deactivated' : 'Active'}
            </span>
          </div>

          <div className="admin-detail-fields">
            <label>
              <span>First Name</span>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Last Name</span>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Phone</span>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Role</span>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                disabled={!isEditing}
              >
                <option>Rider</option>
                <option>Driver</option>
                <option>Admin</option>
              </select>
            </label>

            <label>
              <span>Base Fare</span>
              <input
                name="baseFare"
                type="number"
                min="0"
                step="0.01"
                value={form.baseFare}
                onChange={handleFormChange}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Joined On</span>
              <input value={formatJoinedOn(user.createdAt)} disabled />
            </label>
          </div>
        </section>

        <section className="admin-user-card">
          <div className="admin-user-card__header">
            <h2>Account Actions</h2>
          </div>

          <p className="admin-user-card__copy">
            Deactivate this user to remove account access from the admin workflow.
          </p>

          <button
            type="button"
            className="admin-detail-button admin-detail-button--danger"
            onClick={handleDeactivate}
            disabled={isDeactivated}
          >
            {isDeactivated ? 'Deactivated' : 'Deactivate User'}
          </button>
        </section>
      </div>

      {isDriver ? (
        <section className="admin-user-availability">
          <header className="admin-user-card__header">
            <div>
              <h2>Driver Availability</h2>
              <p>Edit the driver&apos;s available ride windows.</p>
            </div>
          </header>

          <section className="schedule-card">
            <div className="schedule-card__header schedule-card__header--stack">
              <div>
                <h2>Date Selector</h2>
                <p className="schedule-card__helper">
                  Admins can review and adjust availability for any date.
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

          <section className="schedule-card">
            <div className="schedule-card__header">
              <h2>Availability</h2>
              <button
                type="button"
                className="schedule-button schedule-button--primary"
                onClick={() => {
                  setShowAddForm((prev) => !prev);
                  setAvailabilityError('');
                }}
              >
                {showAddForm ? 'Cancel' : 'Add Availability'}
              </button>
            </div>

            {showAddForm ? (
              <div className="add-slot-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adminStartTime">Start Time</label>
                    <input
                      id="adminStartTime"
                      name="startTime"
                      type="time"
                      value={newSlot.startTime}
                      onChange={handleNewSlotChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminEndTime">End Time</label>
                    <input
                      id="adminEndTime"
                      name="endTime"
                      type="time"
                      value={newSlot.endTime}
                      onChange={handleNewSlotChange}
                    />
                  </div>
                </div>

                {availabilityError ? <p className="form-error">{availabilityError}</p> : null}

                <button
                  type="button"
                  className="schedule-button schedule-button--primary"
                  onClick={handleAddAvailability}
                  disabled={isSavingAvailability}
                >
                  {isSavingAvailability ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            ) : null}

            {isLoadingAvailability ? (
              <div className="empty-state">
                <h3>Loading availability</h3>
                <p>Checking this driver&apos;s schedule for the selected day.</p>
              </div>
            ) : mergedSlots.length > 0 ? (
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
                      onClick={() => handleRemoveSlot(slot.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No availability set</h3>
                <p>
                  This driver does not have availability for the selected day yet.
                </p>
              </div>
            )}
          </section>
        </section>
      ) : null}
    </section>
  );
}
