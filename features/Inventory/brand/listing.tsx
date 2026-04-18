"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IBrand } from "@/models/brand";
import { getAllBrands } from "@/service/brand";
import { brandColumns } from "./tables/columns";

type BrandsListingPageProps = object;

export default function BrandsListingPage({}: BrandsListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBrands = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllBrands({ page, limit });

        if (cancelled) {
          return;
        }

        setBrands(response.brands || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading brands. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const filteredData = brands.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()),
  );

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
}
