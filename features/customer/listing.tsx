"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ICustomer } from "@/models/customer";
import { getAllCustomers } from "@/service/customer";
import { customerColumns } from "./tables/columns";

type CustomersListingPageProps = object;

export default function CustomersListingPage({}: CustomersListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllCustomers({ page, limit });

        if (cancelled) {
          return;
        }

        setCustomers(response.customers || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading customers. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

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

  const filteredData = customers.filter((item) =>
    `${item.name} ${item.phone1} ${item.phone2}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={customerColumns}
    />
  );
}
