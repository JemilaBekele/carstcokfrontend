"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IStoreStock } from "@/models/store";
import { getAllStoreStocks } from "@/service/store";
import { storeStockColumns } from "./cloumn";

type StoreStockListingPageProps = object;

export default function StoreStockListingPage(
  {}: StoreStockListingPageProps,
) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [storeStocks, setStoreStocks] = useState<IStoreStock[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStoreStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllStoreStocks({
          page,
          limit,
          startDate,
          endDate,
        });

        if (cancelled) {
          return;
        }

        setStoreStocks(response.data || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading store stock records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStoreStocks();

    return () => {
      cancelled = true;
    };
  }, [endDate, limit, page, startDate]);

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredData = storeStocks.filter((item) => {
    const searchTerm = search.toLowerCase();
    const batchId = item?.batch?.batchNumber?.toLowerCase() || "";
    const storeName = item?.store?.name?.toLowerCase() || "";
    const status = item?.status?.toLowerCase() || "";

    return (
      batchId.includes(searchTerm) ||
      storeName.includes(searchTerm) ||
      status.includes(searchTerm)
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={storeStockColumns}
    />
  );
}
