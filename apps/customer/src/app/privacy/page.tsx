import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyNoticePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F0F9FF] font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="relative h-12 w-48 block">
            <Image
              src="/brand/p4p-logo.png"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain object-left"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-papaya px-4 py-2 text-xs font-bold text-jetblack transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Storefront</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12">
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-8 sm:p-12 space-y-8">
          <div className="border-b border-gray-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-papaya/20 px-3 py-1 text-xs font-bold text-caramel">
              <ShieldCheck className="h-4 w-4" />
              <span>POPIA Privacy &amp; Data Protection Notice</span>
            </div>
            <h1 className="text-3xl font-black text-jetblack">Privacy &amp; POPIA Notice</h1>
            <p className="text-xs text-gray-400 font-semibold">
              Protection of Personal Information Act (Act 4 of 2013) — Prepped 4 Prep, Durban, South Africa
            </p>
          </div>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">1. Who We Are</h2>
              <p>
                Prepped 4 Prep (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) supplies back-to-school stationery preparation, book-covering, and custom labeling services to parents and schools in Durban and KwaZulu-Natal, South Africa.
              </p>
              <p>
                <strong>Information Officer Contact:</strong> Reachable at{' '}
                <a href="mailto:admin@prepped4prep.co.za" className="font-bold text-caramel hover:underline">
                  admin@prepped4prep.co.za
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">2. What Personal Information We Collect</h2>
              <p>When you place an order through our website, we collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>About you (the parent/guardian):</strong> Name, email address, contact phone number, delivery address, and a payment transaction reference.
                </li>
                <li>
                  <strong>About your child:</strong> First and last name, school, and grade level. This is provided directly by you, the parent or guardian, and is used solely to prepare and label the correct order for your child.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">3. Why We Collect It</h2>
              <p>We only collect what is needed to fulfil your order:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>To build the correct stationery list for your child&apos;s school and grade.</li>
                <li>To print accurate name labels on your child&apos;s stationery items and box.</li>
                <li>To process payment and generate a receipt/invoice.</li>
                <li>To deliver your order or notify you when your order is ready for collection.</li>
                <li>To send transactional order status updates (order received, packed, dispatched, delivered).</li>
              </ul>
              <p>
                We do not persist raw uploaded photos or PDFs from the Smart List Scanner once parsed, and we never sell or rent your personal information to third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">4. Your Consent</h2>
              <p>
                We ask for your explicit, opt-in consent at checkout before your order is placed and record a timestamp of your consent. You can withdraw consent at any time by contacting us at{' '}
                <a href="mailto:admin@prepped4prep.co.za" className="font-bold text-caramel hover:underline">
                  admin@prepped4prep.co.za
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">5. How We Protect Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>All data sent between your browser and our website is encrypted in transit via HTTPS/TLS.</li>
                <li>Sensitive personal information (phone numbers and delivery addresses) is encrypted at rest using AES-256 encryption.</li>
                <li>Payment card details are handled entirely by PayFast — we never receive or store your card number.</li>
                <li>Access inside our business is strictly role-restricted: warehouse staff packing your order can see your child&apos;s name, school, and item list, but cannot see your home address, phone number, or payment details.</li>
                <li>Every staff action taken on orders and catalogue records is logged in an append-only audit trail.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-jetblack">6. Data Retention &amp; Your Rights Under POPIA</h2>
              <p>
                Order and invoice records are retained for the current academic year plus 5 years to satisfy South African tax and financial record-keeping requirements. Under POPIA, you have the right to request access to, correction of, or deletion of your personal information, or to lodge a complaint with the Information Regulator (<a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="underline">inforegulator.org.za</a>).
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
