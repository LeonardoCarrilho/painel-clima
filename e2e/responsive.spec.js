import { test, expect } from "@playwright/test";


test.beforeEach(async ({ page }) => {
  const date = "2026-10-28";
  const hours = Array.from({ length: 24 }, (_, i) => date + "T" + String(i).padStart(2, "0") + ":00");
  const days = ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"];
  await page.route("https://api.open-meteo.com/**", route => route.fulfill({ json: {
    timezone: "America/Sao_Paulo",
    current: { time: date + "T00:00", temperature_2m: 24, apparent_temperature: 25, relative_humidity_2m: 65, precipitation: 0, weather_code: 2, wind_speed_10m: 12, wind_direction_10m: 90, is_day: 1 },
    hourly: { time: hours, temperature_2m: hours.map((_, i) => 20 + Math.sin(i / 5) * 5), precipitation_probability: hours.map(() => 20), weather_code: hours.map(() => 2) },
    daily: { time: days, temperature_2m_max: days.map(() => 28), temperature_2m_min: days.map(() => 18), weather_code: days.map(() => 2), precipitation_probability_max: days.map(() => 30) }
  } }));
});

test("tabela estreita permite consultar todas as colunas pelo teclado", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("./");
  const region = page.getByRole("region", { name: "Previsão detalhada dos próximos sete dias" });
  await expect(region.getByRole("row")).toHaveCount(8);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

for (const width of [320, 390, 768, 1440]) {
  test("layout utilizável em " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.goto("./");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator(".forecast-table tbody tr")).toHaveCount(7);
    await page.evaluate(() => document.fonts.ready);
    const measurements = await page.evaluate(() => {
      const fields = [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
      return {
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        fields: fields.map(el => {
          const rect = el.getBoundingClientRect();
          return { name: el.id || el.name, left: rect.left, right: rect.right, font: parseFloat(getComputedStyle(el).fontSize) };
        })
      };
    });
    expect(measurements.scroll, "a página não deve exigir rolagem horizontal").toBeLessThanOrEqual(measurements.width + 1);
    for (const field of measurements.fields) {
      expect(field.left, field.name).toBeGreaterThanOrEqual(-1);
      expect(field.right, field.name).toBeLessThanOrEqual(width + 1);
      if (width <= 600) expect(field.font, field.name + " deve evitar zoom automático").toBeGreaterThanOrEqual(16);
    }
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    expect(await focused.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  });
}
