import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import BrandsListingPage from '@/features/Inventory/brand/listing';
import BrandModal from '@/features/Inventory/brand/view-page';

export const metadata = {
  title: 'Dashboard: Brand'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-col flex-1 space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Brands'
            description='Manage brand information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.CATEGORY.CREATE.name}
          >
            <BrandModal />
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          {' '}
          <UserTableAction />
          <BrandsListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
