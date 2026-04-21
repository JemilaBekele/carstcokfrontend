import { searchParamsCache } from '@/lib/searchparams';
import { getAllCategories } from '@/service/Category';
import { categoryColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';

type CategoriesListingPageProps = object;

export default async function CategoriesListingPage({}: CategoriesListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch data from API
    const { categories, totalCount } = await getAllCategories({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter
    // ────────────────────────────────────────────────────────────────
    const filteredData = categories.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ────────────────────────────────────────────────────────────────
    // Client-side pagination
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={categoryColumns}
      />
    );
  } catch  {
    return (
      <div className='p-4 text-red-500'>
        Error loading categories. Please try again later.
      </div>
    );
  }
}
