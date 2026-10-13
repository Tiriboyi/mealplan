import type { MetadataRoute } from "next";

// Lets the site be installed to a phone's home screen until there is a native app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mealplan",
    short_name: "Mealplan",
    description: "Weekly dinners from this week's supermarket promotions.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#1f6f4a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
