import { LINEUP } from "@/content/career";
import styles from "./Formation.module.css";

/** Football: 4-3-3, front line first. */
export function Formation() {
  return (
    <div className={styles.formation}>
      {LINEUP.map((line, i) => (
        <ul key={i} className={styles.line}>
          {line.map((p) => (
            <li key={p.n} className={`${styles.player} va-card`}>
              <span className={styles.shirt} aria-hidden="true">
                {p.n}
              </span>
              <span className={styles.name}>
                <span className="sr-only">Number {p.n}: </span>
                {p.name}
              </span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
