import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@p4p/db';
import { ArrowLeft } from 'lucide-react';
import TemplateConfigurator from '@/components/TemplateConfigurator';

interface PageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function TemplatePage({ params }: PageProps) {
  const { templateId } = await params;

  // 1. Fetch template with details
  const template = await prisma.schoolTemplate.findUnique({
    where: { id: templateId },
    include: {
      school: true,
      lines: {
        include: {
          product: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });

  if (!template || !template.isActive) {
    notFound();
  }

  // 2. Fetch upsell services
  const bookCoveringService = await prisma.product.findUnique({
    where: { sku: 'SRV-COV-01' },
    select: {
      id: true,
      itemName: true,
      sku: true,
      unitPrice: true,
      brand: true,
    },
  });

  const labelingService = await prisma.product.findUnique({
    where: { sku: 'SRV-LAB-01' },
    select: {
      id: true,
      itemName: true,
      sku: true,
      unitPrice: true,
      brand: true,
    },
  });

  // Safe type conversion for decimal serialization limits in server components
  const serializedTemplate = {
    id: template.id,
    name: template.name,
    gradeLevel: template.gradeLevel,
    academicYear: template.academicYear,
    school: {
      name: template.school.name,
    },
    lines: template.lines.map((line: any) => ({
      id: line.id,
      productId: line.productId,
      quantityRequired: line.quantityRequired,
      isOptional: line.isOptional,
      displayOrder: line.displayOrder,
      product: {
        id: line.product.id,
        itemName: line.product.itemName,
        sku: line.product.sku,
        brand: line.product.brand,
        unitPrice: line.product.unitPrice.toString(),
        category: line.product.category,
      },
    })),
  };

  const serializedBookService = bookCoveringService
    ? {
        id: bookCoveringService.id,
        itemName: bookCoveringService.itemName,
        sku: bookCoveringService.sku,
        unitPrice: bookCoveringService.unitPrice.toString(),
        brand: bookCoveringService.brand,
      }
    : null;

  const serializedLabelService = labelingService
    ? {
        id: labelingService.id,
        itemName: labelingService.itemName,
        sku: labelingService.sku,
        unitPrice: labelingService.unitPrice.toString(),
        brand: labelingService.brand,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-purewhite font-sans text-jetblack">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-jetblack">
            <ArrowLeft className="h-4 w-4" />
            Back to School Selection
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

      {/* Hero Banner */}
      <main className="flex-1 pb-16">
        <section className="bg-gradient-to-b from-papaya-light/20 to-white py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-caramel">
                {serializedTemplate.school.name}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-jetblack sm:text-5xl">
                {serializedTemplate.gradeLevel} Pack Configurator
              </h1>
              <p className="text-sm text-gray-500 max-w-xl">
                Customize your child's stationery list. Uncheck optional items if you already have them at home.
              </p>
            </div>
          </div>
        </section>

        {/* Configuration Layout */}
        <section className="mx-auto max-w-7xl px-6 mt-8">
          <TemplateConfigurator
            template={serializedTemplate}
            bookCoveringService={serializedBookService}
            labelingService={serializedLabelService}
          />
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
