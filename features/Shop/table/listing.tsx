"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import ExportButtons from "@/components/ExportButtonsd";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { RadioGroup } from "@/components/ui/radio-group";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IEmployee } from "@/models/employee";
import type { ISell, SaleStatus } from "@/models/Sell";
import { getAllEmployapi } from "@/service/employee";
import { getAllSells } from "@/service/Sell";
import EmployeeFilter from "./employee";
import { sellColumns } from "./tables/columns";
import { StatusCard } from "../userbased/listing";

type SellListingPageProps = object;

export default function SellListingPage({}: SellListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const employeeFilter = searchParams.get("employee") || "all";
  const uncheckedCorrectionsFilter = searchParams.get("unchecked") === "true";
  const [salesData, setSalesData] = useState<ISell[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSalesPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const [salesResponse, employeesResponse] = await Promise.all([
          getAllSells({ page, limit, startDate, endDate }),
          getAllEmployapi().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        setSalesData(salesResponse.data || []);
        setEmployees(employeesResponse || []);
      } catch {
        if (!cancelled) {
          setError("Error loading sells. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSalesPage();

    return () => {
      cancelled = true;
    };
  }, [endDate, limit, page, startDate]);

  const getSaleStatusDisplayText = (status: SaleStatus): string => {
    switch (status) {
      case "APPROVED":
        return "approved";
      case "NOT_APPROVED":
        return "not approved";
      case "PARTIALLY_DELIVERED":
        return "partially delivered";
      case "DELIVERED":
        return "delivered";
      case "CANCELLED":
        return "cancelled";
      default:
        return "unknown";
    }
  };

  const buildQueryStringLocal = (params: {
    status?: string;
    employee?: string;
    unchecked?: boolean;
    page?: string;
  }) => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.set("q", search);
    urlParams.set("page", params.page || "1");
    urlParams.set("limit", limit.toString());
    if (startDate) urlParams.set("startDate", startDate);
    if (endDate) urlParams.set("endDate", endDate);
    urlParams.set("status", params.status || statusFilter);
    const employeeValue = params.employee || employeeFilter;
    urlParams.set("employee", employeeValue.toString());

    const uncheckedValue =
      params.unchecked !== undefined ? params.unchecked : uncheckedCorrectionsFilter;
    if (uncheckedValue) {
      urlParams.set("unchecked", "true");
    } else {
      urlParams.delete("unchecked");
    }

    return `?${urlParams.toString()}`;
  };

  const buildStatusFilterUrl = (status: string) =>
    buildQueryStringLocal({
      status,
      employee: employeeFilter,
      unchecked: uncheckedCorrectionsFilter,
      page: "1",
    });

  if (loading) {
    return <DataTableSkeleton columnCount={7} rowCount={8} filterCount={3} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const filteredData = salesData.filter((item) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const invoiceMatch = item.invoiceNo?.toLowerCase().includes(searchLower);
      const customerMatch = item.customer?.name?.toLowerCase().includes(searchLower);
      const createdByMatch = item.createdBy?.name?.toLowerCase().includes(searchLower);
      const saleStatusDisplayText = getSaleStatusDisplayText(item.saleStatus);
      const saleStatusMatch = saleStatusDisplayText.includes(searchLower);
      const saleStatusEnumMatch = item.saleStatus.includes(search as SaleStatus);

      if (
        !(
          invoiceMatch ||
          customerMatch ||
          createdByMatch ||
          saleStatusMatch ||
          saleStatusEnumMatch
        )
      ) {
        return false;
      }
    }

    if (statusFilter !== "all" && item.saleStatus !== statusFilter) {
      return false;
    }

    if (employeeFilter !== "all") {
      const employeeId = item.createdBy?.id;
      if (employeeId !== employeeFilter) {
        return false;
      }
    }

    return true;
  });

  const allStatusCounts = {
    APPROVED: salesData.filter((item) => item.saleStatus === "APPROVED").length,
    NOT_APPROVED: salesData.filter((item) => item.saleStatus === "NOT_APPROVED").length,
    PARTIALLY_DELIVERED: salesData.filter(
      (item) => item.saleStatus === "PARTIALLY_DELIVERED",
    ).length,
    DELIVERED: salesData.filter((item) => item.saleStatus === "DELIVERED").length,
    CANCELLED: salesData.filter((item) => item.saleStatus === "CANCELLED").length,
  };

  const totalSells = salesData.length;
  const needsApprovalCount = allStatusCounts.NOT_APPROVED;
  const filteredCount = filteredData.length;
  const selectedEmployee = employees.find((emp) => emp.id === employeeFilter);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Sales Management</div>
        <ExportButtons
          data={filteredData}
          statusCounts={allStatusCounts}
          totalSells={totalSells}
        />
      </div>

      <EmployeeFilter
        employees={employees}
        currentEmployeeFilter={employeeFilter}
        statusFilter={statusFilter}
        search={search}
        limit={limit}
        startDate={startDate}
        endDate={endDate}
        uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
      />

      <RadioGroup defaultValue={statusFilter} className="space-y-3" value={statusFilter}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatusCard
            title="All Sells"
            count={totalSells}
            variant="total"
            selected={statusFilter === "all"}
            value="all"
            href={buildStatusFilterUrl("all")}
          />
          <StatusCard
            title="Approved"
            count={allStatusCounts.APPROVED}
            variant="approved"
            selected={statusFilter === "APPROVED"}
            value="APPROVED"
            href={buildStatusFilterUrl("APPROVED")}
          />
          <StatusCard
            title="Not Approved"
            count={allStatusCounts.NOT_APPROVED}
            variant="notApproved"
            needsAttention={allStatusCounts.NOT_APPROVED > 0}
            selected={statusFilter === "NOT_APPROVED"}
            value="NOT_APPROVED"
            href={buildStatusFilterUrl("NOT_APPROVED")}
          />
          <StatusCard
            title="Partially Delivered"
            count={allStatusCounts.PARTIALLY_DELIVERED}
            variant="partial"
            selected={statusFilter === "PARTIALLY_DELIVERED"}
            value="PARTIALLY_DELIVERED"
            href={buildStatusFilterUrl("PARTIALLY_DELIVERED")}
          />
          <StatusCard
            title="Delivered"
            count={allStatusCounts.DELIVERED}
            variant="delivered"
            selected={statusFilter === "DELIVERED"}
            value="DELIVERED"
            href={buildStatusFilterUrl("DELIVERED")}
          />
          <StatusCard
            title="Cancelled"
            count={allStatusCounts.CANCELLED}
            variant="cancelled"
            selected={statusFilter === "CANCELLED"}
            value="CANCELLED"
            href={buildStatusFilterUrl("CANCELLED")}
          />
        </div>
      </RadioGroup>

      {(statusFilter !== "all" || employeeFilter !== "all" || uncheckedCorrectionsFilter) && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Filters Applied
              </Badge>

              {statusFilter !== "all" && (
                <Badge variant="secondary" className="text-sm">
                  Status: {getSaleStatusDisplayText(statusFilter as SaleStatus)}
                </Badge>
              )}

              {employeeFilter !== "all" && selectedEmployee && (
                <Badge variant="secondary" className="text-sm">
                  Employee: {selectedEmployee.name}
                </Badge>
              )}

              {uncheckedCorrectionsFilter && (
                <Badge className="text-sm">Unchecked Corrections Only</Badge>
              )}

              <span className="text-muted-foreground text-sm">
                Showing {filteredCount} sale{filteredCount === 1 ? "" : "s"}
              </span>
            </div>

            <Link
              href={buildQueryStringLocal({
                status: "all",
                employee: "all",
                unchecked: false,
                page: "1",
              })}
              className="text-primary text-sm hover:underline"
            >
              Clear All Filters
            </Link>
          </div>
        </div>
      )}

      {needsApprovalCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              Attention Required
            </h3>
          </div>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            You have {needsApprovalCount} sale
            {needsApprovalCount === 1 ? "" : "s"} waiting for approval. Please review
            and approve them to proceed with delivery.
          </p>
        </div>
      )}

      <DataTable
        data={paginatedData}
        totalItems={filteredCount}
        columns={sellColumns}
        currentPage={page}
        itemsPerPage={limit}
        searchValue={search}
        statusFilter={statusFilter}
        employeeFilter={employeeFilter}
        uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
