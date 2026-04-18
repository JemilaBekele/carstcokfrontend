"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { getAllPermissions, type IPermission } from "@/service/roleService";
import { permissionColumns } from "./permcolumn";

export default function PermissionListingPage() {
  const { page, search, limit } = useTableQueryParams();
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllPermissions({ page, limit });

        if (cancelled) {
          return;
        }

        setPermissions(response.permissions || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading permission list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPermissions();

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

  const filteredData = permissions.filter((perm) =>
    `${perm.name} ${perm.description ?? ""}`
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
      columns={permissionColumns}
    />
  );
}
