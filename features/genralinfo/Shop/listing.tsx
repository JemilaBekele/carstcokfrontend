"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IShop } from "@/models/shop";
import { getAllshop } from "@/service/shop";
import { shopColumns } from "./tables/columns";

type ShopListingPageProps = object;

export default function ShopListingPage({}: ShopListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [shops, setShops] = useState<IShop[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadShops = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllshop({ page, limit });

        if (cancelled) {
          return;
        }

        setShops(response.shops || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading shops. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadShops();

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

  const filteredData = shops.filter((shop) =>
    `${shop.name} `.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={shopColumns}
    />
  );
}
