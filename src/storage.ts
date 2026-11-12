import { normalize, type Line, catalog, type Language } from "./domain";
const memory = new Map<string, unknown>();
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem("forma:" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return (memory.get(key) as T) ?? fallback;
  }
}
export function write(key: string, value: unknown) {
  memory.set(key, value);
  try {
    localStorage.setItem("forma:" + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readCart(): Line[] {
  return normalize(read("cart", []));
} // Legacy product IDs have no reliable variant mapping and are intentionally discarded.
export function readWishlist() {
  const a = read<unknown>("wishlist", []);
  return Array.isArray(a)
    ? [
        ...new Set(
          a.filter(
            (id): id is string =>
              typeof id === "string" && catalog.some((p) => p.id === id),
          ),
        ),
      ]
    : [];
}
export const language = (): Language =>
  read<string>("language", "en") === "it" ? "it" : "en";
