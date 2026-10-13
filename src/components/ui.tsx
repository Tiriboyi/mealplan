"use client";

import { Bean, Beef, CookingPot, Drumstick, Egg, Fish, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { PHOTOS, photoUrl } from "@/lib/photos";
import type { Protein, Recipe } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";

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

export function RetailerBadge({ retailer }: { retailer: string }) {
  return (
    <span className={`retailer-badge ${retailer}`} aria-hidden="true">
      {RETAILERS[retailer]?.[0] ?? "?"}
    </span>
  );
}

export type Day = { short: string; long: string; date: number };

/** The day `offset` days from now; dinners are planned from today onwards. */
export function dayAt(offset: number): Day {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  return {
    short: weekday.slice(0, 3),
    long: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : weekday,
    date: d.getDate(),
  };
}

/** "13 – 19 Oct" for a plan of `days` dinners starting today. */
export function weekRange(days: number): string {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days - 1);
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  const start = from.getMonth() === to.getMonth() ? `${from.getDate()}` : `${from.getDate()} ${month(from)}`;
  return days > 1 ? `${start} – ${to.getDate()} ${month(to)}` : `${to.getDate()} ${month(to)}`;
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
