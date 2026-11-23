import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Sunyani Location",
  description:
    "Visit or contact Sika Cuisine on Commercial Street, Sunyani Central, Bono Region. Direct telephone, WhatsApp hospitality desk, and daily operating hours.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
