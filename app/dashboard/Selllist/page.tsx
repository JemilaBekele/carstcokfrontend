import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { SellsDataTable } from '@/features/Dasboard/ReportSell/sellreport';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Reports'
};

export default async function SellPage() {
  return (
    <PermissionGuard requiredPermission={PERMISSIONS.REPORT.VIEW_ALL_TRENDS.name}>
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <SellsDataTable />
          </Suspense>
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
