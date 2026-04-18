"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IStockCorrection } from "@/models/StockCorrection";
import { getAllStockCorrections } from "@/service/StockCorrection";
import { stockCorrectionColumns } from "./tables/columns";

type StockCorrectionsListingPageProps = object;

export default function StockCorrectionsListingPage(
  {}: StockCorrectionsListingPageProps,
) {
  const { page, search, limit } = useTableQueryParams();
  const [stockCorrections, setStockCorrections] = useState<IStockCorrection[]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStockCorrections = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllStockCorrections({ page, limit });

        if (cancelled) {
          return;
        }

        setStockCorrections((response.data as IStockCorrection[]) || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading stock corrections. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStockCorrections();

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

  const filteredData = stockCorrections.filter(
    (item) =>
      item.reference?.toLowerCase().includes(search.toLowerCase()) ||
      item.reason?.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={stockCorrectionColumns}
    />
  );
}
