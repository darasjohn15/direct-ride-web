import { Navigate, Outlet } from 'react-router-dom';
import { getRoleFromToken, getToken, type UserRole } from '../types/auth';

type RoleRouteProps = {
  allowedRole: UserRole;
};

export default function RoleRoute({ allowedRole }: RoleRouteProps) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = getRoleFromToken(token);

  if (role !== allowedRole) {
    if (role === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    }

    if (role === 'rider') {
      return <Navigate to="/rider/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}