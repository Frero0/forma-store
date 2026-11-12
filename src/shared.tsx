import { Heart, ArrowUpRight } from "lucide-react";
import type { Product, Language } from "./domain";
import { money, translator } from "./i18n";
export const image = (p: Product) => import.meta.env.BASE_URL + p.image;
export function ProductCard({
  p,
  lang,
  saved,
  onSave,
  onOpen,
}: {
  p: Product;
  lang: Language;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const t = translator(lang);
  return (
    <article className="product-card">
      <div className="product-image">
        <a
          href={`?page=product&slug=${p.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onOpen();
          }}
        >
          <img src={image(p)} alt={p.name[lang]} loading="lazy" />
        </a>
        <button
          className="heart"
          aria-label={
            t(saved ? "Remove saved object" : "Save object") +
            " " +
            p.name[lang]
          }
          aria-pressed={saved}
          onClick={onSave}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        {!p.variants.some((v) => v.stock) && (
          <span className="sold">{t("Unavailable in this demo")}</span>
        )}
      </div>
      <div className="product-meta">
        <div>
          <small>{t(p.category as "home")}</small>
          <a
            href={`?page=product&slug=${p.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onOpen();
            }}
          >
            {p.name[lang]}
          </a>
        </div>
        <span>{money(p.price, lang)}</span>
      </div>
      <button className="text-link" onClick={onOpen}>
        {t("Details")} <ArrowUpRight size={13} />
      </button>
    </article>
  );
}
