import type { Metadata, Viewport } from "next";
import { fontSerif, fontSans, fontDisplay } from "./fonts";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { PublicConfigProvider } from "@/context/PublicConfigContext";
import { ToastProvider } from "@/context/ToastContext";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingMobileCartBar } from "@/components/cart/FloatingMobileCartBar";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";
import { getSiteOrigin } from "@/lib/env";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { SikaPalette } from "@sika/shared";

const SITE_ORIGIN = getSiteOrigin();

export const viewport: Viewport = {
  themeColor: SikaPalette.deepBlack,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Sika Cuisine — Sunyani Dining & Delivery",
    template: "%s | Sika Cuisine Sunyani",
  },
  description:
    "Order authentic Ghanaian delicacies online in Sunyani, Bono Region. Charcoal-grilled whole tilapia with banku, smoky jollof rice, pounded fufu with light soup, fresh fruit rice, and stone-baked pizza.",
  keywords: [
    "Sika Cuisine",
    "Sunyani restaurant",
    "Ghanaian food delivery Sunyani",
    "Jollof Sunyani",
    "Tilapia Banku Sunyani",
    "Bono Region food delivery",
    "Fiapre food delivery",
    "UENR campus food",
  ],
  authors: [{ name: "Sika Cuisine Restaurant" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Sika Cuisine — Authentic Ghanaian Dining & Delivery in Sunyani",
    description:
      "Charcoal-grilled whole tilapia, slow-simmered jollof, silky banku with okro, light soups, and stone-baked pizza prepared fresh in Sunyani.",
    url: SITE_ORIGIN,
    siteName: "Sika Cuisine",
    locale: "en_GH",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sika Cuisine — Authentic Ghanaian Dining & Delivery in Sunyani",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sika Cuisine — Sunyani, Ghana",
    description:
      "Authentic Ghanaian dining, pickup, and doorstep delivery in Sunyani, Bono Region.",
    images: ["/opengraph-image"],
  },
};

const RESTAURANT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: RESTAURANT_INFO.brandName,
  url: SITE_ORIGIN,
  telephone: RESTAURANT_INFO.primaryPhoneIntl,
  image: `${SITE_ORIGIN}/opengraph-image`,
  logo: `${SITE_ORIGIN}/images/logo.png`,
  hasMenu: `${SITE_ORIGIN}/menu`,
  servesCuisine: ["Ghanaian", "West African", "Charcoal Grill", "Pizza"],
  priceRange: "GH₵",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Commercial Street, Sunyani Central",
    addressLocality: "Sunyani",
    addressRegion: "Bono Region",
    addressCountry: "GH",
  },
  areaServed: [
    "Sunyani Central",
    "Fiapre",
    "UENR",
    "Berlin Top",
    "Abesim",
    "Penkwase",
    "New Dormaa",
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "10:00",
      closes: "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "12:00",
      closes: "21:00",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontDisplay.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-red selection:text-white flex flex-col justify-between">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(RESTAURANT_JSON_LD) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:rounded-lg focus:bg-[#D71920] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>
        <MotionProvider>
          <ToastProvider>
            <PublicConfigProvider>
              <CartProvider>
                <ScrollToTop />
                <Navbar />
                <FlyingCartAnimation />
                <CartDrawer />
                <FloatingMobileCartBar />
                <main id="main-content" className="flex-1 w-full">
                  {children}
                </main>
                <Footer />
              </CartProvider>
            </PublicConfigProvider>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
