import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Rider Dispatch",
  robots: { index: false, follow: false },
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
