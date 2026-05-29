import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../../services/authService';
import { getRoleFromToken, setToken } from '../../../types/auth';
import directRideLogoBackdrop from '../../../assets/direct-ride-logo.png';
import './Login.css';

type DirectRideLogoProps = {
  tone: 'light' | 'dark';
};

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const accountCreated = Boolean(location.state && 'accountCreated' in location.state);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
      const response = await login(formData.email, formData.password);
      const { token } = response;

      setToken(token);

      const role = getRoleFromToken(token);

      if (role === 'driver') {
        navigate('/driver/dashboard');
      } else if (role === 'rider') {
        navigate('/rider/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Unable to determine account role.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-visual">
          <img
            className="login-visual__backdrop"
            src={directRideLogoBackdrop}
            alt=""
            aria-hidden="true"
          />
          <div className="visual-content">
            <DirectRideLogo tone="light" />
            <h1>Welcome back.</h1>
            <p>
              Sign in to access your DirectRide account and head to the right dashboard automatically.
            </p>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-card">
            <div className="login-card__brand">
              <DirectRideLogo tone="dark" />
            </div>

            <div className="login-header">
              <h2>Sign in</h2>
              <p>Enter your email and password to continue.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {accountCreated ? (
                <p className="success-message">Account created. Sign in to continue.</p>
              ) : null}

              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
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

              {error ? <p className="error-message">{error}</p> : null}

              <button className="login-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <Link className="secondary-auth-button" to="/register">
                Sign Up
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
