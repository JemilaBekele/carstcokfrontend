/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { ProductSearch } from '@/features/Shop/list';
import { getCategories } from '@/service/Category';
import { getBrands } from '@/service/brand';
import { TopProducts } from '@/service/Product';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get('searchTerm') || '';
  const categoryName = searchParams?.get('categoryName') || '';
  const brandName = searchParams?.get('brandName') || '';
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add ref to track if initial fetch has happened
  const hasFetched = useRef(false);
  // Add ref to store previous params to compare
  const prevParams = useRef({ searchTerm, categoryName, brandName });

  useEffect(() => {
    // Skip if params haven't changed and we've already fetched
    const currentParams = { searchTerm, categoryName, brandName };
    const paramsChanged = 
      prevParams.current.searchTerm !== currentParams.searchTerm ||
      prevParams.current.categoryName !== currentParams.categoryName ||
      prevParams.current.brandName !== currentParams.brandName;
    
    // Only fetch if params changed or it's the first load
    if (!paramsChanged && hasFetched.current) {
      return;
    }
    
    // Update previous params
    prevParams.current = currentParams;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData, brandsData] = await Promise.all([
          TopProducts({
            searchTerm: searchTerm || undefined,
            categoryName: categoryName || undefined,
            brandName: brandName || undefined,
          }),
          getCategories(),
          getBrands(),
        ]);
console.log("product",productsData)
        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    };

    fetchData();
  }, [searchTerm, categoryName, brandName]); // Keep dependencies

  if (loading && !hasFetched.current) {
    return (
      <PageContainer scrollable>
        <div className='flex-1 space-y-4'>
          <FormCardSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
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
  );
}