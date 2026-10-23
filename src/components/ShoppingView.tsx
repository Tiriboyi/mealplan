"use client";

import { Check, PartyPopper, Share2 } from "lucide-react";
import { useState } from "react";
import { totals, type Plan, type PromoLine } from "@/lib/planner";
import { RETAILERS } from "@/lib/retailers";
import { money, shortDate } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import Status from "./Status";
import { RetailerBadge } from "./ui";

/** Tick id for a list entry that is an ingredient rather than a promotion. */
const loose = (ingredientId: string) => `i:${ingredientId}`;

function asText(plan: Plan, buying: PromoLine[]): string {
  const out: string[] = [];
  for (const [retailer, name] of Object.entries(RETAILERS)) {
    const lines = buying.filter((l) => l.deal.retailer === retailer);
    if (lines.length === 0) continue;
    out.push(name, ...lines.map((l) => `- ${l.units} × ${l.deal.name} (${money(l.pay)})`), "");
  }
  if (plan.regular.length) out.push("At regular price", ...plan.regular.map((r) => `- ${r.ingredient.name} (${r.ingredient.nl})`), "");
  if (plan.pantry.length) out.push("Check your cupboard", ...plan.pantry.map((i) => `- ${i.name}`));
  return out.join("\n").trim();
}

export default function ShoppingView() {
  const { plan, buying, sum, budget, ticked, toggleTick } = usePlan();
  const [notice, setNotice] = useState("");

  if (!plan)
    return (
      <>
        <div className="page-head">
          <div>
            <p className="eyebrow">&nbsp;</p>
            <h1>Shopping list</h1>
          </div>
        </div>
        <Status />
      </>
    );

  const toBuy = [...buying.map((l) => l.deal.id), ...plan.regular.map((r) => loose(r.ingredient.id))];
  const done = toBuy.filter((id) => ticked.includes(id)).length;
  const finished = toBuy.length > 0 && done === toBuy.length;

  async function share() {
    const text = asText(plan!, buying);
    try {
      if (navigator.share) await navigator.share({ title: "Shopping list", text });
      else {
        await navigator.clipboard.writeText(text);
        setNotice("List copied");
        setTimeout(() => setNotice(""), 3000);
      }
    } catch {
      // Share sheet dismissed, or no clipboard permission: nothing to report.
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {plan.meals.length} {plan.meals.length === 1 ? "dinner" : "dinners"}
          </p>
          <h1>Shopping list</h1>
        </div>
        <button className="button" onClick={share}>
          <Share2 aria-hidden="true" />
          Share
        </button>
      </div>

      <div className="shop">
        <aside className="summary" aria-label="Summary">
          <div className="progress-head">
            <strong>
              {finished ? (
                <>
                  <PartyPopper aria-hidden="true" /> All in the trolley
                </>
              ) : (
                `${done} of ${toBuy.length} in the trolley`
              )}
            </strong>
          </div>
          <progress value={done} max={toBuy.length || 1} aria-label="Items in the trolley" />
          <dl>
            <div>
              <dt>Offers on the list</dt>
              <dd>
                {money(sum.pay)}
                {budget && <span className={budget.over ? "budget-over" : "budget-under"}>{budget.text}</span>}
              </dd>
            </div>
            <div>
              <dt>At regular prices</dt>
              <dd>
                <s>{money(sum.normal)}</s>
              </dd>
            </div>
            <div className="saving">
              <dt>You save</dt>
              <dd>
                {money(sum.saving)} <span>({sum.percent}%)</span>
              </dd>
            </div>
          </dl>
          <p className="meta">
            Items bought at regular price are not in these totals.
            {budget && " The budget compares promotion items only."}
          </p>
        </aside>

        <div className="shop-lists">
          {Object.keys(RETAILERS)
            .map((r) => ({ retailer: r, lines: plan.promo.filter((l) => l.deal.retailer === r) }))
            .filter((g) => g.lines.length > 0)
            .map(({ retailer, lines }) => (
              <RetailerList key={retailer} retailer={retailer} lines={lines} />
            ))}

          {plan.regular.length > 0 && (
            <section className="group">
              <div className="group-head">
                <h2>At regular price</h2>
              </div>
              <p className="meta">Needed for these dinners, with no offer worth using this week.</p>
              <ul className="lines">
                {plan.regular.map(({ ingredient, line }) => (
                  <li key={ingredient.id}>
                    <label className="line">
                      <Tick checked={ticked.includes(loose(ingredient.id))} onChange={() => toggleTick(loose(ingredient.id))} />
                      <span className="line-body">
                        <span className="line-name">{ingredient.name}</span>
                        <span className="meta" lang="nl">
                          {ingredient.nl}
                        </span>
                        {line && (
                          <span className="meta">
                            {line.deal.promoLabel ?? "The offer"} at {RETAILERS[line.deal.retailer]} only pays off if
                            you buy {line.deal.multiBuyQty}; one is {money(line.pay / line.units)}.
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.pantry.length > 0 && (
            <section className="group">
              <div className="group-head">
                <h2>Check your cupboard</h2>
              </div>
              <ul className="lines">
                {plan.pantry.map((ingredient) => (
                  <li key={ingredient.id}>
                    <label className="line">
                      <Tick checked={ticked.includes(loose(ingredient.id))} onChange={() => toggleTick(loose(ingredient.id))} />
                      <span className="line-body">
                        <span className="line-name">{ingredient.name}</span>
                        <span className="meta" lang="nl">
                          {ingredient.nl}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <p className="toast" role="status" data-open={notice !== ""}>
        {notice}
      </p>
    </>
  );

}

function RetailerList({ retailer, lines }: { retailer: string; lines: PromoLine[] }) {
  const { skipped, ticked, toggleSkip, toggleTick } = usePlan();
  const sub = totals(lines.filter((l) => !skipped.includes(l.deal.id)));
  const ends = lines.map((l) => l.deal.validUntil).filter((d): d is string => Boolean(d)).sort()[0];
  return (
    <section className="group">
      <div className="group-head">
        <h2>
          <RetailerBadge retailer={retailer} />
          {RETAILERS[retailer]}
        </h2>
        <p className="group-total">
          {money(sub.pay)}
          {sub.saving > 0 && <span>save {money(sub.saving)}</span>}
        </p>
      </div>
      {ends && <p className="meta">First offers end {shortDate(ends)}.</p>}
      <ul className="lines">
        {lines.map((line) => {
          const { deal } = line;
          const off = skipped.includes(deal.id);
          return (
            <li key={deal.id} className={off ? "off" : undefined}>
              <label className="line">
                <Tick checked={ticked.includes(deal.id)} onChange={() => toggleTick(deal.id)} disabled={off} />
                <span className="line-body">
                  <span className="line-name">
                    {line.units} × {deal.name}
                  </span>
                  <span className="meta">
                    {[deal.quantity, deal.validUntil && `until ${shortDate(deal.validUntil)}`, `for ${line.ingredient.name.toLowerCase()}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {deal.promoLabel && <span className="tag offer">{deal.promoLabel}</span>}
                </span>
              </label>
              <div className="line-price">
                <strong>{money(line.pay)}</strong>
                {line.saving > 0 && <s>{money(line.normal)}</s>}
              </div>
              <div className="line-actions">
                {deal.url && (
                  <a href={deal.url} target="_blank" rel="noreferrer">
                    View at {RETAILERS[retailer]}
                  </a>
                )}
                <button className="link" onClick={() => toggleSkip(deal.id)}>
                  {off ? "Add back" : "I already have it"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Tick(props: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <span className="tick">
      <input type="checkbox" checked={props.checked} onChange={props.onChange} disabled={props.disabled} />
      <Check aria-hidden="true" strokeWidth={3} />
    </span>
  );
}
