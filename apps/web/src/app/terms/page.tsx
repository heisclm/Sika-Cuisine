import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service governing online food ordering, pickup, Paystack payments, and Sunyani doorstep delivery at Sika Cuisine Restaurant.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border-subtle bg-surface-300 py-16 sm:py-20 text-center relative">
        <div className="mx-auto max-w-3xl px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2 block">
            Legal & Customer Policies
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-white">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-gray-300 font-light">
            Effective Date: October 2026 &bull; Sika Cuisine Restaurant, Sunyani, Bono Region, Ghana
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-sm text-gray-300 leading-relaxed font-light">
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-10 space-y-6">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-brand-red" />
              <span>1. Introduction & Acceptance of Terms</span>
            </h2>
            <p>
              Welcome to Sika Cuisine Restaurant. By accessing our website, browsing our menu, or submitting an order for collection or delivery within Sunyani and surrounding localities, you agree to be bound by these Terms of Service and all applicable laws of the Republic of Ghana.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-red" />
              <span>2. Ordering & Server-Authoritative Pricing</span>
            </h2>
            <p>
              All prices displayed on Sika Cuisine are quoted in Ghana Cedis (GH₵) and calculated securely using integer pesewas. Menu availability and pricing remain subject to change at the discretion of restaurant management. In the event of a technical discrepancy, the authoritative prices stored on the restaurant server shall govern.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-red" />
              <span>3. Online Payments via Paystack</span>
            </h2>
            <p>
              Online payments are securely processed by Paystack Ghana, supporting MTN Mobile Money, Telecel Cash, AT Money, and major debit/credit cards. We do not store sensitive cardholder details or mobile money PINs on our servers. An order is confirmed for preparation only once payment is verified or when authorized as Cash on Delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-red" />
              <span>4. Sunyani Delivery & Collection Policy</span>
            </h2>
            <p>
              Deliveries are dispatched across designated Sunyani delivery zones (including Fiapre, UENR Campus, Berlin Top, Kotokrom, and Sunyani Central). Delivery times (typically 25–45 minutes) are estimates influenced by kitchen load and traffic. Customers must provide an accurate phone number and delivery location. If our dispatch rider cannot reach the recipient after reasonable attempts, the order may be returned to the kitchen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-red" />
              <span>5. Cancellations & Refunds</span>
            </h2>
            <p>
              Because our food is freshly cooked and perishable, orders cannot be cancelled once cooking has commenced in the kitchen. In the rare event of an incorrect or unfulfilled order, please contact our dispatch supervisor immediately via WhatsApp at <strong className="text-white">0533376760</strong> for prompt resolution or replacement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-red" />
              <span>6. Contact Information</span>
            </h2>
            <p>
              For legal inquiries or operational questions regarding these Terms, contact us directly at <strong className="text-white">orders@sikacuisine.com</strong> or call <strong className="text-white">0533376760 / 0554406681</strong>.
            </p>
          </section>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
