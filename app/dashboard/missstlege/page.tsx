import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import StockLedgerReconciliationPage from '@/features/Missingstockleger/missstockleger';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Stock Ledger Reconciliation'
};

export default async function MissingStockPage() {
  return (
    <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.VIEW_ALL.name}>
      <PageContainer scrollable={false}>
        <div className='flex-1 space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <StockLedgerReconciliationPage />
          </Suspense>
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
