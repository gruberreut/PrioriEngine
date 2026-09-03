import { Icon } from "../../../components/Icon/Icon";
import { Tendril } from "../../../assets/icons/Tendril";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  return (
    <div className={styles.screen}>
      <Icon asset={Tendril} label="Priori" size={96} />
      <span className={styles.wordmark}>Priori</span>
    </div>
  );
}
