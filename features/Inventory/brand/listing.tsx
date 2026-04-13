/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { getAllBrands } from '@/service/brand';
import { brandColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';

type BrandsListingPageProps = object;

export default async function BrandsListingPage({}: BrandsListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch data from API
    const { brands, totalCount } = await getAllBrands({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter
    // ────────────────────────────────────────────────────────────────
    const filteredData = brands.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ────────────────────────────────────────────────────────────────
    // Client-side pagination
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={brandColumns}
      />
    );
  } catch {
    return (
      <div className='p-4 text-red-500'>
        Error loading brands. Please try again later.
      </div>
    );
  }
}