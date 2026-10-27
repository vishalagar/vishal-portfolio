import { existsSync } from "node:fs";
import path from "node:path";
import { UnmaskSprite } from "@/components/sprite/UnmaskSprite";
import { FOOTER, SITE } from "@/content/site";
import { FooterKicker } from "./FooterKicker";
import { WhistleLink } from "./WhistleLink";
import styles from "./Footer.module.css";

/** The resume button only appears once public/resume.pdf exists (checked at build time). */
function hasResume(): boolean {
  return existsSync(path.join(process.cwd(), "public", SITE.resumePath));
}

export function Footer() {
  const resume = hasResume();
  return (
    <footer id="fulltime" className={styles.footer}>
      <div className={styles.top}>
        <UnmaskSprite
          className={styles.portrait}
          scale={3}
          glance={{ duration: 12, delay: -7 }}
          label="Pixel-art Vishal"
        />
        <div className={styles.sign}>
          <FooterKicker />
          <h2 className={styles.title}>
            {FOOTER.title}
            <span className={styles.accent}>{FOOTER.titleAccent}</span>
          </h2>
        </div>
        <div className={styles.links}>
          <WhistleLink href={`mailto:${SITE.email}`} className={`${styles.link} ${styles.primary} va-press`}>
            Email
          </WhistleLink>
          <a href={SITE.links.github} className={`${styles.link} va-press`} target="_blank" rel="noopener noreferrer">
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={SITE.links.linkedin} className={`${styles.link} va-press`} target="_blank" rel="noopener noreferrer">
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
          {resume && (
            <a href={SITE.resumePath} className={`${styles.link} va-press`} target="_blank" rel="noopener">
              Resume [PDF]
            </a>
          )}
        </div>
      </div>
      <div className={styles.bottom}>
        <span>{FOOTER.copyright}</span>
        <span className={styles.privacy}>{FOOTER.privacy}</span>
        <span className={`pixel ${styles.varHint}`} style={{ fontSize: 11 }}>
          {FOOTER.hint}
        </span>
      </div>
    </footer>
  );
}
