import { LINEUP } from "@/content/career";
import { network } from "./arrange";
import styles from "./NeuralNet.module.css";

/** AI: input -> hidden 1 -> hidden 2 -> output, every node joined to every node in the next layer, with signal pulses. */
export function NeuralNet() {
  const net = network(LINEUP);
  return (
    <div className={styles.net} role="group" aria-label="Neural network of the eleven technologies, 25 connections">
      {net.captions.map((c) => (
        <span key={c.name} className={styles.cap} style={{ left: `${c.x}%` }}>
          {c.name}
        </span>
      ))}
      <svg className={styles.svg} aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {net.edges.map((e, i) => (
          <g key={i}>
            <line className={styles.edge} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} vectorEffect="non-scaling-stroke" />
            <line
              className={styles.pulse}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              pathLength={100}
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${e.delay.toFixed(2)}s` }}
            />
          </g>
        ))}
      </svg>
      <ul className={styles.nodes}>
        {net.nodes.map((n) => (
          <li key={n.n} className={styles.node} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <span className={styles.dot} aria-hidden="true">
              {n.n}
            </span>
            <span className={styles.name}>
              <span className="sr-only">Number {n.n}: </span>
              {n.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
