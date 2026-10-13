import type { Metadata } from "next";
import RecipesView from "@/components/RecipesView";

export const metadata: Metadata = { title: "Recipes" };

export default function Page() {
  return <RecipesView />;
}
