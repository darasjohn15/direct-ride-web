import { Outlet } from 'react-router-dom';
import AppNavigation from '../components/navigation/AppNavigation';
import './AppLayout.css';

const driverNavItems = [
  { label: 'Dashboard', path: '/driver/dashboard' },
  { label: 'Schedule', path: '/driver/schedule' },
  { label: 'Requests', path: '/driver/requests' },
  { label: 'Earnings', path: '/driver/earnings' },
  { label: 'Profile', path: '/driver/profile' },
];

export default function DriverLayout() {
  return (
    <div className="app-layout">
      <AppNavigation title="DirectRide" items={driverNavItems} />
      <main className="app-layout__content">
        <div className="app-layout__content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}