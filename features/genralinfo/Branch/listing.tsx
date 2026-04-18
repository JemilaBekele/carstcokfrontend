"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IBranch } from "@/models/Branch";
import { getAllbranches } from "@/service/branch";
import { branchColumns } from "./tables/columns";

type BranchListingPageProps = object;

export default function BranchListingPage({}: BranchListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllbranches({ page, limit });

        if (cancelled) {
          return;
        }

        setBranches(response.branches || []);
        setTotalCount(response.totalCount || 0);
      } catch {
        if (!cancelled) {
          setError("Error loading branches. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBranches();

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

  const filteredData = branches.filter((branch) =>
    branch.name.toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={branchColumns}
    />
  );
}
