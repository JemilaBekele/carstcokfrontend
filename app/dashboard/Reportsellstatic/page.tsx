import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { SalesReportsDataTable } from '@/features/Dasboard/ReportSell/staticgenerate';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Reports'
};

export default async function SellPage() {
  return (
    <PermissionGuard requiredPermission={PERMISSIONS.REPORT.VIEW_SALES_RANK.name}>
      <PageContainer scrollable={true}>
        <div className='flex-1 space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <SalesReportsDataTable />
          </Suspense>
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
