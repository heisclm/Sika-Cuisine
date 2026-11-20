import type { Metadata, Viewport } from "next";
import { fontSerif, fontSans, fontDisplay } from "./fonts";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";
import { SikaPalette } from "@sika/shared";

export const viewport: Viewport = {
  themeColor: SikaPalette.deepBlack,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sikacuisine.com"),
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
  openGraph: {
    title: "Sika Cuisine — Authentic Ghanaian Dining & Delivery in Sunyani",
    description:
      "Charcoal-grilled whole tilapia, slow-simmered jollof, silky banku with okro, light soups, and stone-baked pizza prepared fresh in Sunyani.",
    url: "https://sikacuisine.com",
    siteName: "Sika Cuisine",
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sika Cuisine — Sunyani, Ghana",
    description: "Authentic Ghanaian dining, pickup, and doorstep delivery in Sunyani, Bono Region.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontDisplay.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-red selection:text-white flex flex-col justify-between">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:rounded-lg focus:bg-[#D71920] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>
        <MotionProvider>
          <ToastProvider>
            <CartProvider>
              <ScrollToTop />
              <Navbar />
              <FlyingCartAnimation />
              <CartDrawer />
              <main id="main-content" className="flex-1 w-full">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
