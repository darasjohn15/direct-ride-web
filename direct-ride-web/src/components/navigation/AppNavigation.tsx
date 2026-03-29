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
  return (
    <nav className="side-nav">
      <div className="side-nav__brand">{title}</div>

      <div className="side-nav__links">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'side-nav__link active' : 'side-nav__link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}