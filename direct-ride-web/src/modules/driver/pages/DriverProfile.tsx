import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../../../types/auth';
import './DriverProfile.css';

type DriverUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  baseFare: string;
};

const mockDriver: DriverUser = {
  firstName: 'Marcus',
  lastName: 'Johnson',
  email: 'marcus@directride.com',
  phone: '(404) 555-0128',
  role: 'Driver',
  baseFare: '8.50',
};

export default function DriverProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<DriverUser>(mockDriver);
  const [fareSavedMessage, setFareSavedMessage] = useState('');
  const [showDeactivateMessage, setShowDeactivateMessage] = useState(false);

  const initials = useMemo(() => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }, [user.firstName, user.lastName]);

  const handleBaseFareChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setUser((prev) => ({
      ...prev,
      baseFare: value,
    }));

    setFareSavedMessage('');
  };

  const handleSaveBaseFare = () => {
    setFareSavedMessage('Base fare updated.');
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handleDeactivateAccount = () => {
    setShowDeactivateMessage(true);
  };

  return (
    <div className="driver-profile">
      <header className="driver-profile__header">
        <div>
          <p className="driver-profile__eyebrow">Driver</p>
          <h1 className="driver-profile__title">Profile</h1>
          <p className="driver-profile__subtitle">
            Manage your account details and pricing settings.
          </p>
        </div>
      </header>

      <section className="profile-card profile-card--hero">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-hero__content">
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>{user.role}</p>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-card">
          <div className="profile-card__header">
            <h2>User Info</h2>
          </div>

          <div className="info-list">
            <div className="info-row">
              <span className="info-row__label">Name</span>
              <span className="info-row__value">
                {user.firstName} {user.lastName}
              </span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Email</span>
              <span className="info-row__value">{user.email}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Phone</span>
              <span className="info-row__value">{user.phone}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Role</span>
              <span className="info-row__value">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card__header">
            <h2>Settings</h2>
          </div>

          <div className="settings-group">
            <label htmlFor="baseFare" className="settings-group__label">
              Price Base Fare
            </label>

            <div className="settings-group__input-wrap">
              <span className="settings-group__prefix">$</span>
              <input
                id="baseFare"
                type="number"
                min="0"
                step="0.01"
                value={user.baseFare}
                onChange={handleBaseFareChange}
                className="settings-group__input"
              />
            </div>

            <button
              type="button"
              className="profile-button profile-button--primary"
              onClick={handleSaveBaseFare}
            >
              Save Base Fare
            </button>

            {fareSavedMessage ? (
              <p className="settings-group__message">{fareSavedMessage}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card__header">
          <h2>Account Actions</h2>
        </div>

        <div className="account-actions">
          <button
            type="button"
            className="profile-button profile-button--secondary"
            onClick={handleLogout}
          >
            Log Out
          </button>

          <button
            type="button"
            className="profile-button profile-button--danger"
            onClick={handleDeactivateAccount}
          >
            Deactivate Account
          </button>
        </div>

        {showDeactivateMessage ? (
          <p className="deactivate-message">
            Account deactivation flow not connected yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}