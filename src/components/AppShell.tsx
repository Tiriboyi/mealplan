"use client";

import { BookOpen, CalendarDays, ShoppingBasket, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlan } from "./PlanProvider";

const NAV = [
  { href: "/", label: "This week", short: "Week", icon: CalendarDays },
  { href: "/shopping", label: "Shopping list", short: "Shopping", icon: ShoppingBasket },
  { href: "/recipes", label: "Recipes", short: "Recipes", icon: BookOpen },
  { href: "/settings", label: "Settings", short: "Settings", icon: SlidersHorizontal },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan, buying, ticked, load } = usePlan();

  // Things still to put in the trolley.
  const toBuy = plan
    ? [...buying.map((l) => l.deal.id), ...plan.regular.map((r) => `i:${r.ingredient.id}`)].filter(
        (id) => !ticked.includes(id),
      ).length
    : 0;

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="brand">
        <Link href="/" className="brand-link">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="18" fill="#ff724c" />
            <circle cx="32" cy="34" r="17" fill="none" stroke="#f4f4f8" strokeWidth="4" />
            <circle cx="32" cy="34" r="8" fill="#fdbf50" />
          </svg>
          Mealplan
        </Link>
      </header>

      <nav className="nav" aria-label="Main">
        {NAV.map(({ href, label, short, icon: Icon }) => (
          <Link key={href} href={href} className="nav-item" aria-current={pathname === href ? "page" : undefined}>
            <span className="nav-icon">
              <Icon aria-hidden="true" />
              {href === "/shopping" && toBuy > 0 && (
                <span className="nav-count">
                  {toBuy}
                  <span className="sr-only"> items still to buy</span>
                </span>
              )}
            </span>
            <span className="nav-label-long">{label}</span>
            <span className="nav-label-short">{short}</span>
          </Link>
        ))}
      </nav>

      <main id="main">
        {children}
        <footer className="colophon">
          Prices and promotions from{" "}
          <a href="https://www.prijsprofeet.nl" target="_blank" rel="noreferrer">
            PrijsProfeet
          </a>
          . They are national prices: check the shelf, and note that some offers need a loyalty card. Photos are
          illustrative, from{" "}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer">
            Unsplash
          </a>
          .
          {load.state === "ready" && !load.usingKey && (
            <>
              {" "}
              Running without an API key; add yours in <Link href="/settings">Settings</Link> for higher limits.
            </>
          )}
        </footer>
      </main>
    </div>
  );
}
