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
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  exp?: number;
  iat?: number;
};

const TOKEN_STORAGE_KEY = 'token';
const DOTNET_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function isExpired(payload: AuthTokenPayload): boolean {
  if (!payload.exp) return false;

  return payload.exp * 1000 <= Date.now();
}

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
  const role = payload?.role ?? payload?.[DOTNET_ROLE_CLAIM];

  if (role === undefined || role === null) return null;

  const normalizedRole = String(role).toLowerCase();

  if (normalizedRole === '0' || normalizedRole === 'rider') return 'rider';
  if (normalizedRole === '1' || normalizedRole === 'driver') return 'driver';
  if (normalizedRole === 'admin') return 'admin';

  return null;
}

export function getUserIdFromToken(token: string): string | null {
  const payload = parseJwt(token);
  return payload?.sub ?? null;
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) return null;

  const payload = parseJwt(token);

  if (!payload || isExpired(payload)) {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
