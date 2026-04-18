"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getAllEmployees } from "@/service/employee";
import type { IEmployee } from "@/models/employee";
import { employeeColumns } from "./employee-tables/columns";

type EmployeeListingPageProps = object;

export default function EmployeeListingPage({}: EmployeeListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllEmployees({
          page,
          limit,
          startDate,
          endDate,
        });

        if (cancelled) {
          return;
        }

        setEmployees(response.employees || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading employees");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEmployees();

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

  const filteredData = employees.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower) ||
      item.phone?.toLowerCase().includes(searchLower)
    );
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={employeeColumns}
    />
  );
}
