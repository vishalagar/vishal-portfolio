import { LINEUP } from "@/content/career";
import { waves } from "./arrange";
import styles from "./Corrals.module.css";

/** Running: start corrals. The bib number is the shirt number. */
export function Corrals() {
  return (
    <div className={styles.waves}>
      {waves(LINEUP).map((w) => (
        <ul key={w.label} className={styles.wave} aria-label={w.label}>
          <li className={styles.label} aria-hidden="true">
            {w.label}
          </li>
          {w.bibs.map((b) => (
            <li key={b.n} className={`${styles.bib} va-card`}>
              <span className={styles.strip} aria-hidden="true" />
              <span className={`${styles.pin} ${styles.pinL}`} aria-hidden="true" />
              <span className={`${styles.pin} ${styles.pinR}`} aria-hidden="true" />
              <span className={styles.num}>
                <span className="sr-only">Bib </span>
                {b.n}
              </span>
              <span className={styles.name}>{b.name}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
