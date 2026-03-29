import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../../../types/auth';
import './RiderProfile.css';

type RiderUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
};

const mockRider: RiderUser = {
  firstName: 'Avery',
  lastName: 'Brooks',
  email: 'avery@directride.com',
  phone: '(404) 555-0192',
  role: 'Rider',
};

export default function RiderProfile() {
  const navigate = useNavigate();
  const [showDeactivateMessage, setShowDeactivateMessage] = useState(false);

  const initials = useMemo(() => {
    return `${mockRider.firstName.charAt(0)}${mockRider.lastName.charAt(0)}`.toUpperCase();
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handleDeactivateAccount = () => {
    setShowDeactivateMessage(true);
  };

  return (
    <div className="rider-profile">
      <header className="rider-profile__header">
        <div>
          <p className="rider-profile__eyebrow">Rider</p>
          <h1 className="rider-profile__title">Profile</h1>
          <p className="rider-profile__subtitle">
            Manage your account information and settings.
          </p>
        </div>
      </header>

      <section className="profile-card profile-card--hero">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-hero__content">
          <h2>
            {mockRider.firstName} {mockRider.lastName}
          </h2>
          <p>{mockRider.role}</p>
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
                {mockRider.firstName} {mockRider.lastName}
              </span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Role</span>
              <span className="info-row__value">{mockRider.role}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Phone</span>
              <span className="info-row__value">{mockRider.phone}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Email</span>
              <span className="info-row__value">{mockRider.email}</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card__header">
            <h2>Settings</h2>
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
        </div>
      </section>
    </div>
  );
}