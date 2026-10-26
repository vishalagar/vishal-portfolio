import { NAV, TICKER } from "@/content/site";
import { WorldSwitcher } from "@/components/worlds/WorldSwitcher";
import styles from "./Header.module.css";
import { Scorebug } from "./Scorebug";
import { SoundToggle } from "./SoundToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const ticker = [...TICKER, ...TICKER];
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Scorebug />
        <nav aria-label="Sections" className={styles.nav}>
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className={styles.worlds}>
          <WorldSwitcher />
        </div>
        <div className={styles.toggles}>
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className={styles.ticker}>
        <p className="sr-only">Latest: {TICKER.join(". ")}.</p>
        <div className={styles.tickerTrack} aria-hidden="true">
          {ticker.map((t, i) => (
            <span key={i} className={styles.tickerItem}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
