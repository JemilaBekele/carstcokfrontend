"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IPurchase } from "@/models/purchase";
import { getAllPurchases } from "@/service/purchase";
import { purchaseColumns } from "./tables/columns";

type PurchaseListingPageProps = object;

export default function PurchaseListingPage({}: PurchaseListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPurchases = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllPurchases({ page, limit });

        if (cancelled) {
          return;
        }

        setPurchases(response.purchases || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading purchases.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPurchases();

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

  const filteredData = purchases.filter((item) =>
    item?.supplier?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={purchaseColumns}
    />
  );
}
