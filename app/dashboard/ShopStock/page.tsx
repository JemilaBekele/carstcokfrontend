import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { PagePermissionGuard } from '@/components/PagePermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';
import ShopStockListingPage from '@/features/Inventory/ShopStocks/listing';

export const metadata = {
  title: 'Dashboard: Shop Stock'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function StorePage(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PagePermissionGuard requiredPermission={PERMISSIONS.SHOP.VIEW_ALL.name}>
      <PageContainer scrollable={false}>
        <div className='flex flex-1 flex-col space-y-4'>
          <div className='flex items-start justify-between'>
            <Heading
              title='Shop Stock'
              description='Manage all shop stock records, including quantities, stores, and related details'
            />
          </div>
          <Separator />
          <ItemTableAction />
          <Suspense
            fallback={
              <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
            }
          >
            <ShopStockListingPage />
          </Suspense>
        </div>
      </PageContainer>
    </PagePermissionGuard>
  );
}
