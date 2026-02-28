// features/Inventory/Products/listing.tsx
import { searchParamsCache } from '@/lib/searchparams';
import { productColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { IProduct } from '@/models/Product';
import { getAllProductsallsell } from '@/service/MissingStockLedger';

type ProductsListingPageProps = object;

export default async function SellProductsListingPage({}: ProductsListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  let products: IProduct[] = [];
  let totalCount = 0;
  let error: unknown = null;

  try {
    const result = await getAllProductsallsell({ page, limit });
    products = result.products;
    totalCount = result.totalCount;
  } catch (err) {
    console.error('Error loading products:', err);
    error = err;
  }

  if (error) {
    return (
      <div className='p-4 text-red-500'>
        Error loading products. Please try again later.
      </div>
    );
  }

  const filteredData = products.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.generic?.toLowerCase().includes(searchLower) ||
      item.productCode?.toLowerCase().includes(searchLower) 
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div>
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={productColumns}
      />
    </div>
  );
}