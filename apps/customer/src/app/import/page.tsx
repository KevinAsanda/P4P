import { prisma } from '@p4p/db';
import ListImporterClient from './ListImporterClient';

export const dynamic = 'force-dynamic';

export default async function ListImportPage() {
  // Fetch schools to help the user match templates
  const schools = await prisma.school.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  // Fetch product catalog to map matching items, substitutions, and upsells on-screen
  const products = await prisma.product.findMany();
  const formattedProducts = products.map((p) => ({
    id: p.id,
    itemName: p.itemName,
    brand: p.brand || 'Generic',
    sku: p.sku,
    unitPrice: p.unitPrice.toNumber(),
    category: p.category,
  }));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <ListImporterClient schools={schools} catalog={formattedProducts} />
    </div>
  );
}
