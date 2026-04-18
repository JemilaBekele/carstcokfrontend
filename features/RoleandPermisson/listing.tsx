"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getAllRoles, type IRole } from "@/service/roleService";
import { roleColumns } from "./tables/columns";

export default function RoleListingPage() {
  const { page, search, limit } = useTableQueryParams();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllRoles({ page, limit });

        if (cancelled) {
          return;
        }

        setRoles(response.roles || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading role list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [limit, page]);

  if (loading) {
    return <DataTableSkeleton columnCount={4} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const filteredData = roles.filter((role) =>
    `${role.name} ${role.description ?? ""}`
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
      columns={roleColumns}
    />
  );
}
