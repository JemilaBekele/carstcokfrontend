"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ICategory } from "@/models/Category";
import { getAllCategories } from "@/service/Category";
import { categoryColumns } from "./tables/columns";

type CategoriesListingPageProps = object;

export default function CategoriesListingPage({}: CategoriesListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllCategories({ page, limit });

        if (cancelled) {
          return;
        }

        setCategories(response.categories || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading categories. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();

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

  const filteredData = categories.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={categoryColumns}
    />
  );
}
