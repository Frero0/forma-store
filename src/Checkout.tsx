import { useState, useRef } from "react";
import {
  catalog,
  subtotal,
  shipping,
  validate,
  snapshot,
  SubmitGuard,
  type Address,
  type Line,
  type Language,
  type Order,
} from "./domain";
import { translator, money } from "./i18n";
export default function Checkout({
  cart,
  lang,
  onOrder,
}: {
  cart: Line[];
  lang: Language;
  onOrder: (order: Order) => void;
}) {
  const t = translator(lang);
  const [step, setStep] = useState(0),
    [method, setMethod] = useState("standard"),
    [address, setAddress] = useState<Address>({
      name: "",
      email: "",
      street: "",
      city: "",
      postcode: "",
      country: "IT",
    }),
    [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const guard = useRef(new SubmitGuard());
  const amount = subtotal(cart);
  function next() {
    const e = validate(address);
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(
        () =>
          document
            .querySelector<HTMLInputElement>("[aria-invalid=true]")
            ?.focus(),
        0,
      );
      return;
    }
    setStep(step + 1);
  }
  return (
    <section className="checkout">
      <div className="page-heading">
        <small>FORMA / {t("Demo checkout")}</small>
        <h1>{t("Demo checkout")}</h1>
        <p>
          {t(
            "Use fictional details. They stay in memory and are never sent or saved.",
          )}
        </p>
      </div>
      <ol className="steps">
        {(["Shipping details", "Delivery", "Review"] as const).map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <span>{i + 1}</span>
            {t(s)}
          </li>
        ))}
      </ol>
      <div className="checkout-grid">
        <form
          className="checkout-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) next();
            else guard.current.run(() => onOrder(snapshot(cart, method)));
          }}
        >
          {step === 0 ? (
            <>
              <div className="section-head">
                <h2>{t("Shipping details")}</h2>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setAddress({
                      name: "Alex Example",
                      email: "alex@example.com",
                      street: "Via Esempio 12",
                      city: "Torino",
                      postcode: "10100",
                      country: "IT",
                    });
                    setErrors({});
                  }}
                >
                  {t("Fill with sample data")}
                </button>
              </div>
              <div className="fields">
                {(["name", "email", "street", "city", "postcode"] as const).map(
                  (k) => (
                    <label key={k}>
                      {t(
                        (
                          {
                            name: "Full name",
                            email: "Email",
                            street: "Address",
                            city: "City",
                            postcode: "Postcode",
                          } as const
                        )[k],
                      )}
                      <input
                        id={k}
                        value={address[k]}
                        type={k === "email" ? "email" : "text"}
                        maxLength={k === "postcode" ? 5 : 150}
                        aria-invalid={!!errors[k]}
                        aria-describedby={errors[k] ? k + "-error" : undefined}
                        onChange={(e) =>
                          setAddress({ ...address, [k]: e.target.value })
                        }
                      />
                      {errors[k] && (
                        <small className="error" id={k + "-error"}>
                          {t(errors[k] as "Enter a city")}
                        </small>
                      )}
                    </label>
                  ),
                )}
                <label>
                  {t("Country")}
                  <select
                    value={address.country}
                    onChange={(e) =>
                      setAddress({ ...address, country: e.target.value })
                    }
                  >
                    <option value="IT">{t("Italy")}</option>
                  </select>
                </label>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <h2>{t("Delivery")}</h2>
              <p>
                {t(
                  "Standard: €4.90, free from €100. Express: €9.00. Demo delivery in Italy only.",
                )}
              </p>
              {["standard", "express"].map((m) => (
                <label className="delivery" key={m}>
                  <input
                    type="radio"
                    name="shipping"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                  <span>
                    {t(
                      m === "standard"
                        ? "Standard delivery"
                        : "Express delivery",
                    )}
                  </span>
                  <strong>{money(shipping(m, amount), lang)}</strong>
                </label>
              ))}
            </>
          ) : (
            <>
              <h2>{t("Review")}</h2>
              <p>
                {address.name}
                <br />
                {address.street}, {address.postcode} {address.city}
                <br />
                {address.email} · {t("Italy")}
              </p>
              <p>
                {t(
                  method === "standard"
                    ? "Standard delivery"
                    : "Express delivery",
                )}
              </p>
              <p className="demo-note">
                {t(
                  "No payment was taken. No shipment or email will be sent. Nothing is registered on a server.",
                )}
              </p>
            </>
          )}
          <div className="form-actions">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)}>
                {t("Back")}
              </button>
            )}
            <button className="primary" type="submit">
              {t(step === 2 ? "Confirm demo order" : "Continue")}
            </button>
          </div>
        </form>
        <aside className="order-summary">
          <h2>{t("Review")}</h2>
          {cart.map((l) => {
            const p = catalog.find((p) => p.id === l.id)!;
            return (
              <div className="summary-item" key={l.id + l.variant}>
                <span>
                  {p.name[lang]}
                  <small>
                    {p.variants.find((v) => v.id === l.variant)!.name[lang]} ×{" "}
                    {l.quantity}
                  </small>
                </span>
                <strong>{money(p.price * l.quantity, lang)}</strong>
              </div>
            );
          })}
          <dl>
            <div>
              <dt>{t("Subtotal")}</dt>
              <dd>{money(amount, lang)}</dd>
            </div>
            <div>
              <dt>{t("Shipping")}</dt>
              <dd>{money(shipping(method, amount), lang)}</dd>
            </div>
            <div className="total">
              <dt>{t("Total")}</dt>
              <dd>{money(amount + shipping(method, amount), lang)}</dd>
            </div>
          </dl>
          <small>
            {t(
              "Prices include illustrative taxes. No additional tax calculation.",
            )}
          </small>
        </aside>
      </div>
    </section>
  );
}
