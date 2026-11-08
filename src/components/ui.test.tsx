// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { RetailerBadge } from "./ui";

afterEach(cleanup);

function badge(retailer: string) {
  const { container } = render(<RetailerBadge retailer={retailer} />);
  return container.querySelector(".retailer-badge") as HTMLElement;
}

describe("RetailerBadge", () => {
  test("RFC-2026-007:AC-1 Albert Heijn, Jumbo and Plus each show their own logo instead of a letter", () => {
    // Vite inlines small assets as data URIs in tests, so compare sources rather than file names.
    const sources = ["albert_heijn", "jumbo", "plus"].map((retailer) => {
      const el = badge(retailer);
      expect(el.textContent).toBe("");
      const src = el.querySelector("img")?.getAttribute("src");
      expect(src).toBeTruthy();
      return src;
    });
    expect(new Set(sources).size).toBe(3);
  });

  test("RFC-2026-007:AC-2 other stores keep the letter and no image", () => {
    const el = badge("lidl");
    expect(el.textContent).toBe("L");
    expect(el.querySelector("img")).toBeNull();
  });

  test("RFC-2026-007:AC-3 an unknown store shows a question mark and no image", () => {
    const el = badge("nope");
    expect(el.textContent).toBe("?");
    expect(el.querySelector("img")).toBeNull();
  });

  test("RFC-2026-007:AC-4 a logo badge stays hidden from assistive technology", () => {
    const el = badge("albert_heijn");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector("img")!.getAttribute("alt")).toBe("");
  });

  test("RFC-2026-007:AC-5 the Jumbo badge is the wide variant for its wordmark", () => {
    expect(badge("jumbo").classList.contains("wide")).toBe(true);
    expect(badge("albert_heijn").classList.contains("wide")).toBe(false);
    expect(badge("plus").classList.contains("wide")).toBe(false);
  });
});
