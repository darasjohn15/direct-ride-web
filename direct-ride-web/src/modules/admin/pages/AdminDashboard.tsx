import './AdminPages.css';

export default function AdminDashboard() {
  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <p className="admin-page__eyebrow">Admin</p>
        <h1 className="admin-page__title">Dashboard</h1>
        <p className="admin-page__subtitle">
          A home base for platform health, ride activity, and operational snapshots.
        </p>
      </header>

      <div className="admin-page__placeholder">
        <h2>Dashboard view</h2>
        <p>Metrics and quick actions will live here.</p>
      </div>
    </section>
  );
}
