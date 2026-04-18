"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ISupplier } from "@/models/supplier";
import { getAllSuppliers } from "@/service/supplier";
import { supplierColumns } from "./tables/columns";

type SuppliersListingPageProps = object;

export default function SuppliersListingPage({}: SuppliersListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllSuppliers({ page, limit });

        if (cancelled) {
          return;
        }

        setSuppliers(response.suppliers || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading suppliers. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuppliers();

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

  const filteredData = suppliers.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={supplierColumns}
    />
  );
}
