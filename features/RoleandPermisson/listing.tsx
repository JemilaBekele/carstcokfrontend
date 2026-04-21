import { searchParamsCache } from '@/lib/searchparams';
import { getAllRoles } from '@/service/roleService';
import { DataTable } from '@/components/ui/table/data-table';
import { roleColumns } from './tables/columns'; // Adjust to your actual path

export default async function RoleListingPage() {
  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit')) || 10;

  try {
    const { roles, totalCount } = await getAllRoles({ page, limit });

    // Optional client-side filtering (by name or description)
    const filteredData = roles.filter((role) =>
      `${role.name} ${role.description ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={roleColumns}
      />
    );
  } catch (error) {
    return <div className='text-red-500'>Error loading role list.</div>;
  }
}
