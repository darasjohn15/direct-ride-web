import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from '../modules/auth/pages/Login';
import Register from '../modules/auth/pages/Register';

import DriverLayout from '../layouts/DriverLayout';
import RiderLayout from '../layouts/RiderLayout';
import AdminLayout from '../layouts/AdminLayout';

import DriverDashboard from '../modules/driver/pages/DriverDashboard';
import DriverSchedule from '../modules/driver/pages/DriverSchedule';
import DriverRequests from '../modules/driver/pages/DriverRequests';
import DriverEarnings from '../modules/driver/pages/DriverEarnings';
import DriverProfile from '../modules/driver/pages/DriverProfile';

import RiderDashboard from '../modules/rider/pages/RiderDashboard';
import RiderBookRide from '../modules/rider/pages/RiderBookRide';
import RiderTrips from '../modules/rider/pages/RiderTrips';
import RiderProfile from '../modules/rider/pages/RiderProfile';

import AdminDashboard from '../modules/admin/pages/AdminDashboard';
import AdminUsers from '../modules/admin/pages/AdminUsers';
import AdminRides from '../modules/admin/pages/AdminRides';
import AdminProfile from '../modules/admin/pages/AdminProfile';
import AdminUserDetails from '../modules/admin/pages/AdminUserDetails';
import AdminAddUser from '../modules/admin/pages/AdminAddUser';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { getRoleFromToken, getToken } from '../types/auth';

function RootRedirect() {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = getRoleFromToken(token);

  if (role === 'driver') {
    return <Navigate to="/driver/dashboard" replace />;
  }

  if (role === 'rider') {
    return <Navigate to="/rider/dashboard" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRole="driver" />}>
            <Route path="/driver" element={<DriverLayout />}>
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="schedule" element={<DriverSchedule />} />
              <Route path="requests" element={<DriverRequests />} />
              <Route path="earnings" element={<DriverEarnings />} />
              <Route path="profile" element={<DriverProfile />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="rider" />}>
            <Route path="/rider" element={<RiderLayout />}>
              <Route path="dashboard" element={<RiderDashboard />} />
              <Route path="book-ride" element={<RiderBookRide />} />
              <Route path="trips" element={<RiderTrips />} />
              <Route path="profile" element={<RiderProfile />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/new" element={<AdminAddUser />} />
              <Route path="users/:userId" element={<AdminUserDetails />} />
              <Route path="rides" element={<AdminRides />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
