import MobileScannerClient from './MobileScannerClient';

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function MobileScannerPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  return <MobileScannerClient orderId={orderId} />;
}
