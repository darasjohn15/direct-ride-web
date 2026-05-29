import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRoleLabel, userService } from '../../../services/userService';
import { clearToken, getToken, getUserIdFromToken } from '../../../types/auth';
import './AdminProfile.css';

type AdminUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
};

export default function AdminProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser>();
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
    return <div className="admin-profile">Loading profile...</div>;
  }

  if (loadError || !user) {
    return <div className="admin-profile">{loadError || 'Profile unavailable.'}</div>;
  }

  return (
    <div className="admin-profile">
      <header className="admin-profile__header">
        <div>
          <h1 className="admin-profile__title">Profile</h1>
          <p className="admin-profile__subtitle">
            View your admin account information and manage access.
          </p>
        </div>
      </header>

      <section className="admin-profile-card admin-profile-card--hero">
        <div className="admin-profile-avatar">{initials}</div>

        <div className="admin-profile-hero__content">
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>{user.role}</p>
        </div>
      </section>

      <section className="admin-profile-grid">
        <div className="admin-profile-card">
          <div className="admin-profile-card__header">
            <h2>User Info</h2>
          </div>

          <div className="admin-info-list">
            <div className="admin-info-row">
              <span className="admin-info-row__label">Name</span>
              <span className="admin-info-row__value">
                {user.firstName} {user.lastName}
              </span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-row__label">Email</span>
              <span className="admin-info-row__value">{user.email}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-row__label">Phone</span>
              <span className="admin-info-row__value">{user.phone}</span>
            </div>

            <div className="admin-info-row">
              <span className="admin-info-row__label">Role</span>
              <span className="admin-info-row__value">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="admin-profile-card">
          <div className="admin-profile-card__header">
            <h2>Account Actions</h2>
          </div>

          <div className="admin-account-actions">
            <button
              type="button"
              className="admin-profile-button admin-profile-button--secondary"
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
