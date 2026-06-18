import Image from 'next/image';
import Link from 'next/link';
import AuthView from '@/components/AuthView';

interface PageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-jetblack">
      {/* Mini Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl justify-center px-6 py-4">
          <Link href="/">
            <div className="relative h-12 w-48">
              <Image
                src="/brand/logo-wordmark.svg"
                alt="PREPPED 4 PREP Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-jetblack">
              Welcome to Prepped 4 Prep
            </h1>
            <p className="text-sm text-gray-500">
              Sign in or create a parent account to proceed with your stationery packs.
            </p>
          </div>
          <AuthView redirectTo={redirectTo} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-150 py-6">
        <div className="text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Prepped 4 Prep. Avoid the fuss, trust us.</p>
        </div>
      </footer>
    </div>
  );
}
