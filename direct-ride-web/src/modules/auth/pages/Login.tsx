import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../services/authService';
import { getRoleFromToken } from '../../../types/auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

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

    localStorage.setItem('token', token);

    const role = getRoleFromToken(token);

    if (role === 'driver') {
      navigate('/driver/dashboard');
    } else if (role === 'rider') {
      navigate('/rider/dashboard');
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
          <div className="visual-content">
            <span className="brand-badge">DirectRide</span>
            <h1>Welcome back.</h1>
            <p>
              Sign in to access your DirectRide account and head to the right dashboard automatically.
            </p>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-card">
            <div className="login-header">
              <h2>Sign in</h2>
              <p>Enter your email and password to continue.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}