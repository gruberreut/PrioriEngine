import { NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { useTheme } from "../../features/theme/useTheme";
import styles from "./NavBar.module.css";

interface NavBarProps {
  onNavigate?: (path: string) => void;
}

export function NavBar({ onNavigate }: NavBarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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
      <div className={styles.themeToggle}>
        <ThemeToggle theme={theme} onChange={setTheme} />
      </div>
    </nav>
  );
}
