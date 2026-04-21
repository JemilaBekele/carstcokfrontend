import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { storeColumns } from './tables/columns'; // Make sure you have columns defined for Shop
import { getAllstore } from '@/service/store';

type ShopListingPageProps = object;

export default async function StoreListingPage({}: ShopListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch shops from API
    const { stores, totalCount } = await getAllstore({ page });

    // ─────────────────────────────────────────────
    // Client‑side search filtering by name or branch/location
    // ─────────────────────────────────────────────
    const filteredData = stores.filter((shop) =>
      `${shop.name} `.toLowerCase().includes(search.toLowerCase())
    );

    // ─────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={storeColumns}
      />
    );
  } catch  {
    return <div>Error loading shops list.</div>;
  }
}
