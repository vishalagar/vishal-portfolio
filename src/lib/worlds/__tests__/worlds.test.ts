import { describe, expect, it } from "vitest";
import { TIMELINE } from "@/content/career";
import { WORLD_IDS, WORLDS, isWorldId, parseMinute, worldMinute } from "@/content/worlds";
import { BOOT_SCRIPT } from "@/lib/stores/htmlAttr";
import { buildWorldCss, FONT_VARS, paletteVars } from "@/lib/worlds/css";

/** WCAG relative luminance of #rrggbb. */
function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("worlds content", () => {
  it("defines all five worlds with matching ids", () => {
    expect(WORLD_IDS).toEqual(["football", "gp", "gaming", "run", "ai"]);
    for (const id of WORLD_IDS) expect(WORLDS[id].id).toBe(id);
  });

  it("every world × theme passes WCAG AA for text (spec §3)", () => {
    for (const id of WORLD_IDS) {
      for (const mode of ["night", "day"] as const) {
        const p = WORLDS[id].modes[mode];
        const where = `${id}/${mode}`;
        expect(contrast(p.ink, p.bg), `${where} ink`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.muted, p.bg), `${where} muted`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.accentText, p.bg), `${where} accent text`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.onAccent, p.accent), `${where} on accent`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.ink, p.surface), `${where} ink on surface`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("only football has no costume", () => {
    for (const id of WORLD_IDS) expect(WORLDS[id].gear === null).toBe(id === "football");
  });

  it("uses no brand marks", () => {
    const text = JSON.stringify(WORLDS);
    expect(text).not.toMatch(/\bF1\b|Formula 1|PlayStation|Game ?Boy|Nintendo/i);
  });

  it("isWorldId guards unknown values", () => {
    expect(isWorldId("gp")).toBe(true);
    expect(isWorldId("hockey")).toBe(false);
    expect(isWorldId(undefined)).toBe(false);
  });
});

describe("worldMinute", () => {
  it("parses stoppage and extra time", () => {
    expect(parseMinute("0'")).toBe(0);
    expect(parseMinute("90+4'")).toBe(94);
    expect(parseMinute("ET 102'")).toBe(102);
  });

  it("keeps football minutes as written", () => {
    expect(worldMinute("football", "90+4'")).toBe("90+4'");
  });

  it("maps to laps, levels, km and epochs", () => {
    expect(worldMinute("gp", "0'")).toBe("L1");
    expect(worldMinute("gp", "45'")).toBe("L30");
    expect(worldMinute("gaming", "55'")).toBe("Lv 10");
    expect(worldMinute("run", "45'")).toBe("km 10.6");
    expect(worldMinute("ai", "83'")).toBe("ep 83");
  });

  it("clamps at the finish: never past lap 58 or 21.1 km", () => {
    for (const e of TIMELINE) {
      expect(Number(worldMinute("gp", e.min).slice(1))).toBeLessThanOrEqual(58);
      expect(Number(worldMinute("run", e.min).slice(3))).toBeLessThanOrEqual(21.1);
    }
    expect(worldMinute("run", "ET 102'")).toBe("km 21.1");
    expect(worldMinute("gp", "ET 102'")).toBe("L58");
  });
});

describe("world CSS", () => {
  const css = buildWorldCss();

  it("has a block per world and per world × theme", () => {
    for (const id of WORLD_IDS) {
      expect(css).toContain(`:root[data-world="${id}"]{`);
      for (const mode of ["night", "day"]) expect(css).toContain(`:root[data-world="${id}"][data-theme="${mode}"]`);
    }
  });

  it("writes the palette values and fonts from worlds.ts", () => {
    expect(css).toContain(`--bg:${WORLDS.gp.modes.night.bg}`);
    expect(css).toContain(`--accent-text:${WORLDS.ai.modes.day.accentText}`);
    expect(css).toContain("var(--font-orbitron)");
    expect(css).toContain("--display-scale:0.6");
    for (const id of WORLD_IDS) {
      expect(FONT_VARS[WORLDS[id].fonts.display]).toBeDefined();
      expect(FONT_VARS[WORLDS[id].fonts.label]).toBeDefined();
    }
  });

  it("never emits an empty or undefined value", () => {
    expect(css).not.toMatch(/:(undefined|;|})/);
    for (const v of Object.values(paletteVars(WORLDS.run.modes.day))) expect(v).toBeTruthy();
  });

  it("is safe to inline in a <style> tag", () => {
    expect(css).not.toContain("</");
  });
});

describe("BOOT_SCRIPT", () => {
  type Attrs = Record<string, string>;
  function boot(saved: Record<string, string>, search = ""): Attrs {
    const attrs: Attrs = {};
    const doc = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
    const storage = { getItem: (k: string) => saved[k] ?? null };
    new Function("document", "localStorage", "location", BOOT_SCRIPT)(doc, storage, { search });
    return attrs;
  }

  it("shows the start screen on a first visit", () => {
    expect(boot({})).toMatchObject({ "data-js": "", "data-intro": "on" });
  });

  it("returning visitors go straight to their saved world and theme", () => {
    expect(boot({ "va-world": "ai", "va-theme": "day" })).toMatchObject({
      "data-world": "ai",
      "data-theme": "day",
      "data-intro": "off",
    });
  });

  it("?world= wins and skips the start screen; junk is ignored", () => {
    expect(boot({ "va-world": "ai" }, "?world=gp")).toMatchObject({ "data-world": "gp", "data-intro": "off" });
    expect(boot({}, "?world=<script>")).toMatchObject({ "data-intro": "on" });
    expect(boot({}, "?world=<script>")["data-world"]).toBeUndefined();
  });
});
