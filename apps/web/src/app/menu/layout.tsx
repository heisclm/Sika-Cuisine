import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Menu & Prices",
  description:
    "Browse fresh Sika Cuisine Ghanaian dishes in Sunyani — charcoal-grilled whole tilapia & banku, smoky party jollof, pounded fufu with light soup, pineapple fried rice, and stone-baked pizza.",
  alternates: {
    canonical: "/menu",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
