"use client";

import { Apple, Backpack, Bean, Beef, CookingPot, Drumstick, Egg, Fish, Sandwich, Soup, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import ahLogo from "@/app/logos/Albert_Heijn_Logo.svg";
import jumboLogo from "@/app/logos/Jumbo_Logo.svg.png";
import plusLogo from "@/app/logos/plus-supermarkt-logo-png_seeklogo-277715.png";
import type { LunchKind } from "@/lib/lunches";
import { PHOTOS, photoUrl } from "@/lib/photos";
import type { Protein, Recipe } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";
import { addDays, fromIso, isoDate } from "@/lib/schoolCalendar";

const PROTEIN_ICON: Record<Protein, LucideIcon> = {
  chicken: Drumstick,
  beef: Beef,
  fish: Fish,
  lamb: CookingPot,
  beans: Bean,
  eggs: Egg,
};

export const PROTEIN_LABEL: Record<Protein, string> = {
  chicken: "Chicken",
  beef: "Beef",
  fish: "Fish",
  lamb: "Lamb",
  beans: "Beans",
  eggs: "Eggs",
};

// Pixels requested per tile shape, at roughly twice the displayed size.
const PHOTO_SIZE = { thumb: [400, 300], cover: [640, 400], banner: [1200, 520] } as const;

/** A photo for the dish, over a coloured protein tile that shows while it loads or if it fails. */
export function RecipeArt({ recipe, shape = "thumb" }: { recipe: Recipe; shape?: keyof typeof PHOTO_SIZE }) {
  const Icon = PROTEIN_ICON[recipe.protein];
  const photo = PHOTOS[recipe.id];
  const [width, height] = PHOTO_SIZE[shape];
  return (
    <span className={`art p-${recipe.protein} ${shape}`} aria-hidden="true">
      <Icon strokeWidth={1.5} />
      {photo && (
        // A plain img: Unsplash already serves the right size and format.
        <img
          src={photoUrl(photo, width, height)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}

const LUNCH_ICON: Record<LunchKind, LucideIcon> = { snack: Apple, lunchbox: Backpack, adult: Sandwich, family: Soup };

/** A coloured tile for a lunch, by kind; lunches have no photos. */
export function LunchArt({ kind, shape = "thumb" }: { kind: LunchKind; shape?: keyof typeof PHOTO_SIZE }) {
  const Icon = LUNCH_ICON[kind];
  return (
    <span className={`art l-${kind} ${shape}`} aria-hidden="true">
      <Icon strokeWidth={1.5} />
    </span>
  );
}

/** "2 adults, 2 kids" */
export function household({ adults, kids }: { adults: number; kids: number }): string {
  const a = `${adults} ${adults === 1 ? "adult" : "adults"}`;
  return kids > 0 ? `${a}, ${kids} ${kids === 1 ? "kid" : "kids"}` : a;
}

// Next imports images as StaticImageData; Vite (in tests) as a URL string.
type ImageImport = string | { src: string };

const LOGOS: Record<string, { image: ImageImport; wide?: boolean }> = {
  albert_heijn: { image: ahLogo },
  jumbo: { image: jumboLogo, wide: true },
  plus: { image: plusLogo },
};

export function RetailerBadge({ retailer }: { retailer: string }) {
  const logo = LOGOS[retailer];
  if (logo) {
    const src = typeof logo.image === "string" ? logo.image : logo.image.src;
    return (
      <span className={`retailer-badge logo ${retailer}${logo.wide ? " wide" : ""}`} aria-hidden="true">
        <img src={src} alt="" decoding="async" />
      </span>
    );
  }
  return (
    <span className={`retailer-badge ${retailer}`} aria-hidden="true">
      {RETAILERS[retailer]?.[0] ?? "?"}
    </span>
  );
}

export type Day = { short: string; long: string; date: number; past: boolean };

/** Day `offset` of a week that starts on `start`; the week keeps its dates when reopened later. */
export function dayAt(start: string, offset: number): Day {
  const iso = addDays(start, offset);
  const d = fromIso(iso);
  const today = isoDate(new Date());
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  return {
    short: weekday.slice(0, 3),
    long: iso === today ? "Today" : iso === addDays(today, 1) ? "Tomorrow" : weekday,
    date: d.getDate(),
    past: iso < today,
  };
}

/** "13 – 19 Oct" for a plan of `days` days starting on `start`. */
export function weekRange(start: string, days: number): string {
  const from = fromIso(start);
  const to = fromIso(addDays(start, days - 1));
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  const first = from.getMonth() === to.getMonth() ? `${from.getDate()}` : `${from.getDate()} ${month(from)}`;
  return days > 1 ? `${first} – ${to.getDate()} ${month(to)}` : `${to.getDate()} ${month(to)}`;
}

/** A modal that is a bottom sheet on phones and a centred dialog on wider screens. */
export function Sheet(props: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-label={props.title}
      onClose={props.onClose}
      onClick={(e) => {
        // The dialog element itself is only hit on the backdrop; content sits in .sheet-inner.
        if (e.target === dialog.current) dialog.current.close();
      }}
    >
      <div className="sheet-inner">
        <button className="icon-button sheet-close" onClick={() => dialog.current?.close()} aria-label="Close">
          <X aria-hidden="true" />
        </button>
        <div className="sheet-body">{props.children}</div>
        {props.footer && <div className="sheet-footer">{props.footer}</div>}
      </div>
    </dialog>
  );
}
