import { it, expect, vi, afterEach } from "vitest";
import {
  catalog,
  normalize,
  change,
  subtotal,
  shipping,
  snapshot,
  SubmitGuard,
  validate,
  filterProducts,
  emptyFilters,
  parseURL,
  serialize,
} from "./domain";
import { readCart, readWishlist, read, write, language } from "./storage";
import { translations, money } from "./i18n";
afterEach(() => vi.unstubAllGlobals());
it("calculates integer cents and shipping boundaries", () => {
  const rows = [{ id: catalog[0].id, variant: "natural", quantity: 2 }];
  expect(subtotal(rows)).toBe(13800);
  expect(shipping("standard", 9999)).toBe(490);
  expect(shipping("standard", 10000)).toBe(0);
  expect(shipping("express", 10000)).toBe(900);
  expect(shipping("standard", 0)).toBe(0);
});
it("distinguishes variants, clamps stock and reconstructs trusted prices", () => {
  const id = catalog[0].id;
  const rows = normalize([
    { id, variant: "natural", quantity: 99, price: 1 },
    { id, variant: "forest", quantity: 2 },
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0].quantity).toBe(6);
  expect(subtotal(rows)).toBe(55200);
  expect(change(rows, id, "forest", 0)).toHaveLength(1);
});
it("rejects legacy, corrupt, removed, unavailable and invalid quantities", () => {
  for (const v of [null, {}, "bad", { cuffie: 2 }])
    expect(normalize(v)).toEqual([]);
  expect(
    normalize([
      { id: "unknown", variant: "natural", quantity: 2 },
      { id: "analog-clock", variant: "natural", quantity: 2 },
      { id: catalog[0].id, variant: "natural", quantity: 1.5 },
    ]),
  ).toEqual([]);
});
it("merges duplicate rows without exceeding capacity", () => {
  const a = { id: catalog[0].id, variant: "forest", quantity: 2 };
  expect(normalize([a, a])[0].quantity).toBe(3);
});
it("filters translated descriptions, category, price and availability", () => {
  expect(
    filterProducts({ ...emptyFilters, q: "lamp" }, "en").map((p) => p.id),
  ).toEqual(["arc-lamp"]);
  expect(filterProducts({ ...emptyFilters, q: "lampada" }, "it")).toHaveLength(
    1,
  );
  expect(
    filterProducts({ ...emptyFilters, max: "20", available: true }, "en").every(
      (p) => p.price <= 2000 && p.variants.some((v) => v.stock),
    ),
  ).toBe(true);
  expect(
    filterProducts({ ...emptyFilters, category: "desk" }, "en").every(
      (p) => p.category === "desk",
    ),
  ).toBe(true);
});
it("sorts and roundtrips filters and product slugs", () => {
  const f = {
    ...emptyFilters,
    q: "stone",
    sort: "price-down",
    available: true,
  };
  expect(parseURL(serialize("catalog", "", f)).filters).toEqual(f);
  expect(parseURL(serialize("product", "arc-lamp")).slug).toBe("arc-lamp");
  const a = filterProducts({ ...emptyFilters, sort: "price-up" }, "en");
  expect(a[0].price).toBe(Math.min(...catalog.map((p) => p.price)));
});
it("validates Italy-specific checkout and permits fictional sample", () => {
  expect(
    Object.keys(
      validate({
        name: "",
        email: "bad",
        street: "",
        city: "",
        postcode: "AB",
        country: "US",
      }),
    ),
  ).toHaveLength(6);
  expect(
    validate({
      name: "Alex Example",
      email: "alex@example.com",
      street: "Via Esempio 12",
      city: "Torino",
      postcode: "10100",
      country: "IT",
    }),
  ).toEqual({});
});
it("snapshots before clearing without customer data and prevents double submission", () => {
  const rows = [{ id: catalog[0].id, variant: "natural", quantity: 1 }];
  const guard = new SubmitGuard();
  let calls = 0;
  const order = guard.run(() => {
    calls++;
    return snapshot(rows, "express");
  });
  rows.length = 0;
  guard.run(() => calls++);
  expect(calls).toBe(1);
  expect(order?.total).toBe(7800);
  expect(order?.items).toHaveLength(1);
  expect(Object.keys(order!)).not.toContain("address");
});
it("supports unavailable storage with session fallback", () => {
  vi.stubGlobal("localStorage", {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  expect(write("check", 23)).toBe(false);
  expect(read("check", 0)).toBe(23);
});
it("handles corrupt persistence and defaults to English", () => {
  vi.stubGlobal("localStorage", { getItem: () => "{", setItem() {} });
  expect(readCart()).toEqual([]);
  expect(readWishlist()).toEqual([]);
  expect(language()).toBe("en");
});
it("has translated products and interface and retains EUR", () => {
  for (const p of catalog) {
    expect(p.name.en).toBeTruthy();
    expect(p.name.it).toBeTruthy();
    expect(p.price % 1).toBe(0);
    expect(p.variants.length).toBeGreaterThan(0);
  }
  expect(translations["Add to cart"]).toBe("Aggiungi al carrello");
  expect(money(1234, "en")).toContain("12.34");
  expect(money(1234, "it")).toContain("12,34");
});
