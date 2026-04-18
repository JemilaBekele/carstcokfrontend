"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IStockLedger } from "@/models/store";
import { getAllStockLedgers } from "@/service/store";
import { stockLedgerColumns } from "./cloumn";

type StockLedgerListingPageProps = object;

export default function StockLedgerListingPage(
  {}: StockLedgerListingPageProps,
) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [stockLedgers, setStockLedgers] = useState<IStockLedger[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStockLedgers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllStockLedgers({
          page,
          limit,
          startDate,
          endDate,
        });

        if (cancelled) {
          return;
        }

        setStockLedgers(response.data || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading stock ledger records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStockLedgers();

    return () => {
      cancelled = true;
    };
  }, [endDate, limit, page, startDate]);

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredData = stockLedgers.filter((item) => {
    const searchTerm = search.toLowerCase();
    const movementType = item?.movementType?.toLowerCase() || "";
    const reference = item?.reference?.toLowerCase() || "";
    const notes = item?.notes?.toLowerCase() || "";
    const storeName = item?.store?.name?.toLowerCase() || "";
    const shopName = item?.shop?.name?.toLowerCase() || "";
    const userName = item?.user?.name?.toLowerCase() || "";

    return (
      movementType.includes(searchTerm) ||
      reference.includes(searchTerm) ||
      notes.includes(searchTerm) ||
      storeName.includes(searchTerm) ||
      shopName.includes(searchTerm) ||
      userName.includes(searchTerm)
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={stockLedgerColumns}
    />
  );
}
