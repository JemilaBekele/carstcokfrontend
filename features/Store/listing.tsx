"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Clock, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ISell, SaleStatus } from "@/models/Sell";
import { SellPaymentStatus } from "@/models/Sell";
import { getAllSellsstoregetAll } from "@/service/Sell";
import { sellColumns } from "./tables/columns";

type SellListingPageProps = object;

function StatusCard({
  title,
  count,
  variant = "default",
  needsAttention = false,
  selected = false,
  href,
  value,
}: {
  title: string;
  count: number;
  variant?:
    | "default"
    | "approved"
    | "notApproved"
    | "partial"
    | "delivered"
    | "cancelled"
    | "total"
    | "pending"
    | "paid";
  needsAttention?: boolean;
  selected?: boolean;
  href: string;
  value?: string;
}) {
  const variantStyles = {
    default: "border-border bg-card",
    total: "border-border bg-card",
    approved:
      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
    notApproved: needsAttention
      ? "border-amber-300 bg-amber-50 shadow-md ring-1 ring-amber-200 dark:border-amber-600 dark:bg-amber-950/40 dark:ring-amber-800"
      : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20",
    partial:
      "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
    delivered:
      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
    cancelled:
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
    pending:
      "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
    paid: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20",
  };

  const selectedStyles = selected
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  const textColors = {
    default: "text-foreground",
    total: "text-foreground",
    approved: "text-blue-700 dark:text-blue-400",
    notApproved: needsAttention
      ? "text-amber-800 dark:text-amber-300"
      : "text-gray-700 dark:text-gray-400",
    partial: "text-orange-700 dark:text-orange-400",
    delivered: "text-green-700 dark:text-green-400",
    cancelled: "text-red-700 dark:text-red-400",
    pending: "text-yellow-700 dark:text-yellow-400",
    paid: "text-emerald-700 dark:text-emerald-400",
  };

  const iconColors = {
    notApproved: needsAttention
      ? "text-amber-600 dark:text-amber-400"
      : "text-gray-500",
    pending: "text-yellow-600 dark:text-yellow-400",
    paid: "text-emerald-600 dark:text-emerald-400",
  };

  const showIcon = (variant === "pending" && count > 0) ||
                   (variant === "notApproved" && needsAttention && count > 0);

  return (
    <Link href={href} className="block">
      <Card
        className={`relative cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]} ${selectedStyles} ${needsAttention ? "animate-pulse" : ""}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value={value || ""}
              id={`status-${value}`}
              className="h-4 w-4"
              checked={selected}
            />
            <Label
              htmlFor={`status-${value}`}
              className={`cursor-pointer text-sm font-medium ${textColors[variant]}`}
            >
              {title}
            </Label>
          </div>
          {showIcon && (
            <div className="flex items-center">
              {variant === "notApproved" && (
                <AlertCircle className={`h-4 w-4 ${iconColors.notApproved}`} />
              )}
              {variant === "pending" && (
                <CreditCard className={`h-4 w-4 ${iconColors.pending}`} />
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${textColors[variant]}`}>{count}</div>
            {selected && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Selected
              </Badge>
            )}
            {(variant === "notApproved" && needsAttention && count > 0) && (
              <div className="flex items-center">
                <Clock className={`h-4 w-4 ${iconColors.notApproved}`} />
                <span className={`text-xs ${textColors.notApproved}`}>
                  Needs approval
                </span>
              </div>
            )}
            {(variant === "pending" && count > 0) && (
              <div className="flex items-center">
                <CreditCard className={`h-4 w-4 ${iconColors.pending}`} />
                <span className={`text-xs ${textColors.pending}`}>
                  Payment pending
                </span>
              </div>
            )}
          </div>
          {(variant === "notApproved" && needsAttention && count > 0) && (
            <div className={`mt-1 text-xs font-medium ${textColors.notApproved}`}>
              Action required
            </div>
          )}
          {(variant === "pending" && count > 0) && (
            <div className={`mt-1 text-xs font-medium ${textColors.pending}`}>
              Awaiting payment
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SellListingPage({}: SellListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const saleStatusFilter = searchParams.get("saleStatus") || "all";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const [activeTab, setActiveTab] = useState<"sale" | "payment">("sale");
  const [sales, setSales] = useState<ISell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSales = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllSellsstoregetAll({
          page,
          limit,
          startDate,
          endDate,
        });

        if (!cancelled) {
          setSales(response.data || []);
        }
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

    loadSales();

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

  const buildQueryString = (saleStatus: string, paymentStatus: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", "1");
    params.set("limit", limit.toString());
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("saleStatus", saleStatus);
    params.set("paymentStatus", paymentStatus);
    return `?${params.toString()}`;
  };

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Apply filters
  let filteredData = sales.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const invoiceMatch = item.invoiceNo?.toLowerCase().includes(searchLower);
    const customerMatch = item.customer?.name?.toLowerCase().includes(searchLower);
    const saleStatusDisplayText = getSaleStatusDisplayText(item.saleStatus);
    const saleStatusMatch = saleStatusDisplayText.includes(searchLower);
    const saleStatusEnumMatch = item.saleStatus.includes(search as SaleStatus);

    return invoiceMatch || customerMatch || saleStatusMatch || saleStatusEnumMatch;
  });

  // Apply sale status filter
  if (saleStatusFilter !== "all") {
    filteredData = filteredData.filter((item) => item.saleStatus === saleStatusFilter);
  }

  // Apply payment status filter
  if (paymentStatusFilter !== "all") {
    filteredData = filteredData.filter((item) => item.paymentStatus === paymentStatusFilter);
  }

  // Sale status counts
  const saleStatusCounts = {
    APPROVED: sales.filter((item) => item.saleStatus === "APPROVED").length,
    NOT_APPROVED: sales.filter((item) => item.saleStatus === "NOT_APPROVED").length,
    PARTIALLY_DELIVERED: sales.filter(
      (item) => item.saleStatus === "PARTIALLY_DELIVERED",
    ).length,
    DELIVERED: sales.filter((item) => item.saleStatus === "DELIVERED").length,
    CANCELLED: sales.filter((item) => item.saleStatus === "CANCELLED").length,
  };

  // Payment status counts
  const paymentStatusCounts = {
    PENDING: sales.filter((item) => item.paymentStatus === "PENDING").length,
    PARTIAL: sales.filter((item) => item.paymentStatus === "PARTIAL").length,
    PAID: sales.filter((item) => item.paymentStatus === "PAID").length,
    CANCELLED: sales.filter((item) => item.paymentStatus === "CANCELLED").length,
  };

  const totalSells = sales.length;
  const needsApprovalCount = saleStatusCounts.NOT_APPROVED;
  const pendingPaymentCount = paymentStatusCounts.PENDING;
  const filteredCount = filteredData.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const hasActiveFilters = saleStatusFilter !== "all" || paymentStatusFilter !== "all";

  return (
    <div className="space-y-6">
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
                href={buildQueryString("all", paymentStatusFilter)}
              />
              <StatusCard
                title="Approved"
                count={saleStatusCounts.APPROVED}
                variant="approved"
                selected={saleStatusFilter === "APPROVED"}
                value="APPROVED"
                href={buildQueryString("APPROVED", paymentStatusFilter)}
              />
              <StatusCard
                title="Not Approved"
                count={saleStatusCounts.NOT_APPROVED}
                variant="notApproved"
                needsAttention={saleStatusCounts.NOT_APPROVED > 0}
                selected={saleStatusFilter === "NOT_APPROVED"}
                value="NOT_APPROVED"
                href={buildQueryString("NOT_APPROVED", paymentStatusFilter)}
              />
              <StatusCard
                title="Partially Delivered"
                count={saleStatusCounts.PARTIALLY_DELIVERED}
                variant="partial"
                selected={saleStatusFilter === "PARTIALLY_DELIVERED"}
                value="PARTIALLY_DELIVERED"
                href={buildQueryString("PARTIALLY_DELIVERED", paymentStatusFilter)}
              />
              <StatusCard
                title="Delivered"
                count={saleStatusCounts.DELIVERED}
                variant="delivered"
                selected={saleStatusFilter === "DELIVERED"}
                value="DELIVERED"
                href={buildQueryString("DELIVERED", paymentStatusFilter)}
              />
              <StatusCard
                title="Cancelled"
                count={saleStatusCounts.CANCELLED}
                variant="cancelled"
                selected={saleStatusFilter === "CANCELLED"}
                value="CANCELLED"
                href={buildQueryString("CANCELLED", paymentStatusFilter)}
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
                href={buildQueryString(saleStatusFilter, "all")}
              />
              <StatusCard
                title="Pending"
                count={paymentStatusCounts.PENDING}
                variant="pending"
                needsAttention={paymentStatusCounts.PENDING > 0}
                selected={paymentStatusFilter === "PENDING"}
                value="PENDING"
                href={buildQueryString(saleStatusFilter, "PENDING")}
              />
              <StatusCard
                title="Partial"
                count={paymentStatusCounts.PARTIAL}
                variant="partial"
                selected={paymentStatusFilter === "PARTIAL"}
                value="PARTIAL"
                href={buildQueryString(saleStatusFilter, "PARTIAL")}
              />
              <StatusCard
                title="Paid"
                count={paymentStatusCounts.PAID}
                variant="paid"
                selected={paymentStatusFilter === "PAID"}
                value="PAID"
                href={buildQueryString(saleStatusFilter, "PAID")}
              />
              <StatusCard
                title="Cancelled"
                count={paymentStatusCounts.CANCELLED}
                variant="cancelled"
                selected={paymentStatusFilter === "CANCELLED"}
                value="CANCELLED"
                href={buildQueryString(saleStatusFilter, "CANCELLED")}
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
              <span className="text-muted-foreground text-sm">
                Showing {filteredCount} sale{filteredCount === 1 ? "" : "s"}
              </span>
            </div>
            <Link href={buildQueryString("all", "all")} className="text-primary text-sm hover:underline">
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
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}