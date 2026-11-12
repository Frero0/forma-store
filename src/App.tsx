import { useEffect, useState } from "react";
import {
  ArrowRight,
  Search,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ArrowUpRight,
} from "lucide-react";
import {
  catalog,
  normalize,
  change,
  subtotal,
  filterProducts,
  parseURL,
  serialize,
  emptyFilters,
  key,
  type Language,
  type Line,
  type Order,
  type Product,
} from "./domain";
import { readCart, readWishlist, language, write } from "./storage";
import { translator, money, type Key } from "./i18n";
import { ProductCard, image } from "./shared";
import Checkout from "./Checkout";
function ProductPage({
  p,
  lang,
  onAdd,
  onSave,
  saved,
  open,
  onSaveRelated,
  savedRelated,
}: {
  p: Product;
  lang: Language;
  onAdd: (id: string, v: string, q: number) => void;
  onSave: () => void;
  saved: boolean;
  open: (slug: string) => void;
  onSaveRelated: (id: string) => void;
  savedRelated: string[];
}) {
  const [variant, setVariant] = useState(p.variants[0].id),
    [quantity, setQuantity] = useState(1);
  const v = p.variants.find((v) => v.id === variant)!;
  const t = translator(lang);
  return (
    <>
      <div className="product-page">
        <div className="product-large">
          <img src={image(p)} alt={p.name[lang]} />
        </div>
        <div className="product-info">
          <small>FORMA / {t(p.category as "home")}</small>
          <h1>{p.name[lang]}</h1>
          <strong className="price">{money(p.price, lang)}</strong>
          <p>{p.description[lang]}</p>
          <label>
            {t("Variant")}
            <select
              value={variant}
              onChange={(e) => {
                setVariant(e.target.value);
                setQuantity(1);
              }}
            >
              {p.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name[lang]}
                </option>
              ))}
            </select>
          </label>
          <p className="stock">
            {v.stock
              ? `${t("Demo availability")}: ${v.stock}`
              : t("Unavailable in this demo")}
          </p>
          <label>
            {t("Quantity")}
            <input
              type="number"
              aria-label={t("Quantity")}
              min="1"
              max={v.stock || 1}
              value={quantity}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isInteger(n) && n > 0 && n <= v.stock)
                  setQuantity(n);
              }}
            />
          </label>
          <div className="buy-actions">
            <button
              className="primary"
              disabled={!v.stock}
              onClick={() => onAdd(p.id, variant, quantity)}
            >
              {t("Add to cart")} <Plus size={16} />
            </button>
            <button
              aria-pressed={saved}
              aria-label={t(saved ? "Remove saved object" : "Save object")}
              onClick={onSave}
            >
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="fine">
            {t(
              "Prices include illustrative taxes. No additional tax calculation.",
            )}
          </p>
          <dl>
            <div>
              <dt>{t("Material")}</dt>
              <dd>{p.material[lang]}</dd>
            </div>
            <div>
              <dt>{t("Dimensions")}</dt>
              <dd>{p.dimensions}</dd>
            </div>
          </dl>
          <p className="fine">{p.features[lang]}</p>
        </div>
      </div>
      <div className="section-head">
        <h2>{t("Related objects")}</h2>
      </div>
      <div className="grid">
        {catalog
          .filter((q) => q.category === p.category && q.id !== p.id)
          .slice(0, 3)
          .map((q) => (
            <ProductCard
              key={q.id}
              p={q}
              lang={lang}
              saved={savedRelated.includes(q.id)}
              onSave={() => onSaveRelated(q.id)}
              onOpen={() => open(q.slug)}
            />
          ))}
      </div>
    </>
  );
}
export default function App() {
  const [route, setRoute] = useState(() => parseURL(location.search)),
    [lang, setLang] = useState<Language>(language),
    [cart, setCart] = useState<Line[]>(readCart),
    [wishlist, setWishlist] = useState(readWishlist),
    [notice, setNotice] = useState<Key | null>(null),
    [storageError, setStorageError] = useState(false),
    [order, setOrder] = useState<Order | null>(null),
    [search, setSearch] = useState("");
  const t = translator(lang),
    count = cart.reduce((s, l) => s + l.quantity, 0);
  function go(page: string, slug = "", filters = emptyFilters) {
    const url = serialize(page, slug, filters);
    history.pushState(null, "", url);
    setRoute(parseURL(url));
    setNotice(null);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const pop = () => setRoute(parseURL(location.search));
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    const p = catalog.find((p) => p.slug === route.slug);
    document.title = `${route.page === "product" && p ? p.name[lang] : t(route.page === "cart" ? "Cart" : route.page === "wishlist" ? "Wishlist" : route.page === "checkout" ? "Demo checkout" : route.page === "catalog" ? "Collection" : "Home")} — Forma`;
    if (!write("language", lang)) setStorageError(true);
  }, [lang, route]);
  useEffect(() => {
    if (!write("cart", cart)) setStorageError(true);
  }, [cart]);
  useEffect(() => {
    if (!write("wishlist", wishlist)) setStorageError(true);
  }, [wishlist]);
  function save(id: string) {
    setWishlist((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
    setNotice(wishlist.includes(id) ? "Removed" : "Saved");
  }
  function add(id: string, variant: string, q: number) {
    const old =
      cart.find((l) => l.id === id && l.variant === variant)?.quantity || 0;
    const next = change(cart, id, variant, old + q);
    setCart(next);
    setNotice(
      (next.find((l) => l.id === id && l.variant === variant)?.quantity || 0) <
        old + q
        ? "Demo stock limit reached"
        : "Added to cart",
    );
  }
  function cards(list: Product[]) {
    return (
      <div className="grid">
        {list.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            lang={lang}
            saved={wishlist.includes(p.id)}
            onSave={() => save(p.id)}
            onOpen={() => go("product", p.slug)}
          />
        ))}
      </div>
    );
  }
  function filters(f: typeof route.filters) {
    const url = serialize("catalog", "", f);
    history.replaceState(null, "", url);
    setRoute(parseURL(url));
  }
  const product = catalog.find((p) => p.slug === route.slug);
  return (
    <>
      <a className="skip" href="#main">
        {t("Skip to content")}
      </a>
      <div className="demo-bar">
        {t("Demo store — no real purchases or payments.")}
      </div>
      <header>
        <a
          href="?"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          forma<span>.</span>
        </a>
        <nav>
          {(["home", "catalog"] as const).map((p) => (
            <a
              key={p}
              href={serialize(p)}
              aria-current={route.page === p ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(p);
              }}
            >
              {t(p === "home" ? "Home" : "Shop")}
            </a>
          ))}
        </nav>
        <form
          className="header-search"
          onSubmit={(e) => {
            e.preventDefault();
            go("catalog", "", { ...emptyFilters, q: search });
          }}
        >
          <Search size={15} />
          <input
            value={search}
            aria-label={t("Search the collection")}
            placeholder={t("Search the collection")}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button aria-label={t("Search")}>
            <ArrowRight size={14} />
          </button>
        </form>
        <select
          aria-label={t("Language")}
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
        >
          <option value="en">English</option>
          <option value="it">Italiano</option>
        </select>
        <a
          className="icon-link"
          href={serialize("wishlist")}
          aria-label={`${t("Wishlist")} (${wishlist.length})`}
          onClick={(e) => {
            e.preventDefault();
            go("wishlist");
          }}
        >
          <Heart size={20} />
          <span>{wishlist.length}</span>
        </a>
        <a
          className="icon-link"
          href={serialize("cart")}
          aria-label={`${t("Cart")} (${count})`}
          onClick={(e) => {
            e.preventDefault();
            go("cart");
          }}
        >
          <ShoppingBag size={20} />
          <span>{count}</span>
        </a>
      </header>
      <main id="main">
        {storageError && (
          <p className="storage-warning">
            {t("Storage unavailable. Changes remain in this session only.")}
          </p>
        )}
        {notice && (
          <div className="notice" role="status">
            <Check size={16} />
            {t(notice)}
          </div>
        )}
        {route.page === "home" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">FORMA — EVERYDAY ESSENTIALS</span>
                <h1>{t("Considered objects. Everyday rituals.")}</h1>
                <p>
                  {t(
                    "A collection of useful, tactile objects for the places you call your own.",
                  )}
                </p>
                <a
                  className="primary"
                  href={serialize("catalog")}
                  onClick={(e) => {
                    e.preventDefault();
                    go("catalog");
                  }}
                >
                  {t("Explore the collection")}
                  <ArrowRight size={17} />
                </a>
                <small>{t("Illustrated objects, thoughtful spaces.")}</small>
              </div>
              <div className="hero-art">
                <img
                  className="hero-lamp"
                  src={image(catalog[0])}
                  alt={catalog[0].name[lang]}
                />
                <div className="hero-caption">
                  <span>01 / {catalog[0].name[lang]}</span>
                  <a
                    href={serialize("product", catalog[0].slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      go("product", catalog[0].slug);
                    }}
                  >
                    {t("Shop the edit")}
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </section>
            <div className="category-strip">
              {(["home", "desk", "technology", "accessories"] as const).map(
                (c, i) => (
                  <a
                    key={c}
                    href={serialize("catalog", "", {
                      ...emptyFilters,
                      category: c,
                    })}
                    onClick={(e) => {
                      e.preventDefault();
                      go("catalog", "", { ...emptyFilters, category: c });
                    }}
                  >
                    <span>0{i + 1}</span>
                    {t(c)}
                    <ArrowUpRight size={17} />
                  </a>
                ),
              )}
            </div>
            <section className="featured">
              <div className="section-head">
                <div>
                  <span className="eyebrow">
                    {t("Small details. Lasting presence.")}
                  </span>
                  <h2>{t("The everyday edit")}</h2>
                </div>
                <button className="text-link" onClick={() => go("catalog")}>
                  {t("View all")}
                  <ArrowRight size={15} />
                </button>
              </div>
              {cards(catalog.slice(0, 4))}
            </section>
            <section className="editorial">
              <span>f.</span>
              <div>
                <small>FORMA / EVERYDAY ESSENTIALS</small>
                <h2>{t("Objects for a slower everyday.")}</h2>
                <p>{t("Good things, quietly made.")}</p>
              </div>
              <button onClick={() => go("catalog")}>
                {t("Explore the collection")}
                <ArrowRight size={16} />
              </button>
            </section>
          </>
        ) : route.page === "catalog" ? (
          <>
            <div className="page-heading">
              <small>FORMA / {t("Collection")}</small>
              <h1>{t("All products")}</h1>
            </div>
            <section className="filters">
              <label>
                {t("Search")}
                <input
                  value={route.filters.q}
                  onChange={(e) =>
                    filters({ ...route.filters, q: e.target.value })
                  }
                />
              </label>
              <label>
                {t("Category")}
                <select
                  value={route.filters.category}
                  onChange={(e) =>
                    filters({ ...route.filters, category: e.target.value })
                  }
                >
                  {(
                    [
                      "all",
                      "home",
                      "desk",
                      "technology",
                      "accessories",
                    ] as const
                  ).map((c) => (
                    <option value={c} key={c}>
                      {t(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Maximum price (€)")}
                <input
                  type="number"
                  min="0"
                  value={route.filters.max}
                  onChange={(e) =>
                    filters({ ...route.filters, max: e.target.value })
                  }
                />
              </label>
              <label>
                {t("Sort")}
                <select
                  value={route.filters.sort}
                  onChange={(e) =>
                    filters({ ...route.filters, sort: e.target.value })
                  }
                >
                  {[
                    ["featured", "Featured"],
                    ["price-up", "Price: low to high"],
                    ["price-down", "Price: high to low"],
                    ["name", "Name"],
                  ].map(([v, k]) => (
                    <option key={v} value={v}>
                      {t(k as Key)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={route.filters.available}
                  onChange={(e) =>
                    filters({ ...route.filters, available: e.target.checked })
                  }
                />
                {t("Available only")}
              </label>
              <button onClick={() => filters(emptyFilters)}>
                {t("Reset")}
              </button>
            </section>
            <p className="result-count" role="status">
              {filterProducts(route.filters, lang).length} {t("results")}
            </p>
            {filterProducts(route.filters, lang).length ? (
              cards(filterProducts(route.filters, lang))
            ) : (
              <p className="empty">{t("No products match your filters.")}</p>
            )}
          </>
        ) : route.page === "product" ? (
          product ? (
            <ProductPage
              key={product.id}
              p={product}
              lang={lang}
              onAdd={add}
              onSave={() => save(product.id)}
              saved={wishlist.includes(product.id)}
              open={(slug) => go("product", slug)}
              onSaveRelated={save}
              savedRelated={wishlist}
            />
          ) : (
            <section className="empty">
              <h1>{t("Product not found")}</h1>
              <button onClick={() => go("catalog")}>
                {t("Continue shopping")}
              </button>
            </section>
          )
        ) : route.page === "wishlist" ? (
          <>
            <div className="page-heading">
              <small>FORMA / {t("Saved")}</small>
              <h1>{t("Wishlist")}</h1>
            </div>
            {wishlist.length ? (
              cards(catalog.filter((p) => wishlist.includes(p.id)))
            ) : (
              <p className="empty">{t("Your wishlist is empty")}</p>
            )}
          </>
        ) : route.page === "cart" ? (
          <>
            <div className="page-heading">
              <small>FORMA / {t("Cart")}</small>
              <h1>
                {t("Cart")} <span>({count})</span>
              </h1>
            </div>
            {cart.length ? (
              <div className="cart-layout">
                <div>
                  {cart.map((l) => {
                    const p = catalog.find((p) => p.id === l.id)!,
                      v = p.variants.find((v) => v.id === l.variant)!;
                    return (
                      <article className="cart-item" key={key(l)}>
                        <img src={image(p)} alt={p.name[lang]} />
                        <div>
                          <a
                            href={serialize("product", p.slug)}
                            onClick={(e) => {
                              e.preventDefault();
                              go("product", p.slug);
                            }}
                          >
                            {p.name[lang]}
                          </a>
                          <p>
                            {v.name[lang]} · {money(p.price, lang)}
                          </p>
                          <button
                            className="text-link"
                            onClick={() => {
                              setCart(change(cart, l.id, l.variant, 0));
                              setNotice("Removed");
                            }}
                          >
                            {t("Remove")}
                          </button>
                        </div>
                        <div className="quantity">
                          <button
                            aria-label={"− " + p.name[lang]}
                            disabled={l.quantity <= 1}
                            onClick={() =>
                              setCart(
                                change(cart, l.id, l.variant, l.quantity - 1),
                              )
                            }
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            aria-label={
                              t("Quantity") +
                              " " +
                              p.name[lang] +
                              " " +
                              v.name[lang]
                            }
                            type="number"
                            min="1"
                            max={v.stock}
                            value={l.quantity}
                            onChange={(e) => {
                              const q = Number(e.target.value);
                              if (Number.isInteger(q) && q > 0) {
                                setCart(change(cart, l.id, l.variant, q));
                                if (q > v.stock)
                                  setNotice("Demo stock limit reached");
                              }
                            }}
                          />
                          <button
                            aria-label={"+ " + p.name[lang]}
                            disabled={l.quantity === v.stock}
                            onClick={() =>
                              setCart(
                                change(cart, l.id, l.variant, l.quantity + 1),
                              )
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <strong>{money(p.price * l.quantity, lang)}</strong>
                      </article>
                    );
                  })}
                  <button
                    className="text-link"
                    onClick={() => {
                      setCart([]);
                      setNotice("Removed");
                    }}
                  >
                    {t("Clear cart")}
                  </button>
                </div>
                <aside className="order-summary">
                  <h2>{t("Review")}</h2>
                  <dl>
                    <div>
                      <dt>{t("Subtotal")}</dt>
                      <dd>{money(subtotal(cart), lang)}</dd>
                    </div>
                  </dl>
                  <p className="fine">
                    {t("Shipping calculated at demo checkout")}
                  </p>
                  <button className="primary" onClick={() => go("checkout")}>
                    {t("Proceed to demo checkout")}
                    <ArrowRight size={15} />
                  </button>
                  <p className="fine">
                    {t(
                      "Prices include illustrative taxes. No additional tax calculation.",
                    )}
                  </p>
                </aside>
              </div>
            ) : (
              <section className="empty">
                <h2>{t("Your cart is empty")}</h2>
                <button onClick={() => go("catalog")}>
                  {t("Continue shopping")}
                </button>
              </section>
            )}
          </>
        ) : route.page === "checkout" ? (
          cart.length ? (
            <Checkout
              cart={normalize(cart)}
              lang={lang}
              onOrder={(o) => {
                setOrder(o);
                setCart([]);
                go("confirmation");
              }}
            />
          ) : (
            <section className="empty">
              <h1>{t("Your cart is empty")}</h1>
              <button onClick={() => go("catalog")}>
                {t("Continue shopping")}
              </button>
            </section>
          )
        ) : (
          <section className="confirmation">
            <span className="confirmation-icon">
              <Check size={30} />
            </span>
            <h1>
              {t(
                order
                  ? "Your demo order is ready."
                  : "No order snapshot available after reload.",
              )}
            </h1>
            <p>
              {t(
                "No payment was taken. No shipment or email will be sent. Nothing is registered on a server.",
              )}
            </p>
            {order && (
              <div className="order-summary">
                <h2>{order.id}</h2>
                <p>
                  {t(
                    order.method === "express"
                      ? "Express delivery"
                      : "Standard delivery",
                  )}
                </p>
                {order.items.map((l, i) => (
                  <div className="summary-item" key={i}>
                    <span>
                      {l.name[lang]}
                      <small>
                        {l.variant[lang]} × {l.quantity}
                      </small>
                    </span>
                    <strong>{money(l.price * l.quantity, lang)}</strong>
                  </div>
                ))}
                <dl>
                  <div>
                    <dt>{t("Subtotal")}</dt>
                    <dd>{money(order.subtotal, lang)}</dd>
                  </div>
                  <div>
                    <dt>{t("Shipping")}</dt>
                    <dd>{money(order.shipping, lang)}</dd>
                  </div>
                  <div className="total">
                    <dt>{t("Total")}</dt>
                    <dd>{money(order.total, lang)}</dd>
                  </div>
                </dl>
                <button onClick={() => window.print()}>
                  {t("Print summary")}
                </button>
              </div>
            )}
            <button className="primary" onClick={() => go("catalog")}>
              {t("Continue shopping")}
            </button>
          </section>
        )}
      </main>
      <footer>
        <div>
          <a
            className="brand"
            href="?"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            forma<span>.</span>
          </a>
          <p>Everyday Essentials</p>
        </div>
        <div>
          <p>{t("Demo store — no real purchases or payments.")}</p>
          <p>
            {t(
              "Standard: €4.90, free from €100. Express: €9.00. Demo delivery in Italy only.",
            )}
          </p>
          <small>{t("A project by Federico Santorsola")}</small>
        </div>
      </footer>
    </>
  );
}
