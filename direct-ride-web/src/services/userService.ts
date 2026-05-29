import { apiUrl, authFetch, buildQueryString, parseApiError } from './api';

export type UserRoleValue = 0 | 1 | 2;

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRoleValue | 'rider' | 'driver' | 'admin' | 'Rider' | 'Driver' | 'Admin';
    phoneNumber: string;
    createdAt: string;
    baseFare: number;
};

type UsersResponseBody =
    | User[]
    | {
        users?: User[];
        data?: User[];
        items?: User[];
        results?: User[];
        value?: User[];
        $values?: User[];
    };

export type GetUsersParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
};

export type PaginatedUsersResponse = {
    items: User[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

type ApiPaginatedUsersResponse = {
    items?: User[];
    Items?: User[];
    page?: number;
    Page?: number;
    pageSize?: number;
    PageSize?: number;
    totalItems?: number;
    TotalItems?: number;
    totalPages?: number;
    TotalPages?: number;
    hasPreviousPage?: boolean;
    HasPreviousPage?: boolean;
    hasNextPage?: boolean;
    HasNextPage?: boolean;
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

    async getUsers(params: GetUsersParams = {}): Promise<PaginatedUsersResponse> {
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const response = await authFetch(`${USERS_URL}${buildQueryString({
            page,
            pageSize,
            search: params.search,
            role: params.role,
            status: params.status,
        })}`);

        if (!response.ok) throw await parseApiError(response, 'Failed to fetch users');
        const body = await response.json() as UsersResponseBody | ApiPaginatedUsersResponse;

        if (!Array.isArray(body)) {
            const apiBody = body as ApiPaginatedUsersResponse;
            const items = apiBody.items ?? apiBody.Items;

            if (Array.isArray(items)) {
                return {
                    items,
                    page: apiBody.page ?? apiBody.Page ?? page,
                    pageSize: apiBody.pageSize ?? apiBody.PageSize ?? pageSize,
                    totalItems: apiBody.totalItems ?? apiBody.TotalItems ?? items.length,
                    totalPages: apiBody.totalPages ?? apiBody.TotalPages ?? Math.max(1, Math.ceil(items.length / pageSize)),
                    hasPreviousPage: apiBody.hasPreviousPage ?? apiBody.HasPreviousPage ?? page > 1,
                    hasNextPage: apiBody.hasNextPage ?? apiBody.HasNextPage ?? false,
                };
            }
        }

        let users: User[] | undefined;

        if (Array.isArray(body)) {
            users = body;
        } else {
            const legacyBody = body as Exclude<UsersResponseBody, User[]>;

            if (Array.isArray(legacyBody.users)) users = legacyBody.users;
            else if (Array.isArray(legacyBody.data)) users = legacyBody.data;
            else if (Array.isArray(legacyBody.items)) users = legacyBody.items;
            else if (Array.isArray(legacyBody.results)) users = legacyBody.results;
            else if (Array.isArray(legacyBody.value)) users = legacyBody.value;
            else if (Array.isArray(legacyBody.$values)) users = legacyBody.$values;
        }

        if (users) {
            return {
                items: users,
                page,
                pageSize,
                totalItems: users.length,
                totalPages: Math.max(1, Math.ceil(users.length / pageSize)),
                hasPreviousPage: page > 1,
                hasNextPage: page * pageSize < users.length,
            };
        }

        throw new Error('Users response did not include a user list.');
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

export function getUserRoleLabel(role: User['role']): 'Rider' | 'Driver' | 'Admin' {
    if (role === 2 || String(role).toLowerCase() === 'admin') return 'Admin';
    if (role === 1 || String(role).toLowerCase() === 'driver') return 'Driver';
    return 'Rider';
}

export function getUserRoleValue(role: User['role']): UserRoleValue {
    const label = getUserRoleLabel(role);

    if (label === 'Admin') return 2;
    if (label === 'Driver') return 1;
    return 0;
}
