export type UserRole = "rider" | "driver" | "admin";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}

export function parseJwt(token: string): AuthTokenPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const decoded = decodeBase64Url(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): UserRole | null {
  const payload = parseJwt(token);
  return payload?.role ?? null;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function clearToken(): void {
  localStorage.removeItem('token');
}