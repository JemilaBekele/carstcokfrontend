import { searchParamsCache } from '@/lib/searchparams';
import { getAllbranches } from '@/service/branch';
import { DataTable } from '@/components/ui/table/data-table';
import { branchColumns } from './tables/columns'; // Adjust path to your branch columns

type BranchListingPageProps = object;

export default async function BranchListingPage({}: BranchListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;


    // Fetch branches from API
    const { branches, totalCount } = await getAllbranches({
      page,
      limit
    });

    // ─────────────────────────────────────────────
    // Client-side search filtering by name
    // ─────────────────────────────────────────────
    const filteredData = branches.filter((branch) =>
      branch.name.toLowerCase().includes(search.toLowerCase())
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
        columns={branchColumns}
      />
    );
 
}
