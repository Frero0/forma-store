import raw from "./catalog.json";
export type Language = "en" | "it";
export type Text = Record<Language, string>;
export interface Product {
  id: string;
  slug: string;
  name: Text;
  description: Text;
  category: string;
  price: number;
  currency: string;
  image: string;
  material: Text;
  dimensions: string;
  features: Text;
  variants: { id: string; name: Text; stock: number }[];
}
export const catalog: Product[] = raw;
export interface Line {
  id: string;
  variant: string;
  quantity: number;
}
export const key = (l: Line) => l.id + ":" + l.variant;
export function normalize(value: unknown): Line[] {
  if (!Array.isArray(value)) return [];
  const rows = new Map<string, Line>();
  for (const x of value) {
    if (!x || typeof x !== "object") continue;
    const p = catalog.find((p) => p.id === x.id),
      v = p?.variants.find((v) => v.id === x.variant);
    if (
      !p ||
      !v ||
      !Number.isSafeInteger(x.quantity) ||
      x.quantity <= 0 ||
      v.stock === 0
    )
      continue;
    const k = key(x);
    rows.set(k, {
      id: p.id,
      variant: v.id,
      quantity: Math.min(v.stock, (rows.get(k)?.quantity || 0) + x.quantity),
    });
  }
  return [...rows.values()];
}
export function change(
  lines: Line[],
  id: string,
  variant: string,
  quantity: number,
) {
  if (!Number.isSafeInteger(quantity)) return normalize(lines);
  const exists = lines.some((l) => key(l) === id + ":" + variant);
  return normalize(
    exists
      ? lines.map((l) =>
          key(l) === id + ":" + variant ? { id, variant, quantity } : l,
        )
      : [...lines, { id, variant, quantity }],
  );
}
export const subtotal = (lines: Line[]) =>
  normalize(lines).reduce(
    (sum, l) => sum + catalog.find((p) => p.id === l.id)!.price * l.quantity,
    0,
  );
export const shipping = (method: string, amount: number) =>
  amount === 0 ? 0 : method === "express" ? 900 : amount >= 10000 ? 0 : 490;
export interface Address {
  name: string;
  email: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
}
export function validate(a: Address) {
  const errors: Partial<Record<keyof Address, string>> = {};
  if (a.name.trim().length < 2) errors.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email) || a.email.length > 150)
    errors.email = "Enter a valid email";
  if (a.street.trim().length < 4) errors.street = "Enter a street address";
  if (a.city.trim().length < 2) errors.city = "Enter a city";
  if (!/^\d{5}$/.test(a.postcode))
    errors.postcode = "Enter a five-digit Italian postcode";
  if (a.country !== "IT")
    errors.country = "Demo delivery is available only in Italy";
  return errors;
}
export interface Order {
  id: string;
  items: { name: Text; variant: Text; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  method: string;
}
export function snapshot(lines: Line[], method: string): Order {
  const clean = normalize(lines);
  if (!clean.length) throw Error("Empty cart");
  const amount = subtotal(clean),
    delivery = shipping(method, amount);
  return {
    id: "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    items: clean.map((l) => {
      const p = catalog.find((p) => p.id === l.id)!;
      return {
        name: { ...p.name },
        variant: { ...p.variants.find((v) => v.id === l.variant)!.name },
        quantity: l.quantity,
        price: p.price,
      };
    }),
    subtotal: amount,
    shipping: delivery,
    total: amount + delivery,
    method,
  };
}
export class SubmitGuard {
  private submitted = false;
  run<T>(fn: () => T) {
    if (this.submitted) return undefined;
    this.submitted = true;
    try {
      return fn();
    } catch (e) {
      this.submitted = false;
      throw e;
    }
  }
}
export interface Filters {
  q: string;
  category: string;
  max: string;
  available: boolean;
  sort: string;
}
export const emptyFilters: Filters = {
  q: "",
  category: "all",
  max: "",
  available: false,
  sort: "featured",
};
export function filterProducts(f: Filters, lang: Language) {
  const q = f.q.toLocaleLowerCase(lang).trim();
  const list = catalog.filter(
    (p) =>
      (!q ||
        (p.name[lang] + " " + p.description[lang])
          .toLocaleLowerCase(lang)
          .includes(q)) &&
      (f.category === "all" || p.category === f.category) &&
      (!f.max || p.price <= Number(f.max) * 100) &&
      (!f.available || p.variants.some((v) => v.stock > 0)),
  );
  return list.sort((a, b) =>
    f.sort === "price-up"
      ? a.price - b.price
      : f.sort === "price-down"
        ? b.price - a.price
        : f.sort === "name"
          ? a.name[lang].localeCompare(b.name[lang], lang)
          : catalog.indexOf(a) - catalog.indexOf(b),
  );
}
export function parseURL(search: string) {
  const q = new URLSearchParams(search);
  return {
    page: [
      "catalog",
      "product",
      "cart",
      "wishlist",
      "checkout",
      "confirmation",
    ].includes(q.get("page") || "")
      ? q.get("page")!
      : "home",
    slug: q.get("slug") || "",
    filters: {
      q: (q.get("q") || "").slice(0, 150),
      category: ["home", "desk", "technology", "accessories"].includes(
        q.get("category") || "",
      )
        ? q.get("category")!
        : "all",
      max: /^\d{1,4}$/.test(q.get("max") || "") ? q.get("max")! : "",
      available: q.get("available") === "1",
      sort: ["price-up", "price-down", "name"].includes(q.get("sort") || "")
        ? q.get("sort")!
        : "featured",
    },
  };
}
export function serialize(page: string, slug = "", f = emptyFilters) {
  return (
    "?" +
    new URLSearchParams({
      page,
      ...(slug ? { slug } : {}),
      ...(page === "catalog"
        ? {
            q: f.q,
            category: f.category,
            max: f.max,
            available: f.available ? "1" : "0",
            sort: f.sort,
          }
        : {}),
    }).toString()
  );
}
