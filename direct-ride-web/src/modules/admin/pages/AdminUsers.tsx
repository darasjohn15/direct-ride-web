import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRoleLabel, type User, userService } from '../../../services/userService';
import './AdminPages.css';

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Driver' | 'Rider' | 'Admin';
  status: 'Active' | 'Deactivated';
  joinedOn: string;
};

type UserWithAdminFields = User & {
  Id?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  PhoneNumber?: string;
  Role?: User['role'];
  CreatedAt?: string;
  joinedOn?: string;
  JoinedOn?: string;
  status?: string | number | boolean;
  Status?: string | number | boolean;
  isActive?: boolean;
  IsActive?: boolean;
};

const USERS_PAGE_SIZE = 6;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatJoinedOn(dateValue?: string) {
  if (!dateValue) return 'Not available';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getUserStatus(user: UserWithAdminFields): AdminUserRow['status'] {
  const isActive = user.isActive ?? user.IsActive;
  const status = user.status ?? user.Status;

  if (typeof isActive === 'boolean') {
    return isActive ? 'Active' : 'Deactivated';
  }

  if (typeof status === 'boolean') {
    return status ? 'Active' : 'Deactivated';
  }

  const normalizedStatus = String(status ?? 'active').toLowerCase();

  if (
    normalizedStatus === '0' ||
    normalizedStatus === 'inactive' ||
    normalizedStatus === 'deactivated' ||
    normalizedStatus === 'disabled'
  ) {
    return 'Deactivated';
  }

  return 'Active';
}

function mapUserToRow(user: UserWithAdminFields): AdminUserRow {
  const id = user.id ?? user.Id ?? user.email ?? user.Email ?? crypto.randomUUID();
  const firstName = user.firstName ?? user.FirstName ?? '';
  const lastName = user.lastName ?? user.LastName ?? '';
  const email = user.email ?? user.Email ?? 'Not available';
  const phone = user.phoneNumber ?? user.PhoneNumber ?? 'Not available';
  const role = user.role ?? user.Role ?? 'rider';
  const joinedOn = user.joinedOn ?? user.JoinedOn ?? user.createdAt ?? user.CreatedAt;

  return {
    id,
    name: `${firstName} ${lastName}`.trim() || email,
    email,
    phone,
    role: getUserRoleLabel(role),
    status: getUserStatus(user),
    joinedOn: formatJoinedOn(joinedOn),
  };
}

type PaginationItem = number | 'ellipsis';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage, 'ellipsis', totalPages];
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const selectedRole = roleFilter === 'All Roles' ? undefined : roleFilter;
  const selectedStatus = statusFilter === 'All Statuses' ? undefined : statusFilter;

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        setLoadError('');

        const data = await userService.getUsers({
          page: currentPage,
          pageSize: USERS_PAGE_SIZE,
          search: searchTerm.trim() || undefined,
          role: selectedRole,
          status: selectedStatus,
        });
        setUsers(data.items.map((user) => mapUserToRow(user)));
        setCurrentPage(data.page);
        setTotalItems(data.totalItems);
        setTotalPages(Math.max(1, data.totalPages));
        setHasPreviousPage(data.hasPreviousPage);
        setHasNextPage(data.hasNextPage);
      } catch (error) {
        setUsers([]);
        setTotalItems(0);
        setTotalPages(1);
        setHasPreviousPage(false);
        setHasNextPage(false);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load users. Please confirm the admin account has access to GET /users.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchTerm, statusFilter]);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);
  const showingStart = totalItems > 0 ? (safeCurrentPage - 1) * USERS_PAGE_SIZE + 1 : 0;
  const showingEnd = Math.min(safeCurrentPage * USERS_PAGE_SIZE, totalItems);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Users</h1>
        <p className="admin-page__subtitle">
          Review riders, drivers, and admin accounts from one workspace.
        </p>
      </header>

      <div className="admin-users-panel">

        <div className="admin-users-toolbar" aria-label="User filters">
          <label className="admin-users-search">
            <span className="admin-users-search__label">Search users</span>
            <input
              type="search"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by role</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option>All Roles</option>
              <option>Driver</option>
              <option>Rider</option>
              <option>Admin</option>
            </select>
          </label>

          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Deactivated</option>
            </select>
          </label>

            <button
              type="button"
              className="admin-users-add-button"
              onClick={() => navigate('/admin/users/new')}
            >
              + Add User
            </button>
          </div>

          {isLoading ? (
            <div className="admin-users-state">Loading users...</div>
          ) : loadError ? (
            <div className="admin-users-state admin-users-state--error">{loadError}</div>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined On</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-name">
                          <span className={`admin-user-avatar admin-user-avatar--${user.role.toLowerCase()}`}>
                            {getInitials(user.name)}
                          </span>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>
                        <span className={`admin-role-badge admin-role-badge--${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge admin-status-badge--${user.status.toLowerCase()}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.joinedOn}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-user-view-button"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 ? (
                <div className="admin-users-empty">No users match those filters.</div>
              ) : null}
            </div>
          )}

        <div className="admin-users-pagination">
          <p>
            Showing {showingStart} to {showingEnd} of {totalItems} users
          </p>

          <div className="admin-pagination-controls" aria-label="Pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={!hasPreviousPage}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              &lt;
            </button>

            {paginationItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`}>...</span>
              ) : (
                <button
                  type="button"
                  key={item}
                  className={item === safeCurrentPage ? 'active' : ''}
                  aria-current={item === safeCurrentPage ? 'page' : undefined}
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              )
            ))}

            <button
              type="button"
              aria-label="Next page"
              disabled={!hasNextPage}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
