import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRideRequestStatusValue,
  rideRequestService,
  RideRequestStatusValue,
  type RideRequest,
  type RideRequestFilters,
} from '../../../services/rideRequestService';
import { type User, userService } from '../../../services/userService';
import './AdminPages.css';

type RideStatusLabel = 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled';

type AdminRideRow = {
  id: string;
  date: string;
  dateTime: string;
  rider: string;
  driver: string;
  pickup: string;
  dropoff: string;
  fare: string;
  status: RideStatusLabel;
};

type PersonOption = {
  id: string;
  name: string;
};

type PaginationItem = number | 'ellipsis';

const RIDES_PAGE_SIZE = 6;

const statusOptions: { label: string; value: RideRequestStatusValue }[] = [
  { label: 'Pending', value: RideRequestStatusValue.Pending },
  { label: 'Accepted', value: RideRequestStatusValue.Accepted },
  { label: 'Declined', value: RideRequestStatusValue.Declined },
  { label: 'Completed', value: RideRequestStatusValue.Completed },
  { label: 'Cancelled', value: RideRequestStatusValue.Cancelled },
];

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

function getPersonName(
  directName: string | undefined,
  nestedPerson: { firstName: string; lastName: string } | undefined,
  fallback: string
): string {
  if (directName) return directName;
  if (nestedPerson) return `${nestedPerson.firstName} ${nestedPerson.lastName}`;
  return fallback;
}

function getRideDateTime(request: RideRequest): string {
  return request.slotStartTime ?? request.availabilitySlot?.startTime ?? request.createdAt;
}

function formatRideDate(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateLabel}, ${timeLabel}`;
}

function formatFare(request: RideRequest): string {
  const fare = request.fareAmount ?? request.fare;

  if (fare === undefined || fare === null) return 'Not available';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(fare);
}

function getRideStatusLabel(status: RideRequest['status']): RideStatusLabel {
  const statusValue = getRideRequestStatusValue(status);

  if (statusValue === RideRequestStatusValue.Accepted) return 'Accepted';
  if (statusValue === RideRequestStatusValue.Declined) return 'Declined';
  if (statusValue === RideRequestStatusValue.Completed) return 'Completed';
  if (statusValue === RideRequestStatusValue.Cancelled) return 'Cancelled';

  return 'Pending';
}

function mapRideRequestToRow(request: RideRequest): AdminRideRow {
  const dateTime = getRideDateTime(request);

  return {
    id: request.id,
    date: formatRideDate(dateTime),
    dateTime,
    rider: getPersonName(request.riderName, request.rider, 'Rider unavailable'),
    driver: getPersonName(request.driverName, request.driver, 'Driver unavailable'),
    pickup: request.pickupLocation,
    dropoff: request.dropoffLocation,
    fare: formatFare(request),
    status: getRideStatusLabel(request.status),
  };
}

function mapUserToOption(user: User): PersonOption {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
  };
}

function getDateRangeFilter(dateValue: string): Pick<
  RideRequestFilters,
  'slotStartTimeFrom' | 'slotStartTimeTo'
> {
  if (!dateValue) return {};

  const from = new Date(`${dateValue}T00:00:00`);
  const to = new Date(`${dateValue}T23:59:59.999`);

  return {
    slotStartTimeFrom: from.toISOString(),
    slotStartTimeTo: to.toISOString(),
  };
}

function sortRowsByDateDesc(rows: AdminRideRow[]): AdminRideRow[] {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a.dateTime).getTime();
    const bTime = new Date(b.dateTime).getTime();

    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

export default function AdminRides() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('All Drivers');
  const [riderFilter, setRiderFilter] = useState('All Riders');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [rides, setRides] = useState<AdminRideRow[]>([]);
  const [drivers, setDrivers] = useState<PersonOption[]>([]);
  const [riders, setRiders] = useState<PersonOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const selectedStatus = statusOptions.find((status) => status.label === statusFilter);
  const selectedDriverId = driverFilter === 'All Drivers' ? undefined : driverFilter;
  const selectedRiderId = riderFilter === 'All Riders' ? undefined : riderFilter;

  useEffect(() => {
    async function loadPeople() {
      const [driverData, riderData] = await Promise.all([
        userService.getUsers({ pageSize: 500, role: 'Driver' }),
        userService.getUsers({ pageSize: 500, role: 'Rider' }),
      ]);

      setDrivers(driverData.items.map(mapUserToOption));
      setRiders(riderData.items.map(mapUserToOption));
    }

    loadPeople().catch(() => {
      setDrivers([]);
      setRiders([]);
    });
  }, []);

  useEffect(() => {
    async function loadRides() {
      try {
        setIsLoading(true);
        setLoadError('');

        const data = await rideRequestService.getRideRequests({
          ...getDateRangeFilter(dateFilter),
          driverId: selectedDriverId,
          riderId: selectedRiderId,
          status: selectedStatus?.value,
        });

        const nextRides = sortRowsByDateDesc(data.map(mapRideRequestToRow));
        setRides(nextRides);
      } catch (error) {
        setRides([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load rides. Please confirm the admin account has access to GET /ride-requests.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRides();
  }, [dateFilter, selectedDriverId, selectedRiderId, selectedStatus?.value]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, driverFilter, riderFilter, statusFilter]);

  const totalItems = rides.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / RIDES_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalPages;
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);
  const showingStart = totalItems > 0 ? (safeCurrentPage - 1) * RIDES_PAGE_SIZE + 1 : 0;
  const showingEnd = Math.min(safeCurrentPage * RIDES_PAGE_SIZE, totalItems);
  const paginatedRides = useMemo(
    () =>
      rides.slice(
        (safeCurrentPage - 1) * RIDES_PAGE_SIZE,
        safeCurrentPage * RIDES_PAGE_SIZE
      ),
    [rides, safeCurrentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Rides</h1>
        <p className="admin-page__subtitle">
          Monitor ride requests, scheduled trips, and completed service history.
        </p>
      </header>

      <div className="admin-users-panel">
        <div className="admin-rides-toolbar" aria-label="Ride filters">
          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>

          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by driver</span>
            <select
              value={driverFilter}
              onChange={(event) => setDriverFilter(event.target.value)}
            >
              <option>All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by rider</span>
            <select
              value={riderFilter}
              onChange={(event) => setRiderFilter(event.target.value)}
            >
              <option>All Riders</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-users-select">
            <span className="admin-users-select__label">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="admin-users-state">Loading rides...</div>
        ) : loadError ? (
          <div className="admin-users-state admin-users-state--error">{loadError}</div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table admin-rides-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Rider</th>
                  <th scope="col">Driver</th>
                  <th scope="col">Pickup</th>
                  <th scope="col">Dropoff</th>
                  <th scope="col">Fare</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRides.map((ride) => (
                  <tr key={ride.id}>
                    <td>{ride.date}</td>
                    <td>{ride.rider}</td>
                    <td>{ride.driver}</td>
                    <td>{ride.pickup}</td>
                    <td>{ride.dropoff}</td>
                    <td>{ride.fare}</td>
                    <td>
                      <span className={`admin-status-badge admin-ride-status--${ride.status.toLowerCase()}`}>
                        {ride.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-user-view-button"
                        onClick={() => navigate(`/admin/rides/${ride.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rides.length === 0 ? (
              <div className="admin-users-empty">No rides match those filters.</div>
            ) : null}
          </div>
        )}

        <div className="admin-users-pagination">
          <p>
            Showing {showingStart} to {showingEnd} of {totalItems} rides
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
