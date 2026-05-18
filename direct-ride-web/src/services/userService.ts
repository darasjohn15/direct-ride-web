import { apiUrl, authFetch, parseApiError } from './api';

export type UserRoleValue = 0 | 1;

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRoleValue | 'rider' | 'driver' | 'Rider' | 'Driver';
    phoneNumber: string;
    baseFare: number;
};

export type CreateUserRequest = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: UserRoleValue;
    password: string;
    baseFare?: number;
};

export type UpdateUserRequest = Partial<Omit<User, 'id'>>;

const USERS_URL = apiUrl('/users');

export const userService = {
    async createUser(data: CreateUserRequest): Promise<User> {
        const response = await fetch(USERS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw await parseApiError(response, 'Failed to create user');
        return response.json();
    },

    async getCurrentUser(): Promise<User> {
        const response = await authFetch(`${USERS_URL}/me`);

        if (!response.ok) throw await parseApiError(response, 'Failed to fetch current user');
        return response.json();
    },

    async getUsers(): Promise<User[]> {
        const response = await authFetch(USERS_URL);

        if (!response.ok) throw await parseApiError(response, 'Failed to fetch users');
        return response.json();
    },

    async getUserById(userId: string): Promise<User> {
        const response = await authFetch(`${USERS_URL}/${userId}`);

        if (response.ok) {
            return response.json();
        }

        if (response.status === 404) throw new Error('User not found');
        throw await parseApiError(response, 'Failed to fetch user');
    },

    async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
        const response = await authFetch(`${USERS_URL}/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw await parseApiError(response, 'Failed to update user');
        return response.json();
    },

    async patchUser(userId: string, data: UpdateUserRequest): Promise<User> {
        const response = await authFetch(`${USERS_URL}/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw await parseApiError(response, 'Failed to update user');
        return response.json();
    },
};

export function getUserRoleLabel(role: User['role']): 'Rider' | 'Driver' {
    if (role === 1 || String(role).toLowerCase() === 'driver') return 'Driver';
    return 'Rider';
}

export function getUserRoleValue(role: User['role']): UserRoleValue {
    return getUserRoleLabel(role) === 'Driver' ? 1 : 0;
}
