import './AdminPages.css';

export default function AdminRides() {
  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <p className="admin-page__eyebrow">Admin</p>
        <h1 className="admin-page__title">Rides</h1>
        <p className="admin-page__subtitle">
          Monitor ride requests, scheduled trips, and completed service history.
        </p>
      </header>

      <div className="admin-page__placeholder">
        <h2>Rides view</h2>
        <p>Ride oversight tools will live here.</p>
      </div>
    </section>
  );
}
