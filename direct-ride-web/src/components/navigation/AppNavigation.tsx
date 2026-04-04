import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppNavigation.css';

type NavItem = {
  label: string;
  path: string;
};

type AppNavigationProps = {
  title: string;
  items: NavItem[];
};

export default function AppNavigation({ title, items }: AppNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div className="mobile-topbar">
        <div className="mobile-topbar__brand">{title}</div>

        <button
          type="button"
          className="mobile-topbar__menu-button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden={!isMobileMenuOpen}
      />

      <nav className={`side-nav ${isMobileMenuOpen ? 'side-nav--mobile-open' : ''}`}>
        <div className="side-nav__brand">{title}</div>

        <div className="side-nav__links">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                isActive ? 'side-nav__link active' : 'side-nav__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}