import { describe, expect, it } from "vitest";
import { LINEUP } from "@/content/career";
import { characters, gridSlots, initials, network, squadOrder, waves } from "./arrange";

describe("squadOrder", () => {
  it("has eleven players, Python first, with roles from the football lines", () => {
    const squad = squadOrder(LINEUP);
    expect(squad).toHaveLength(11);
    expect(squad[0]).toMatchObject({ name: "Python", n: 1, role: "Tank" });
    expect(squad.find((p) => p.name === "YOLOv8")?.role).toBe("Striker");
    expect(squad.find((p) => p.name === "PyTorch")?.role).toBe("Mage");
    expect(squad.find((p) => p.name === "MySQL")?.role).toBe("Support");
  });

  it("tolerates a short line-up", () => {
    expect(squadOrder([[{ n: 9, name: "A" }]])).toHaveLength(1);
  });
});

describe("gridSlots", () => {
  const slots = gridSlots(LINEUP);
  it("puts Python on pole and numbers P1..P11", () => {
    expect(slots).toHaveLength(11);
    expect(slots[0]).toMatchObject({ pos: "P1", car: "Car 1 · pole", name: "Python" });
    expect(slots[10].pos).toBe("P11");
    expect(slots[1].car).toBe("Car 9");
  });
  it("staggers the right-hand column only", () => {
    expect(slots.map((s) => s.staggered).slice(0, 4)).toEqual([false, true, false, true]);
  });
});

describe("characters", () => {
  const chars = characters(LINEUP);
  it("selects only Python and derives initials", () => {
    expect(chars.filter((c) => c.selected).map((c) => c.name)).toEqual(["Python"]);
    expect(initials("Next.js")).toBe("NE");
    expect(chars[0].initials).toBe("PY");
  });
});

describe("waves", () => {
  it("labels four waves with the shirt numbers as bibs", () => {
    const w = waves(LINEUP);
    expect(w.map((x) => x.label)).toEqual(["Elite wave", "Wave A", "Wave B", "Pacer"]);
    expect(w[3].bibs).toEqual([{ n: 1, name: "Python" }]);
    expect(w[0].bibs.map((b) => b.n)).toEqual([9, 10, 11]);
  });
});

describe("network", () => {
  const net = network(LINEUP);
  it("has 11 nodes in 1-4-3-3 layers", () => {
    expect(net.nodes).toHaveLength(11);
    const perLayer = net.captions.map((c) => net.nodes.filter((n) => n.x === c.x).length);
    expect(perLayer).toEqual([1, 4, 3, 3]);
    expect(net.captions.map((c) => c.name)).toEqual(["input", "hidden 1", "hidden 2", "output"]);
  });
  it("fully connects each layer to the next: 25 edges", () => {
    expect(net.edges).toHaveLength(1 * 4 + 4 * 3 + 3 * 3);
    expect(net.edges).toHaveLength(25);
  });
  it("spreads pulse delays into the past within one period", () => {
    expect(net.edges.every((e) => e.delay <= 0 && e.delay > -2.4)).toBe(true);
    expect(new Set(net.edges.map((e) => e.delay)).size).toBeGreaterThan(10);
  });
  it("centres a lone node vertically", () => {
    expect(net.nodes[0].y).toBe(50);
  });
});
