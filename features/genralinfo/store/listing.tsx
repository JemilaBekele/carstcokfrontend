"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IStore } from "@/models/store";
import { getAllstore } from "@/service/store";
import { storeColumns } from "./tables/columns";

type StoreListingPageProps = object;

export default function StoreListingPage({}: StoreListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [stores, setStores] = useState<IStore[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllstore({ page, limit });

        if (cancelled) {
          return;
        }

        setStores(response.stores || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading stores list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStores();

    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredData = stores.filter((store) =>
    `${store.name} `.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={storeColumns}
    />
  );
}
