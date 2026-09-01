import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../Icon/Icon";
import { Tendril } from "../../assets/icons/Tendril";
import { ListChecks } from "../../assets/icons/ListChecks";
import styles from "./NavBar.module.css";

interface NavBarProps {
  onNavigate?: (path: string) => void;
  /** Hide the destination links. Used by blocking routes (e.g. /in-progress)
   *  where navigation is suppressed; the bar keeps its place (rendering
   *  empty) so the layout doesn't shift when the block resolves. */
  linksHidden?: boolean;
}

const destinations = [
  { path: "/", label: "Rank", asset: Tendril, end: true },
  { path: "/tasks", label: "Tasks", asset: ListChecks, end: false },
];

export function NavBar({ onNavigate, linksHidden = false }: NavBarProps) {
  const location = useLocation();

  function handleClick(path: string) {
    if (location.pathname !== path) {
      onNavigate?.(path);
    }
  }

  return (
    <nav className={styles.nav} aria-label="Main">
      {!linksHidden && (
        <ul className={styles.list}>
          {destinations.map(({ path, label, asset, end }) => (
            <li key={path} className={styles.item}>
              <NavLink
                to={path}
                end={end}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ""}`
                }
                onClick={() => handleClick(path)}
              >
                <span className={styles.glyph}>
                  <Icon asset={asset} label={label} size={24} />
                </span>
                <span className={styles.label}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
