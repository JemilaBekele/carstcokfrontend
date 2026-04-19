import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import SellTrendChart from '@/features/Dasboard/ReportSell/chart';
import { PagePermissionGuard } from '@/components/PagePermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Reports'
};

export default async function SellPage() {
  return (
    <PagePermissionGuard requiredPermission={PERMISSIONS.REPORT.VIEW_ALL_TRENDS.name}>
      <PageContainer scrollable={false}>
        <div className='flex-1 space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <SellTrendChart />
          </Suspense>
        </div>
      </PageContainer>
    </PagePermissionGuard>
  );
}
