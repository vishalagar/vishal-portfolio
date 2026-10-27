import { expect, test } from "@playwright/test";

/** Skips the start screen (BOOT_SCRIPT honours ?world=). */
const FOOTBALL = "/?world=football";

test.describe("broadcast controls", () => {
  test("theme toggle switches to day and remembers it", async ({ page }) => {
    await page.goto(FOOTBALL);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "night");
    await page
      .getByRole("button", { name: "Switch to day match (light theme)" })
      .click();
    await expect(html).toHaveAttribute("data-theme", "day");
    await expect(
      page.getByRole("button", {
        name: /switch to floodlights on \(dark theme\)/,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "day");
  });

  test("sound toggle is off by default and turns on", async ({ page }) => {
    await page.goto(FOOTBALL);
    const toggle = page.getByRole("button", { name: /stadium sound/ });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toContainText("Sound on");
  });

  test("typing VAR anywhere turns on detection boxes", async ({ page }) => {
    await page.goto(FOOTBALL);
    await page.locator("body").click({ position: { x: 5, y: 400 } });
    await page.keyboard.type("var");
    await expect(page.locator("html")).toHaveAttribute("data-var", "on");
    await expect(page.getByRole("status")).toContainText("VAR mode on");
  });
});

test.describe("highlights", () => {
  // ?world=football skips the "Choose your world" start screen

  test("football match plays full screen from kick-off to full time", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto(FOOTBALL);
    const play = page.getByRole("button", { name: /^Kick off · play/ });
    await play.scrollIntoViewIfNeeded();
    await play.click();
    const dialog = page.getByRole("dialog", { name: "Sports Detection" });
    await expect(dialog).toBeVisible();
    // the card's own copy steps aside while the match is on the big screen
    await expect(page.getByText("Playing full screen")).toBeAttached();
    const fullTime = dialog.getByRole("status", { name: "Full time" });
    for (let i = 0; i < 30; i++) {
      await page.clock.runFor(5_000);
      if (await fullTime.isVisible()) break;
    }
    await expect(fullTime).toBeVisible();
    await expect(fullTime).toContainText(/VA \d+ – \d+ CPU/);
  });

  test("keyboard: Play opens the theatre, Enter on Exit leaves instead of restarting, Esc exits", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "keyboard flow");
    await page.goto(FOOTBALL);
    const play = page.getByRole("button", { name: /^Kick off · play/ });
    await play.scrollIntoViewIfNeeded();
    await play.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Sports Detection" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
    await expect(dialog.getByText("Esc", { exact: true })).toBeVisible();
    // the page behind is inert while playing
    const pageInert = await page.evaluate(() =>
      Array.from(document.body.children)
        .filter(
          (el) =>
            el.getAttribute("role") !== "dialog" && el.tagName !== "SCRIPT",
        )
        .every((el) => el.hasAttribute("inert")),
    );
    expect(pageInert).toBe(true);
    await page.keyboard.press("Tab");
    const exit = dialog.getByRole("button", { name: "Exit · Esc" });
    await expect(exit).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(play).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(play).toBeFocused();
  });

  test("phone: Play opens the handheld with a controller; Select exits", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "phone layout");
    await page.goto(FOOTBALL);
    const play = page.getByRole("button", { name: /^Kick off · play/ });
    await play.scrollIntoViewIfNeeded();
    await play.click();
    const dialog = page.getByRole("dialog", { name: "Sports Detection" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("VA-4 · Football")).toBeVisible();
    for (const name of [
      "Up",
      "Down",
      "Left",
      "Right",
      "A: Shoot",
      "B: Pass",
      "R: Sprint",
    ]) {
      await expect(dialog.getByRole("button", { name })).toBeVisible();
    }
    // holding A then letting go is a shot or a tackle; the game must keep running either way
    const a = dialog.getByRole("button", { name: "A: Shoot" });
    await a.dispatchEvent("pointerdown", {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
    });
    await a.dispatchEvent("pointerup", {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await dialog.getByRole("button", { name: "Exit" }).click();
    await expect(dialog).toBeHidden();
    await expect(play).toBeInViewport();
  });

  test("snake hands control to the visitor full screen", async ({
    page,
    isMobile,
  }) => {
    await page.goto(FOOTBALL);
    const take = page.getByRole("button", {
      name: /^Take control of the snake/,
    });
    await take.scrollIntoViewIfNeeded();
    await take.click();
    const dialog = page.getByRole("dialog", { name: "Snake DQN" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/^You · \d+$/)).toBeVisible();
    if (isMobile) {
      await dialog.getByRole("button", { name: "Exit" }).click();
    } else {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Escape");
    }
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/^Bot playing · \d+$/)).toBeVisible();
  });

  test("PrintSafe demo runs the whole flow", async ({ page }) => {
    await page.clock.install();
    await page.goto(FOOTBALL);
    const run = page.getByRole("button", { name: "Encrypt & create link" });
    await run.scrollIntoViewIfNeeded();
    await run.click();
    await page.clock.runFor(2_000);
    await expect(page.getByText("One-time link ready")).toBeVisible();
    await page.clock.runFor(5_000);
    await expect(page.getByText("Gone. Zero trace.")).toBeVisible();
  });
});

test.describe("off the pitch", () => {
  test("a kit room shirt turns round when tapped", async ({ page }) => {
    await page.goto(FOOTBALL);
    const shirt = page
      .getByRole("button", { name: /^MIT Hockey shirt, showing the back/ })
      .first();
    // shirts sway forever, so they never count as "stable": scroll and click without waiting for that
    await shirt.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await shirt.click({ force: true });
    await expect(
      page
        .getByRole("button", { name: /^MIT Hockey shirt, showing the front/ })
        .first(),
    ).toBeVisible();
  });
});

test.describe("the Pundit", () => {
  test("question chips answer from the notes", async ({ page }) => {
    await page.goto(FOOTBALL);
    const chip = page.getByRole("button", { name: "Toughest bug?" });
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/Transit Gateway/).first()).toBeVisible();
  });

  test("a typed question streams the answer from the API", async ({ page }) => {
    await page.route("**/api/pundit", async (route) => {
      const body = route.request().postDataJSON() as { question: string };
      expect(body.question).toBe("What is Sports Detection?");
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Tracks players in the browser. Lovely stuff.",
      });
    });
    await page.goto(FOOTBALL);
    const input = page.getByLabel("Your question");
    await input.scrollIntoViewIfNeeded();
    await input.fill("What is Sports Detection?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(
      page.getByText("Tracks players in the browser. Lovely stuff.").first(),
    ).toBeVisible();
  });

  test("rate limiting shows a friendly message", async ({ page }) => {
    await page.route("**/api/pundit", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "rate_limited" }),
      }),
    );
    await page.goto(FOOTBALL);
    const input = page.getByLabel("Your question");
    await input.scrollIntoViewIfNeeded();
    await input.fill("Tell me about PrintSafe");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(
      page.getByText(/your three questions for today/).first(),
    ).toBeVisible();
  });
});

test("no horizontal scrolling on any viewport", async ({ page }) => {
  await page.goto(FOOTBALL);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
