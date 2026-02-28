import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import StockLedgerReconciliationPage from '@/features/Missingstockleger/missstockleger';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Reports'
};

export default async function SellPage() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <StockLedgerReconciliationPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
