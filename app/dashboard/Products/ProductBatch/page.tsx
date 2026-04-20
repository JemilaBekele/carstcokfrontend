import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ProductStockForm from '@/features/Inventory/Products/addinitial';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Product Batch'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ProductPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;

  return (
    <PageContainer scrollable={true}>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          {id ? <ProductStockForm productId={id} /> : <FormCardSkeleton />}
        </Suspense>
      </div>
    </PageContainer>
  );
}
