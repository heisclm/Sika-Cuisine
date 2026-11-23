import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access",
  robots: { index: false, follow: false },
};

export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
