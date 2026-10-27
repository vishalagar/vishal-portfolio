/**
 * One place every interaction is reported from. Events made before the analytics client
 * loads (or when no key is set) wait in a small queue, so nothing early is lost and a
 * keyless deploy never grows memory.
 */
export type Props = Record<string, string | number | boolean | null>;

export interface AnalyticsClient {
  capture: (event: string, props: Props) => void;
  register: (props: Props) => void;
}

type Pending = { kind: "capture"; event: string; props: Props } | { kind: "register"; props: Props };

export interface Tracker {
  track: (event: string, props?: Props) => void;
  register: (props: Props) => void;
  attach: (client: AnalyticsClient) => void;
}

export function createTracker(limit = 200): Tracker {
  let client: AnalyticsClient | null = null;
  let queue: readonly Pending[] = [];

  const send = (c: AnalyticsClient, p: Pending) => {
    try {
      if (p.kind === "capture") c.capture(p.event, p.props);
      else c.register(p.props);
    } catch (err) {
      // a blocked or broken analytics script must never break the page
      console.warn("[analytics] send failed", err);
    }
  };
  const push = (p: Pending) => {
    if (client) send(client, p);
    else queue = [...queue, p].slice(-limit);
  };

  return {
    track: (event, props = {}) => push({ kind: "capture", event, props }),
    register: (props) => push({ kind: "register", props }),
    attach(c) {
      client = c;
      const pending = queue;
      queue = [];
      pending.forEach((p) => send(c, p));
    },
  };
}

/** The site-wide tracker. */
export const tracker = createTracker();
export const track = tracker.track;
