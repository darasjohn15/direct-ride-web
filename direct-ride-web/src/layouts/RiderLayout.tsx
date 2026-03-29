import { Outlet } from 'react-router-dom';
import AppNavigation from '../components/navigation/AppNavigation';
import './AppLayout.css';

const riderNavItems = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Book a Ride', path: '/rider/book-ride' },
  { label: 'My Trips', path: '/rider/trips' },
  { label: 'Profile', path: '/rider/profile' },
];

export default function RiderLayout() {
  return (
    <div className="app-layout">
      <AppNavigation title="DirectRide Rider" items={riderNavItems} />
      <main className="app-layout__content">
        <div className="app-layout__content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}