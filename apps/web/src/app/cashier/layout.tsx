import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashier & Dispatch Desk",
  robots: { index: false, follow: false },
};

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return children;
}
