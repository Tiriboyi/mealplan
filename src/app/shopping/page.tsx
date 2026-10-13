import type { Metadata } from "next";
import ShoppingView from "@/components/ShoppingView";

export const metadata: Metadata = { title: "Shopping list" };

export default function Page() {
  return <ShoppingView />;
}
