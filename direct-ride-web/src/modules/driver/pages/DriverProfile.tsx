import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken, getToken, getUserIdFromToken } from '../../../types/auth';
import { getUserRoleLabel, userService } from '../../../services/userService';
import './DriverProfile.css';

type DriverUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  baseFare: string;
};

// const mockDriver: DriverUser = {
//   firstName: 'Marcus',
//   lastName: 'Johnson',
//   email: 'marcus@directride.com',
//   phone: '(404) 555-0128',
//   role: 'Driver',
//   baseFare: '8.50',
// };

export default function DriverProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<DriverUser>();
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [fareSavedMessage, setFareSavedMessage] = useState('');

  useEffect(() => {
    async function loadUser() {
      try {
        setIsLoading(true);
        setLoadError('');

        const token = getToken();
        const userId = token ? getUserIdFromToken(token) : null;

        if (!userId) {
          throw new Error('Missing authenticated user.');
        }

        const data = await userService.getUserById(userId);

        setUserId(userId);
        setUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phoneNumber,
          role: getUserRoleLabel(data.role),
          baseFare: data.baseFare.toFixed(2),
        });
      } catch {
        setLoadError('Unable to load profile.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }, [user]);

  const handleBaseFareChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setUser((prev) => (prev ? {
      ...prev,
      baseFare: value,
    } : prev));

    setFareSavedMessage('');
    setSettingsError('');
  };

  const handleSaveBaseFare = async () => {
    setSettingsError('');
    setFareSavedMessage('');

    const baseFare = Number(user?.baseFare);

    if (!userId || Number.isNaN(baseFare) || baseFare < 0) {
      setSettingsError('Enter a valid base fare.');
      return;
    }

    try {
      const updatedUser = await userService.patchUser(userId, { baseFare });
      setUser((prev) => prev ? {
        ...prev,
        baseFare: updatedUser.baseFare.toFixed(2),
      } : prev);
      setFareSavedMessage('Base fare updated.');
    } catch {
      setSettingsError('Unable to update base fare.');
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="driver-profile">Loading profile...</div>;
  }

  if (loadError || !user) {
    return <div className="driver-profile">{loadError || 'Profile unavailable.'}</div>;
  }

  return (
    <div className="driver-profile">
      <header className="driver-profile__header">
        <div>
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
            {settingsError ? (
              <p className="settings-group__message">{settingsError}</p>
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

          {/* <button
            type="button"
            className="profile-button profile-button--danger"
            onClick={handleDeactivateAccount}
          >
            Deactivate Account
          </button> */}
        </div>
      </section>
    </div>
  );
}
