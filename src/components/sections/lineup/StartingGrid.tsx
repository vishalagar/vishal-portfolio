import { LINEUP } from "@/content/career";
import { gridSlots } from "./arrange";
import styles from "./StartingGrid.module.css";

/** Grand Prix: two-wide staggered grid, Python on pole, five start lights above. */
export function StartingGrid() {
  const slots = gridSlots(LINEUP);
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.lights} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={styles.light} style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
        <span className={styles.order}>Grid order · pole sitter first</span>
      </div>
      <ol className={styles.grid}>
        {slots.map((g) => (
          <li key={g.n} className={`${styles.slot} ${g.staggered ? styles.back : ""}`}>
            <span className={styles.pos}>
              <span className="sr-only">Grid position </span>
              {g.pos}
            </span>
            <span className={styles.info}>
              <span className={styles.car}>{g.car}</span>
              <span className={styles.name}>{g.name}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
