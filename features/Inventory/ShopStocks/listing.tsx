"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IShopStock } from "@/models/store";
import { getAllShopStocks } from "@/service/store";
import { shopStockColumns } from "./cloumn";

type ShopStockListingPageProps = object;

export default function ShopStockListingPage({}: ShopStockListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [shopStocks, setShopStocks] = useState<IShopStock[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadShopStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllShopStocks({
          page,
          limit,
          startDate,
          endDate,
        });

        if (cancelled) {
          return;
        }

        setShopStocks(response.data || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading shop stock records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadShopStocks();

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

  const filteredData = shopStocks.filter((item) => {
    const searchTerm = search.toLowerCase();
    const shopName = item?.shop?.name?.toLowerCase() || "";
    const batchName = item?.batch?.batchNumber?.toLowerCase() || "";
    const status = item?.status?.toLowerCase() || "";

    return (
      shopName.includes(searchTerm) ||
      batchName.includes(searchTerm) ||
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
      columns={shopStockColumns}
    />
  );
}
