import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border-subtle bg-surface-300 py-16 sm:py-20 text-center relative">
        <div className="mx-auto max-w-3xl px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2 block">
            Data Protection & Privacy
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-white">
            Privacy Policy
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
              <ShieldCheck className="h-5 w-5 text-brand-red" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              To process your food orders and coordinate swift delivery in Sunyani, Sika Cuisine collects the following personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
              <li><strong className="text-white">Contact Information:</strong> Full name, Ghanaian phone number, and email address.</li>
              <li><strong className="text-white">Delivery Data:</strong> Street address, locality/zone (e.g. Fiapre, UENR, Berlin Top), and landmark notes.</li>
              <li><strong className="text-white">Order Details:</strong> Items purchased, dish customization options, dietary instructions, and total amounts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-brand-red" />
              <span>2. How Your Information Is Used</span>
            </h2>
            <p>
              We use your data solely for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
              <li>Transmitting order tickets to our Sunyani kitchen staff for cooking and packaging.</li>
              <li>Enabling our dispatch couriers to navigate to your exact delivery location.</li>
              <li>Sending SMS or email transaction receipts and order status updates.</li>
              <li>Preventing fraudulent orders and duplicate payment charges.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand-red" />
              <span>3. Payment Data Security</span>
            </h2>
            <p>
              All online payment processing is handled by <strong className="text-white">Paystack</strong>, a PCI-DSS certified payment service provider. Sika Cuisine never sees, stores, or handles full credit/debit card numbers or Mobile Money PINs. Payment authorizations occur directly through Paystack&apos;s encrypted gateways.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-red" />
              <span>4. Data Retention & Sharing</span>
            </h2>
            <p>
              We do not sell, rent, or trade your personal data to third parties. Customer details are only shared with our internal kitchen operators and delivery personnel to complete your delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-red" />
              <span>5. Contacting the Data Officer</span>
            </h2>
            <p>
              If you wish to update or delete your customer account information, reach out to us at <strong className="text-white">privacy@sikacuisine.com</strong> or WhatsApp <strong className="text-white">0533376760</strong>.
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
