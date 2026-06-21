import { NavLink, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";

interface NavBarProps {
  onNavigate?: (path: string) => void;
}

export function NavBar({ onNavigate }: NavBarProps) {
  const location = useLocation();

  function handleClick(path: string) {
    if (location.pathname !== path) {
      onNavigate?.(path);
    }
  }

  return (
    <nav className={styles.nav}>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ""}`
        }
        onClick={() => handleClick("/")}
      >
        Rank
      </NavLink>
      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ""}`
        }
        onClick={() => handleClick("/tasks")}
      >
        Tasks
      </NavLink>
    </nav>
  );
}
