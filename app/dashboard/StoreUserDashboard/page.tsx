import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import StoreUserDashboard from '@/features/Dasboard/ReportSell/storesales';
import { PagePermissionGuard } from '@/components/PagePermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Reports'
};

export default async function SellPage() {
  return (
    <PagePermissionGuard requiredPermission={PERMISSIONS.DASHBOARDS.VIEW_SELL_DASHBOARD.name}>
      <PageContainer scrollable={true}>
        <div className='flex-1 space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <StoreUserDashboard />
          </Suspense>
        </div>
      </PageContainer>
    </PagePermissionGuard>
  );
}
