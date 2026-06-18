import Link from 'next/link';
import Image from 'next/image';
import { XCircle, ArrowLeft } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-150 bg-white">
        <div className="mx-auto flex max-w-7xl justify-center px-6 py-4">
          <div className="relative h-12 w-48">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl max-w-md w-full space-y-4">
          <XCircle className="h-16 w-16 text-vermillion mx-auto" />
          <h1 className="text-2xl font-black text-gray-900">Payment Cancelled</h1>
          <p className="text-sm text-gray-500">
            The transaction was cancelled and no payment was processed. If you encountered an issue, feel free to try checking out again.
          </p>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-jetblack py-3.5 px-4 font-bold text-white transition-all hover:bg-caramel hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to School Selection</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-150 py-6 bg-white">
        <div className="text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us.</p>
        </div>
      </footer>
    </div>
  );
}
