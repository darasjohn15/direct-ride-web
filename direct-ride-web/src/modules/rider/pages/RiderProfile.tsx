import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRoleLabel, userService } from '../../../services/userService';
import { clearToken, getToken, getUserIdFromToken } from '../../../types/auth';
import './RiderProfile.css';

type RiderUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
};

export default function RiderProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<RiderUser>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadUser() {
      try {
        setIsLoading(true);
        setLoadError('');

        const token = getToken();
        const userId = token ? getUserIdFromToken(token) : null;
        const data = userId
          ? await userService.getUserById(userId)
          : await userService.getCurrentUser();

        setUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phoneNumber,
          role: getUserRoleLabel(data.role),
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

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="rider-profile">Loading profile...</div>;
  }

  if (loadError || !user) {
    return <div className="rider-profile">{loadError || 'Profile unavailable.'}</div>;
  }

  return (
    <div className="rider-profile">
      <header className="rider-profile__header">
        <div>
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
              <span className="info-row__label">Role</span>
              <span className="info-row__value">{user.role}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Phone</span>
              <span className="info-row__value">{user.phone}</span>
            </div>

            <div className="info-row">
              <span className="info-row__label">Email</span>
              <span className="info-row__value">{user.email}</span>
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
          </div>
        </div>
      </section>
    </div>
  );
}
