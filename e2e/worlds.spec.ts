import { expect, test, type Page } from "@playwright/test";

const WORLDS = [
  {
    id: "football",
    name: "Football",
    lineup: "Starting XI",
    top: "Goal of the season",
    theme: "Day match",
  },
  {
    id: "gp",
    name: "Grand Prix",
    lineup: "Starting grid",
    top: "Race win of the season",
    theme: "Day race",
  },
  {
    id: "gaming",
    name: "Gaming",
    lineup: "Character select",
    top: "Main quest",
    theme: "Lights on",
  },
  {
    id: "run",
    name: "Running",
    lineup: "Start corrals",
    top: "Season PB",
    theme: "Morning run",
  },
  {
    id: "ai",
    name: "AI",
    lineup: "Architecture",
    top: "Flagship model",
    theme: "Light mode",
  },
] as const;

const startScreen = (page: Page) =>
  page.getByRole("dialog", { name: "Choose your world" });

test.describe("start screen", () => {
  test("first visit: pick a world with a number key, and it is remembered", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(startScreen(page)).toBeVisible();
    await page.keyboard.press("2");
    await expect(page.locator("html")).toHaveAttribute("data-world", "gp");
    await expect(startScreen(page)).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Starting grid" }),
    ).toBeAttached();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-world", "gp");
    await expect(startScreen(page)).toBeHidden();
  });

  test("click a tile", async ({ page }) => {
    await page.goto("/");
    await startScreen(page)
      .getByRole("button", { name: /^Running:/ })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-world", "run");
  });

  test("nobody picks: a random world after 8 seconds", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(startScreen(page)).toBeVisible();
    await page.mouse.move(2, 2);
    await page.clock.runFor(9_000);
    await expect(startScreen(page)).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute(
      "data-world",
      /football|gp|gaming|run|ai/,
    );
  });

  test("Esc is a surprise pick", async ({ page }) => {
    await page.goto("/");
    await expect(startScreen(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(startScreen(page)).toBeHidden();
  });
});

test.describe("every world", () => {
  for (const w of WORLDS) {
    test(`${w.name}: own line-up, PrintSafe first, theme toggle`, async ({
      page,
    }) => {
      await page.goto(`/?world=${w.id}`);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-world", w.id);
      await expect(startScreen(page)).toBeHidden();
      await expect(
        page.getByRole("heading", { name: w.lineup }),
      ).toBeAttached();

      // PrintSafe is the first card in Highlights, labelled for the world
      const first = page.locator("#highlights article").first();
      await expect(first).toContainText("PrintSafe.in");
      await expect(first).toContainText(w.top);

      await page
        .getByRole("button", {
          name: new RegExp(
            `switch to ${w.theme.toLowerCase()} \\(light theme\\)`,
          ),
        })
        .click();
      await expect(html).toHaveAttribute("data-theme", "day");
      const bg = await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      );
      expect(bg).not.toBe("rgb(8, 19, 14)");
    });
  }

  test("switching worlds from the header", async ({ page }) => {
    await page.goto("/?world=football");
    await page
      .getByRole("group", { name: "World" })
      .getByRole("button", { name: "AI" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-world", "ai");
    await expect(
      page.getByRole("heading", { name: "Ask the Agent" }),
    ).toBeAttached();
  });
});

test("the costume comes off on scroll and goes back on", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?world=gp");
  const hero = page
    .locator("#hero-title")
    .locator("xpath=ancestor::section")
    .locator("[data-unmask]")
    .first();
  await expect(hero).toHaveAttribute("data-unmask", "0");
  // scroll down in small steps (works on touch viewports too): frames pass through the strip to 7
  const seen = new Set<string>();
  for (let y = 0; y <= 2000; y += 40) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(30);
    seen.add((await hero.getAttribute("data-unmask")) ?? "");
  }
  expect(seen.has("7")).toBe(true);
  expect([...seen].some((f) => Number(f) > 0 && Number(f) < 7)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(hero).toHaveAttribute("data-unmask", "0");
});
