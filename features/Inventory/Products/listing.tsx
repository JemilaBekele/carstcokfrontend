"use client";

import { useEffect, useState } from "react";
import ExportButtons from "@/components/export-button";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IProduct } from "@/models/Product";
import { getAllProducts } from "@/service/Product";
import { productColumns } from "./tables/columns";

type ProductsListingPageProps = object;

export default function ProductsListingPage({}: ProductsListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllProducts({ page, limit });

        if (cancelled) {
          return;
        }

        setProducts(response.products || []);
        setTotalCount(response.totalCount || 0);
      } catch (loadError) {
        console.error("Error loading products:", loadError);

        if (!cancelled) {
          setError("Error loading products. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
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
      <ExportButtons data={filteredData} />
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={productColumns}
      />
    </div>
  );
}
