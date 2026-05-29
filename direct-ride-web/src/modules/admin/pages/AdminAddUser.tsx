import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type UserRoleValue, userService } from '../../../services/userService';
import './AdminUserDetails.css';

type AdminCreateRole = 'Rider' | 'Driver' | 'Admin';

function roleToValue(role: AdminCreateRole): UserRoleValue {
  if (role === 'Admin') return 2;
  if (role === 'Driver') return 1;
  return 0;
}

export default function AdminAddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    baseFare: '0.00',
  });
  const [role, setRole] = useState<AdminCreateRole>('Rider');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value as AdminCreateRole);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const baseFare = Number(formData.baseFare);

    if (Number.isNaN(baseFare) || baseFare < 0) {
      setError('Enter a valid base fare.');
      return;
    }

    try {
      setIsSubmitting(true);

      const createdUser = await userService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: roleToValue(role),
        baseFare: role === 'Driver' ? baseFare : 0,
      });

      navigate(`/admin/users/${createdUser.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="admin-user-details__title">Add User</h1>
          <p className="admin-user-details__subtitle">
            Create a rider, driver, or admin account.
          </p>
        </div>
      </header>

      <form className="admin-user-card" onSubmit={handleSubmit}>
        <div className="admin-user-card__header">
          <h2>User Info</h2>
        </div>

        <div className="admin-detail-fields">
          <label>
            <span>First Name</span>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
          </label>

          <label>
            <span>Last Name</span>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </label>

          <label>
            <span>Role</span>
            <select name="role" value={role} onChange={handleRoleChange}>
              <option>Rider</option>
              <option>Driver</option>
              <option>Admin</option>
            </select>
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          {role === 'Driver' ? (
            <label>
              <span>Base Fare</span>
              <input
                name="baseFare"
                type="number"
                min="0"
                step="0.01"
                value={formData.baseFare}
                onChange={handleChange}
                required
              />
            </label>
          ) : null}
        </div>

        {error ? <p className="admin-user-details__error">{error}</p> : null}

        <div className="admin-add-user-actions">
          <button
            type="button"
            className="admin-detail-button admin-detail-button--secondary"
            onClick={() => navigate('/admin/users')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-detail-button admin-detail-button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </section>
  );
}
