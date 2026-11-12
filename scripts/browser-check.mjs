import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, existsSync } from "node:fs";
const base =
  process.argv.find((a) => a.startsWith("--url="))?.slice(6) ||
  "http://localhost:3022/";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync("/usr/bin/google-chrome")
    ? { executablePath: "/usr/bin/google-chrome" }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "it-IT",
});
const page = await context.newPage();
const errors = [];
const remote = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(r.url() + ":" + r.status());
});
page.on("request", (r) => {
  if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
    remote.push(r.url());
});
mkdirSync("docs/screenshots", { recursive: true });
try {
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Considered objects. Everyday rituals." })
    .waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  await page.screenshot({ path: "docs/screenshots/home.png", fullPage: true });
  await page.getByRole("combobox", { name: "Language" }).selectOption("it");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("lang"), "it");
  await page.getByRole("combobox", { name: "Lingua" }).selectOption("en");
  await page.getByRole("link", { name: "Shop", exact: true }).click();
  await page.locator(".filters label").first().locator("input").fill("zzzz");
  await page.getByText("No products match your filters.").waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), 14);
  await page.locator(".filters select").first().selectOption("desk");
  assert.equal(await page.locator(".product-card").count(), 4);
  await page.reload();
  assert.equal(await page.locator(".product-card").count(), 4);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.locator(".filters select").last().selectOption("price-up");
  assert.match(
    await page.locator(".product-card").first().innerText(),
    /Weekly notebook/,
  );
  await page.goto(base + "?page=product&slug=arc-lamp");
  await page
    .getByRole("heading", { name: "Arc desk lamp", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Save object", exact: true }).click();
  await page.locator(".product-info select").selectOption("forest");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.locator(".product-info select").selectOption("natural");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/product.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Wishlist (1)", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.getByRole("link", { name: "Cart (2)", exact: true }).click();
  assert.equal(await page.locator(".cart-item").count(), 2);
  await page.locator(".quantity input").first().fill("2");
  await page.reload();
  assert.equal(await page.locator(".cart-item").count(), 2);
  assert.equal(await page.locator(".quantity input").first().inputValue(), "2");
  await page
    .getByRole("button", { name: "Proceed to demo checkout", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(await page.locator(".fields .error").count(), 5);
  await page
    .getByRole("button", { name: "Fill with sample data", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Language" }).selectOption("it");
  assert.equal(await page.locator("#email").inputValue(), "alex@example.com");
  await page.getByRole("combobox", { name: "Lingua" }).selectOption("en");
  await page.screenshot({
    path: "docs/screenshots/checkout.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio").last().check();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  assert.equal(await page.locator("#email").inputValue(), "alex@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  assert.ok(await page.getByRole("radio").last().isChecked());
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm demo order", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your demo order is ready." })
    .waitFor();
  assert.match(await page.locator(".confirmation").innerText(), /DEMO-/);
  assert.match(await page.locator(".confirmation").innerText(), /216.00/);
  assert.equal(
    await page.getByRole("link", { name: "Cart (0)", exact: true }).count(),
    1,
  );
  assert.ok(
    await page.evaluate(
      () => !JSON.stringify(localStorage).includes("alex@example.com"),
    ),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "No order snapshot available after reload." })
    .waitFor();
  await page.goto(base + "?page=product&slug=unknown");
  await page.getByRole("heading", { name: "Product not found" }).waitFor();
  await page.goto(base + "?page=cart");
  await page.getByRole("heading", { name: "Your cart is empty" }).waitFor();
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page.goto(base+'?page=product&slug=arc-lamp');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();
  await page.getByRole('link',{name:'Cart (1)',exact:true}).click();
  await page.getByRole('button',{name:'Proceed to demo checkout',exact:true}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:768,height:1024});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => document.activeElement !== document.body),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(remote, []);
  console.log(
    "PASS English/Italian, filters, direct product, variants, wishlist, cart, checkout, privacy, confirmation, empty/404, mobile and keyboard; no errors or external requests",
  );
} finally {
  await browser.close();
}
