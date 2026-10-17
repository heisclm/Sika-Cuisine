import type { Metadata, Viewport } from "next";
import { fontSerif, fontSans, fontDisplay } from "./fonts";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sikacuisine.com"),
  title: {
    default: "Sika Cuisine — Culinary Lounge & Fast Doorstep Delivery in Sunyani",
    template: "%s | Sika Cuisine Sunyani",
  },
  description:
    "Order authentic Ghanaian delicacies online in Sunyani, Bono Region. Savor charcoal-grilled whole tilapia with banku, slow-simmered smoky jollof, light soup with fufu, fresh pineapple fruit rice, and stone-baked pizza delivered hot across Sunyani.",
  keywords: [
    "Sika Cuisine",
    "Sunyani restaurant",
    "Ghanaian food delivery Sunyani",
    "Jollof Sunyani",
    "Tilapia Banku Sunyani",
    "Sika Cuisine Lounge",
    "Bono Region food delivery",
    "Fiapre food delivery",
    "UENR campus food",
  ],
  authors: [{ name: "Sika Cuisine Culinary Lounge" }],
  openGraph: {
    title: "Sika Cuisine — Authentic Ghanaian Dining & Delivery in Sunyani",
    description:
      "Savor charcoal-grilled whole tilapia, slow-simmered jollof, silky banku with okro, light soups, and artisan pizza delivered hot across Sunyani.",
    url: "https://sikacuisine.com",
    siteName: "Sika Cuisine",
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sika Cuisine — Sunyani, Ghana",
    description:
      "Authentic Ghanaian culinary gastronomy and lounge dining in Sunyani, Bono Region.",
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
        <ToastProvider>
          <CartProvider>
            <Navbar />
            <FlyingCartAnimation />
            <CartDrawer />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
