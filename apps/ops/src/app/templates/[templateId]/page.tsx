import { prisma } from '@p4p/db';
import { getAuthContext } from '@/lib/auth-utils';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert } from 'lucide-react';
import TemplateEditorClient from './TemplateEditorClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({ params }: PageProps) {
  const { templateId } = await params;
  const { activeRole, isActualAdmin, userEmail } = await getAuthContext();

  if (activeRole !== 'admin') {
    return (
      <DashboardLayout activeRole={activeRole} isActualAdmin={isActualAdmin} userEmail={userEmail}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view or edit school templates. Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

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

  if (!template) {
    notFound();
  }

  const products = await prisma.product.findMany({
    orderBy: {
      itemName: 'asc',
    },
  });

  return (
    <DashboardLayout activeRole={activeRole}>
      <TemplateEditorClient template={template as any} products={products as any} />
    </DashboardLayout>
  );
}
