/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { PagePermissionGuard } from '@/components/PagePermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { ProductSearch } from '@/features/Shop/list';
import { getCategories } from '@/service/Category';
import { getBrands } from '@/service/brand';
import { TopProducts } from '@/service/Product';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get('searchTerm') || '';
  const categoryName = searchParams?.get('categoryName') || '';
  const brandName = searchParams?.get('brandName') || ''; // Changed from subCategoryName to brandName

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, brandsData] = await Promise.all([
          TopProducts({
            searchTerm: searchTerm || undefined,
            categoryName: categoryName || undefined,
            brandName: brandName || undefined, // Added brandName
          }),
          getCategories(),
          getBrands(), // Fetch brands
        ]);

        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, categoryName, brandName]); // Updated dependencies (removed subCategoryName, added brandName)

  if (loading) {
    return (
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <FormCardSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PagePermissionGuard requiredPermission={PERMISSIONS.SELL.CREATE.name}>
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <ProductSearch
            products={products}
            categories={categories}
            brands={brands}
            initialSearchTerm={searchTerm}
            initialCategoryName={categoryName}
            initialBrandName={brandName}
          />
        </div>
      </PageContainer>
    </PagePermissionGuard>
  );
}