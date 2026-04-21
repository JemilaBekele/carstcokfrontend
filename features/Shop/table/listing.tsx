"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CreditCard } from "lucide-react";
import ExportButtons from "@/components/ExportButtonsd";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { RadioGroup } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IEmployee } from "@/models/employee";
import type { ISell, SaleStatus } from "@/models/Sell";
import { SellPaymentStatus } from "@/models/Sell";
import { getAllEmployapi } from "@/service/employee";
import { getAllSells } from "@/service/Sell";
import EmployeeFilter from "./employee";
import { sellColumns } from "./tables/columns";
import { StatusCard } from "../userbased/listing";

type SellListingPageProps = object;

export default function SellListingPage({}: SellListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const saleStatusFilter = searchParams.get("saleStatus") || "all";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const employeeFilter = searchParams.get("employee") || "all";
  const uncheckedCorrectionsFilter = searchParams.get("unchecked") === "true";
  const [activeTab, setActiveTab] = useState<"sale" | "payment">("sale");
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

  const getPaymentStatusDisplayText = (status: SellPaymentStatus): string => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "PARTIAL":
        return "partial";
      case "PAID":
        return "paid";
      case "CANCELLED":
        return "cancelled";
      default:
        return "unknown";
    }
  };

  const buildQueryStringLocal = (params: {
    saleStatus?: string;
    paymentStatus?: string;
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
    urlParams.set("saleStatus", params.saleStatus || saleStatusFilter);
    urlParams.set("paymentStatus", params.paymentStatus || paymentStatusFilter);
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

  const buildStatusFilterUrl = (saleStatus: string, paymentStatus: string) =>
    buildQueryStringLocal({
      saleStatus,
      paymentStatus,
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

  // Apply all filters
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

    // Apply sale status filter
    if (saleStatusFilter !== "all" && item.saleStatus !== saleStatusFilter) {
      return false;
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all" && item.paymentStatus !== paymentStatusFilter) {
      return false;
    }

    // Apply employee filter
    if (employeeFilter !== "all") {
      const employeeId = item.createdBy?.id;
      if (employeeId !== employeeFilter) {
        return false;
      }
    }

    return true;
  });

  // Sale status counts
  const saleStatusCounts = {
    APPROVED: salesData.filter((item) => item.saleStatus === "APPROVED").length,
    NOT_APPROVED: salesData.filter((item) => item.saleStatus === "NOT_APPROVED").length,
    PARTIALLY_DELIVERED: salesData.filter(
      (item) => item.saleStatus === "PARTIALLY_DELIVERED",
    ).length,
    DELIVERED: salesData.filter((item) => item.saleStatus === "DELIVERED").length,
    CANCELLED: salesData.filter((item) => item.saleStatus === "CANCELLED").length,
  };

  // Payment status counts
  const paymentStatusCounts = {
    PENDING: salesData.filter((item) => item.paymentStatus === "PENDING").length,
    PARTIAL: salesData.filter((item) => item.paymentStatus === "PARTIAL").length,
    PAID: salesData.filter((item) => item.paymentStatus === "PAID").length,
    CANCELLED: salesData.filter((item) => item.paymentStatus === "CANCELLED").length,
  };

  const totalSells = salesData.length;
  const needsApprovalCount = saleStatusCounts.NOT_APPROVED;
  const pendingPaymentCount = paymentStatusCounts.PENDING;
  const filteredCount = filteredData.length;
  const selectedEmployee = employees.find((emp) => emp.id === employeeFilter);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Check if any filters are active
  const hasActiveFilters = saleStatusFilter !== "all" || 
                          paymentStatusFilter !== "all" || 
                          employeeFilter !== "all" || 
                          uncheckedCorrectionsFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Sales Management</div>
        <ExportButtons
          data={filteredData}
          statusCounts={saleStatusCounts}
          totalSells={totalSells}
        />
      </div>

      <EmployeeFilter
        employees={employees}
        currentEmployeeFilter={employeeFilter}
        saleStatusFilter={saleStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        search={search}
        limit={limit}
        startDate={startDate}
        endDate={endDate}
        uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sale" | "payment")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sale">Sale Status</TabsTrigger>
          <TabsTrigger value="payment">Payment Status</TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-6">
          <RadioGroup value={saleStatusFilter} className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
              <StatusCard
                title="All Sells"
                count={totalSells}
                variant="total"
                selected={saleStatusFilter === "all"}
                value="all"
                href={buildStatusFilterUrl("all", paymentStatusFilter)}
              />
              <StatusCard
                title="Approved"
                count={saleStatusCounts.APPROVED}
                variant="approved"
                selected={saleStatusFilter === "APPROVED"}
                value="APPROVED"
                href={buildStatusFilterUrl("APPROVED", paymentStatusFilter)}
              />
              <StatusCard
                title="Not Approved"
                count={saleStatusCounts.NOT_APPROVED}
                variant="notApproved"
                needsAttention={saleStatusCounts.NOT_APPROVED > 0}
                selected={saleStatusFilter === "NOT_APPROVED"}
                value="NOT_APPROVED"
                href={buildStatusFilterUrl("NOT_APPROVED", paymentStatusFilter)}
              />
              <StatusCard
                title="Partially Delivered"
                count={saleStatusCounts.PARTIALLY_DELIVERED}
                variant="partial"
                selected={saleStatusFilter === "PARTIALLY_DELIVERED"}
                value="PARTIALLY_DELIVERED"
                href={buildStatusFilterUrl("PARTIALLY_DELIVERED", paymentStatusFilter)}
              />
              <StatusCard
                title="Delivered"
                count={saleStatusCounts.DELIVERED}
                variant="delivered"
                selected={saleStatusFilter === "DELIVERED"}
                value="DELIVERED"
                href={buildStatusFilterUrl("DELIVERED", paymentStatusFilter)}
              />
              <StatusCard
                title="Cancelled"
                count={saleStatusCounts.CANCELLED}
                variant="cancelled"
                selected={saleStatusFilter === "CANCELLED"}
                value="CANCELLED"
                href={buildStatusFilterUrl("CANCELLED", paymentStatusFilter)}
              />
            </div>
          </RadioGroup>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <RadioGroup value={paymentStatusFilter} className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatusCard
                title="All Payments"
                count={totalSells}
                variant="total"
                selected={paymentStatusFilter === "all"}
                value="all"
                href={buildStatusFilterUrl(saleStatusFilter, "all")}
              />
              <StatusCard
                title="Pending"
                count={paymentStatusCounts.PENDING}
                variant="pending"
                needsAttention={paymentStatusCounts.PENDING > 0}
                selected={paymentStatusFilter === "PENDING"}
                value="PENDING"
                href={buildStatusFilterUrl(saleStatusFilter, "PENDING")}
              />
              <StatusCard
                title="Partial"
                count={paymentStatusCounts.PARTIAL}
                variant="partial"
                selected={paymentStatusFilter === "PARTIAL"}
                value="PARTIAL"
                href={buildStatusFilterUrl(saleStatusFilter, "PARTIAL")}
              />
              <StatusCard
                title="Paid"
                count={paymentStatusCounts.PAID}
                variant="paid"
                selected={paymentStatusFilter === "PAID"}
                value="PAID"
                href={buildStatusFilterUrl(saleStatusFilter, "PAID")}
              />
              <StatusCard
                title="Cancelled"
                count={paymentStatusCounts.CANCELLED}
                variant="cancelled"
                selected={paymentStatusFilter === "CANCELLED"}
                value="CANCELLED"
                href={buildStatusFilterUrl(saleStatusFilter, "CANCELLED")}
              />
            </div>
          </RadioGroup>
        </TabsContent>
      </Tabs>

      {hasActiveFilters && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Filters Applied
              </Badge>

              {saleStatusFilter !== "all" && (
                <Badge variant="secondary" className="text-sm">
                  Sale: {getSaleStatusDisplayText(saleStatusFilter as SaleStatus)}
                </Badge>
              )}

              {paymentStatusFilter !== "all" && (
                <Badge variant="secondary" className="text-sm">
                  Payment: {getPaymentStatusDisplayText(paymentStatusFilter as SellPaymentStatus)}
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
                saleStatus: "all",
                paymentStatus: "all",
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

      {needsApprovalCount > 0 && activeTab === "sale" && (
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

      {pendingPaymentCount > 0 && activeTab === "payment" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              Payment Attention
            </h3>
          </div>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            You have {pendingPaymentCount} sale
            {pendingPaymentCount === 1 ? "" : "s"} with pending payment. Please follow
            up with customers.
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
        statusFilter={saleStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        employeeFilter={employeeFilter}
        uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}