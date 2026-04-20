

import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import SupplierPurchaseDetailPage from '@/features/supplier/detail';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Perchase detail page'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>; // Update to reflect searchParams as a Promise
};

export default async function LeasePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <SupplierPurchaseDetailPage supplierId={resolvedSearchParams.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
