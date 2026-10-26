import Image from "next/image";
import styles from "./StaticDemos.module.css";

/** Capstone: pixel flame, rising smoke and the detector's boxes. CSS animation only. */
export function FireDemo() {
  return (
    <div className={styles.fire} aria-hidden="true">
      <div className={styles.floor} />
      <div className={styles.machine}>
        <div className={styles.ledGreen} />
        <div className={styles.ledYellow} />
        <div className={styles.panel} />
      </div>
      <div className={styles.flame}>
        <div className={styles.flameOuter} />
        <div className={styles.flameMid} />
        <div className={styles.flameCore} />
      </div>
      <div className={`${styles.smoke} ${styles.smoke1}`} />
      <div className={`${styles.smoke} ${styles.smoke2}`} />
      <div className={`${styles.smoke} ${styles.smoke3}`} />
      <div className={styles.fireBox}>
        <span>fire 0.93</span>
      </div>
      <div className={styles.smokeBox}>
        <span>smoke 0.88</span>
      </div>
      <span className={styles.client}>client 3 of 5 · federated</span>
    </div>
  );
}

/** The real notebook output: grayscale input wipes across to the U-Net's colour output. */
export function ColorizeDemo() {
  return (
    <div className={styles.colorize}>
      <Image src="/img/colorize-out.png" alt="U-Net colour output of a cartoon frame" fill sizes="(max-width: 700px) 100vw, 400px" className={styles.out} />
      <Image
        src="/img/colorize-in.png"
        alt="The same cartoon frame in grayscale, the model's input"
        fill
        sizes="(max-width: 700px) 100vw, 400px"
        className={styles.in}
      />
      <span className={styles.wipe} aria-hidden="true" />
      <span className={styles.caption}>input → U-Net output</span>
    </div>
  );
}
