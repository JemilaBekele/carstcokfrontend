import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { shopColumns } from './tables/columns'; // Make sure you have columns defined for Shop
import { getAllshop } from '@/service/shop';

type ShopListingPageProps = object;

export default async function ShopListingPage({}: ShopListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;


    // Fetch shops from API
    const { shops, totalCount } = await getAllshop({ page });

    // ─────────────────────────────────────────────
    // Client‑side search filtering by name or branch/location
    // ─────────────────────────────────────────────
    const filteredData = shops.filter((shop) =>
      `${shop.name} `.toLowerCase().includes(search.toLowerCase())
    );

    // ─────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={shopColumns}
      />
    );
  
}
