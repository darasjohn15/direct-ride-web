import { apiUrl, parseApiError } from './api';
import type { UserRoleValue } from './userService';

type LoginResponse = {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string | UserRoleValue;
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const response = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    throw new Error('Invalid email or password.');
  }

  if (!response.ok) {
    throw await parseApiError(response, 'Login failed. Please try again.');
  }

  return response.json();
}
