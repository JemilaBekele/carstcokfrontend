import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import CompaniesPage from '@/features/Campany/all';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Company'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PermissionGuard requiredPermission={PERMISSIONS.COMPANY.VIEW_ALL.name}>
      <PageContainer scrollable={false}>
        <div className='flex flex-1 flex-col space-y-4'>
          <div className='flex items-start justify-between' />
          <Separator />
          <Suspense
            fallback={
              <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
            }
          >
            <CompaniesPage />
          </Suspense>
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
