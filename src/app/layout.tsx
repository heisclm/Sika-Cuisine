import type { Metadata } from "next";
import { fontSerif, fontSans } from "./fonts";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";

export const metadata: Metadata = {
  title: "Sika Cuisine — Premium Ghanaian Dining & Fast Delivery in Sunyani",
  description:
    "Order exquisite Ghanaian cuisine online in Sunyani, Bono Region. Savor authentic Jollof, Kelewele, Waakye, Grilled Tilapia, and refreshing local beverages delivered to your doorstep.",
  keywords: [
    "Sika Cuisine",
    "Sunyani restaurant",
    "Ghanaian food delivery Sunyani",
    "Jollof Sunyani",
    "Waakye Fiapre",
    "Bono Region food delivery",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-red selection:text-white flex flex-col justify-between">
        <CartProvider>
          <Navbar />
          <FlyingCartAnimation />
          <CartDrawer />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
