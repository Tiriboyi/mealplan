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
  test.each([
    ["albert_heijn", "Albert_Heijn_Logo"],
    ["jumbo", "Jumbo_Logo"],
    ["plus", "plus-supermarkt-logo"],
  ])("RFC-2026-007:AC-1 %s shows its logo instead of a letter", (retailer, file) => {
    const el = badge(retailer);
    const img = el.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain(file);
    expect(el.textContent).toBe("");
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
