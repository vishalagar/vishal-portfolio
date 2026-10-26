import { LINEUP } from "@/content/career";
import { characters } from "./arrange";
import styles from "./CharacterSelect.module.css";

/** Gaming: character select. P1 cursor on Python, plus one locked "next unlock" slot (11 of 12). */
export function CharacterSelect() {
  const chars = characters(LINEUP);
  const p1 = chars.find((c) => c.selected);
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span>Select your party · {chars.length} of {chars.length + 1}</span>
        {p1 ? <span>P1 · {p1.name}</span> : null}
      </div>
      <ul className={styles.grid}>
        {chars.map((c) => (
          <li key={c.n} className={`${styles.card} ${c.selected ? styles.sel : ""}`}>
            {c.selected ? (
              <span className={styles.cursor}>
                P1<span className="sr-only"> cursor</span>
              </span>
            ) : null}
            <span className={styles.face} aria-hidden="true">
              {c.initials}
            </span>
            <span className={styles.name}>{c.name}</span>
            <span className={styles.role}>{c.role}</span>
          </li>
        ))}
        <li className={`${styles.card} ${styles.locked}`}>
          <span className={styles.face} aria-hidden="true">
            ?
          </span>
          <span className={styles.name}>Locked</span>
          <span className={styles.role}>Next unlock</span>
        </li>
      </ul>
    </div>
  );
}
