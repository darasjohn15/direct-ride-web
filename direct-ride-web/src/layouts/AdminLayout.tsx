import { Outlet } from 'react-router-dom';
import AppNavigation from '../components/navigation/AppNavigation';
import './AppLayout.css';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Rides', path: '/admin/rides' },
  { label: 'Profile', path: '/admin/profile' },
];

export default function AdminLayout() {
  return (
    <div className="app-layout">
      <AppNavigation title="DirectRide Admin" items={adminNavItems} />
      <main className="app-layout__content">
        <div className="app-layout__content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
