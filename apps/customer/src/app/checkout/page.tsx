import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';
import { ArrowLeft } from 'lucide-react';
import CheckoutForm from '@/components/CheckoutForm';
import { decryptValue } from '@p4p/shared';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  // 1. Authenticate via Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect anonymous users to login page, mapping them back afterwards
    redirect('/login?redirectTo=/checkout');
  }

  // 2. Fetch Customer details to prefill form
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { id: user.id },
        { email: user.email! }
      ]
    }
  });

  // Self-heal: If user is authenticated in Supabase but profile doesn't exist, create it
  if (!customer) {
    const fullName = user.user_metadata?.full_name || '';
    const parts = fullName.split(' ');
    const firstName = parts[0] || 'Parent';
    const lastName = parts.slice(1).join(' ') || 'User';

    customer = await prisma.customer.create({
      data: {
        id: user.id,
        email: user.email!,
        firstName,
        lastName,
      },
    });
  } else if (customer.id !== user.id) {
    // Align Customer database ID with Supabase Auth ID
    customer = await prisma.customer.update({
      where: { email: user.email! },
      data: { id: user.id },
    });
  }

  const prefilledCustomer = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: decryptValue(customer.phone),
    deliveryAddress: decryptValue(customer.deliveryAddress),
  };

  return (
    <div className="flex min-h-screen flex-col bg-purewhite font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-jetblack">
            <ArrowLeft className="h-4 w-4" />
            Modify Pack Configuration
          </Link>
          <div className="relative h-10 w-40">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        <section className="bg-gradient-to-b from-papaya-light/20 to-white py-10">
          <div className="mx-auto max-w-7xl px-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-jetblack sm:text-4xl">
              Fulfillment & Consent
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Provide your delivery and student information to submit your stationery order.
            </p>
          </div>
        </section>

        {/* Checkout Forms Container */}
        <section className="mx-auto max-w-7xl px-6 mt-6">
          <CheckoutForm prefilledCustomer={prefilledCustomer} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us.</p>
        </div>
      </footer>
    </div>
  );
}
