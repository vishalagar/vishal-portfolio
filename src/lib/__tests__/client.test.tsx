// @vitest-environment jsdom
import { act, render, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shotPower } from "@/lib/engines/football";
import { useActive, useInterval, usePageVisible } from "@/lib/hooks/useActive";
import { useReducedMotion, useSoundOn, useTheme, useVarMode } from "@/lib/hooks/useStores";
import { BOOT_SCRIPT, themeStore, varStore } from "@/lib/stores/htmlAttr";

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let ioCallback: IOCallback | null = null;

class FakeIO {
  constructor(cb: IOCallback) {
    ioCallback = cb;
  }
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIO);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-var");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("html attribute stores", () => {
  it("default to night theme and VAR off", () => {
    expect(themeStore.get()).toBe("night");
    expect(varStore.get()).toBe("off");
  });

  it("set the attribute, persist the theme and notify subscribers", () => {
    const fn = vi.fn();
    const unsub = themeStore.subscribe(fn);
    themeStore.set("day");
    expect(document.documentElement.getAttribute("data-theme")).toBe("day");
    expect(localStorage.getItem("va-theme")).toBe("day");
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    themeStore.set("night");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("ignore unknown attribute values", () => {
    document.documentElement.setAttribute("data-theme", "purple");
    expect(themeStore.get()).toBe("night");
  });

  it("boot script applies a saved theme and flags JavaScript", () => {
    localStorage.setItem("va-theme", "day");
    new Function(BOOT_SCRIPT)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("day");
    expect(document.documentElement.hasAttribute("data-js")).toBe(true);
  });

  it("React hooks read the stores", () => {
    const { result } = renderHook(() => ({ theme: useTheme(), varMode: useVarMode(), sound: useSoundOn(), calm: useReducedMotion() }));
    expect(result.current).toEqual({ theme: "night", varMode: "off", sound: false, calm: false });
    act(() => varStore.set("on"));
    expect(result.current.varMode).toBe("on");
  });
});

describe("activity hooks", () => {
  it("useInterval ticks until paused with null", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const { rerender } = renderHook(({ ms }) => useInterval(cb, ms), { initialProps: { ms: 100 as number | null } });
    act(() => vi.advanceTimersByTime(350));
    expect(cb).toHaveBeenCalledTimes(3);
    rerender({ ms: null });
    act(() => vi.advanceTimersByTime(500));
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("useActive is true only while on screen and the tab is visible", () => {
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      const active = useActive(ref);
      const visible = usePageVisible();
      return <div ref={ref} data-active={String(active)} data-visible={String(visible)} />;
    }
    const { container } = render(<Probe />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.dataset.active).toBe("false");
    act(() => ioCallback?.([{ isIntersecting: true }]));
    expect(el.dataset.visible).toBe("true");
    expect(el.dataset.active).toBe("true");
    act(() => ioCallback?.([{ isIntersecting: false }]));
    expect(el.dataset.active).toBe("false");
  });
});

describe("shot power", () => {
  it("defaults to half power and scales with charge up to full", () => {
    expect(shotPower(null)).toBe(0.5);
    expect(shotPower(0)).toBe(0.3);
    expect(shotPower(12)).toBeCloseTo(0.8);
    expect(shotPower(100)).toBe(1);
  });
});
