import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService, type UserRoleValue } from '../../../services/userService';
import directRideLogoBackdrop from '../../../assets/direct-ride-logo.png';
import './Login.css';

type DirectRideLogoProps = {
  tone: 'light' | 'dark';
};

type RegistrationRole = 'rider' | 'driver';

function DirectRideLogo({ tone }: DirectRideLogoProps) {
  return (
    <div className={`direct-ride-logo direct-ride-logo--${tone}`} aria-label="DirectRide">
      <span className="direct-ride-logo__mark" aria-hidden="true">
        <span className="direct-ride-logo__slash" />
      </span>
      <span className="direct-ride-logo__text">DirectRide</span>
    </div>
  );
}

function roleToValue(role: RegistrationRole): UserRoleValue {
  return role === 'driver' ? 1 : 0;
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [role, setRole] = useState<RegistrationRole>('rider');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await userService.createUser({
        ...formData,
        role: roleToValue(role),
      });

      navigate('/login', { state: { accountCreated: true } });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page register-page">
      <div className="login-shell register-shell">
        <div className="login-visual register-visual">
          <img
            className="login-visual__backdrop"
            src={directRideLogoBackdrop}
            alt=""
            aria-hidden="true"
          />
          <div className="visual-content">
            <DirectRideLogo tone="light" />
            <h1>Create your account.</h1>
            <p>Join DirectRide and get started with fast, reliable, and safe rides.</p>
          </div>
        </div>

        <div className="login-panel register-panel">
          <div className="login-card register-card">
            <div className="login-card__brand register-card__brand">
              <DirectRideLogo tone="dark" />
            </div>

            <div className="login-header">
              <h2>Register</h2>
              <p>Fill in your details to create your account.</p>
            </div>

            <form className="login-form register-form" onSubmit={handleSubmit}>
              <div className="register-name-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <fieldset className="role-fieldset">
                <legend>I'm registering as</legend>
                <div className="role-segment" role="radiogroup" aria-label="Registration role">
                  <label className={role === 'rider' ? 'role-option role-option--active' : 'role-option'}>
                    <input
                      type="radio"
                      name="role"
                      value="rider"
                      checked={role === 'rider'}
                      onChange={() => setRole('rider')}
                    />
                    <span className="role-option__icon role-option__icon--rider" aria-hidden="true" />
                    Rider
                  </label>

                  <label className={role === 'driver' ? 'role-option role-option--active' : 'role-option'}>
                    <input
                      type="radio"
                      name="role"
                      value="driver"
                      checked={role === 'driver'}
                      onChange={() => setRole('driver')}
                    />
                    <span className="role-option__icon role-option__icon--driver" aria-hidden="true" />
                    Driver
                  </label>
                </div>
              </fieldset>

              {error ? <p className="error-message">{error}</p> : null}

              <button className="login-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
