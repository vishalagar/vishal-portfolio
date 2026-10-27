// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sound", () => ({
  isSoundOn: () => false,
  subscribeSound: () => () => {},
  setSoundWorld: vi.fn(),
  sfx: { signature: vi.fn(), blip: vi.fn() },
}));

import { EasterEggs } from "@/components/EasterEggs";
import { TeamTalk } from "@/components/sections/Story";
import { PixelBall } from "@/components/sprite/PixelBall";
import { WORLD_IDS, WORLDS, type WorldId } from "@/content/worlds";
import { varStore, worldStore } from "@/lib/stores/htmlAttr";
import { enterWorld } from "@/lib/worlds/switch";

beforeEach(() => {
  // reduced motion: enterWorld swaps instantly, no wipe timers
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  localStorage.clear();
  document.documentElement.setAttribute("data-world", "football");
  document.documentElement.setAttribute("data-var", "off");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const typeVar = () => ["v", "a", "r"].forEach((key) => fireEvent.keyDown(window, { key }));

describe("world props", () => {
  it("every world has its own prop shape, football keeps the ball", () => {
    const shapes = WORLD_IDS.map((id) => WORLDS[id].hero.prop.shape);
    expect(new Set(shapes).size).toBe(WORLD_IDS.length);
    expect(WORLDS.football.hero.prop.shape).toBe("ball");
  });

  it("draws a different sprite per shape", () => {
    const drawn = WORLD_IDS.map((id) => {
      const { container, unmount } = render(<PixelBall colors={WORLDS[id].hero.prop} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("data-shape")).toBe(WORLDS[id].hero.prop.shape);
      const html = svg?.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(drawn).size).toBe(WORLD_IDS.length);
  });

  it.each(WORLD_IDS)("the team talk quote shows the %s world's prop", (id: WorldId) => {
    document.documentElement.setAttribute("data-world", id);
    const { container } = render(<TeamTalk />);
    expect(container.querySelector("svg")?.getAttribute("data-shape")).toBe(WORLDS[id].hero.prop.shape);
  });
});

describe("VAR easter egg", () => {
  it("switches on in the football world", () => {
    render(<EasterEggs />);
    act(typeVar);
    expect(varStore.get()).toBe("on");
  });

  it("does nothing in the other worlds, where VAR means nothing", () => {
    document.documentElement.setAttribute("data-world", "gp");
    render(<EasterEggs />);
    act(typeVar);
    expect(varStore.get()).toBe("off");
  });

  it("switches off when the visitor changes world", () => {
    varStore.set("on");
    act(() => enterWorld("gaming"));
    expect(worldStore.get()).toBe("gaming");
    expect(varStore.get()).toBe("off");
  });
});
