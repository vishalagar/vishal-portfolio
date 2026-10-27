// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { constant } from "@/lib/engines/rng";

const { enterWorld } = vi.hoisted(() => ({ enterWorld: vi.fn() }));
vi.mock("@/lib/worlds/switch", async (orig) => ({
  ...(await orig<typeof import("@/lib/worlds/switch")>()),
  enterWorld,
}));
vi.mock("@/lib/sound", () => ({
  isSoundOn: () => false,
  subscribeSound: () => () => {},
  setSoundOn: vi.fn(),
  setSoundWorld: vi.fn(),
  sfx: { signature: vi.fn(), blip: vi.fn() },
}));

import { introStore } from "@/lib/stores/htmlAttr";
import { StartScreen } from "../StartScreen";

beforeEach(() => {
  vi.useFakeTimers();
  enterWorld.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  introStore.set("on");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const dialog = () => screen.getByRole("dialog", { hidden: true });

describe("StartScreen", () => {
  it("renders a labelled modal dialog with five tiles and takes focus", () => {
    render(<StartScreen />);
    expect(dialog().getAttribute("aria-modal")).toBe("true");
    expect(
      screen.getByRole("heading", { name: "Choose your world", hidden: true }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /Press \d\./, hidden: true }),
    ).toHaveLength(5);
    expect(document.activeElement).toBe(dialog());
  });

  it("keys 1-5 pick that world and close the screen", () => {
    render(<StartScreen />);
    fireEvent.keyDown(dialog(), { key: "3" });
    expect(enterWorld).toHaveBeenCalledWith("gaming", "Welcome to");
    expect(introStore.get()).toBe("off");
  });

  it("clicking a tile picks it", () => {
    render(<StartScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: /^Running/, hidden: true }),
    );
    expect(enterWorld).toHaveBeenCalledWith("run", "Welcome to");
  });

  it("Esc and Surprise me pick a random world", () => {
    render(<StartScreen rng={constant(0.99)} />);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(enterWorld).toHaveBeenCalledWith("ai", "Random pick");
    introStore.set("on");
    fireEvent.click(
      screen.getByRole("button", { name: "Surprise me", hidden: true }),
    );
    expect(enterWorld).toHaveBeenCalledTimes(2);
  });

  it("picks at random after 8 seconds", () => {
    render(<StartScreen rng={constant(0)} />);
    act(() => void vi.advanceTimersByTime(7900));
    expect(enterWorld).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(enterWorld).toHaveBeenCalledWith("football", "Random pick");
  });

  it("pauses while the pointer is over the tiles and resumes after", () => {
    render(<StartScreen rng={constant(0)} />);
    const tiles = screen.getByRole("group", { name: "Worlds", hidden: true });
    fireEvent.pointerEnter(tiles);
    act(() => void vi.advanceTimersByTime(20000));
    expect(enterWorld).not.toHaveBeenCalled();
    expect(screen.getByText("Take your time")).toBeTruthy();
    fireEvent.pointerLeave(tiles);
    act(() => void vi.advanceTimersByTime(8100));
    expect(enterWorld).toHaveBeenCalledTimes(1);
  });

  it("pauses while a tile has focus", () => {
    render(<StartScreen rng={constant(0)} />);
    const tile = screen.getByRole("button", {
      name: /^Grand Prix/,
      hidden: true,
    });
    fireEvent.focus(tile);
    act(() => void vi.advanceTimersByTime(20000));
    expect(enterWorld).not.toHaveBeenCalled();
  });

  it("makes the rest of the page inert while open", () => {
    document.body.innerHTML = '<main id="m"></main><div id="root"></div>';
    const { unmount } = render(<StartScreen />, {
      container: document.getElementById("root")!,
    });
    expect((document.getElementById("m") as HTMLElement).inert).toBe(true);
    unmount();
    expect((document.getElementById("m") as HTMLElement).inert).toBe(false);
  });

  it("picking a world remembers the start screen was seen for this tab", () => {
    render(<StartScreen />);
    fireEvent.keyDown(dialog(), { key: "1" });
    expect(sessionStorage.getItem("va-seen")).toBe("1");
  });
});

describe("StartScreen for a returning visitor", () => {
  beforeEach(() => localStorage.setItem("va-world", "gp"));

  it("marks the world they picked last time", () => {
    render(<StartScreen />);
    const tile = screen.getByRole("button", { name: /^Grand Prix/, hidden: true });
    expect(tile.textContent).toContain("Last time");
    expect(tile.getAttribute("aria-label")).toContain("Your last world.");
    expect(screen.getAllByText("Last time")).toHaveLength(1);
  });

  it("counts down back to that world instead of a random one", () => {
    render(<StartScreen rng={constant(0.99)} />);
    expect(screen.getByText("Back to Grand Prix in 8s")).toBeTruthy();
    act(() => void vi.advanceTimersByTime(8100));
    expect(enterWorld).toHaveBeenCalledWith("gp", "Welcome back to");
  });

  it("Esc goes back to it too; Surprise me is still random", () => {
    render(<StartScreen rng={constant(0.99)} />);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(enterWorld).toHaveBeenLastCalledWith("gp", "Welcome back to");
    introStore.set("on");
    fireEvent.click(screen.getByRole("button", { name: "Surprise me", hidden: true }));
    expect(enterWorld).toHaveBeenLastCalledWith("ai", "Random pick");
  });
});
