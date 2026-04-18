"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table/newdatatable";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { ISell, SaleStatus } from "@/models/Sell";
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
    | "partial"
    | "delivered"
    | "cancelled"
    | "total";
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
    partial:
      "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
    delivered:
      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
    cancelled:
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
  };

  const selectedStyles = selected
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  const textColors = {
    default: "text-foreground",
    total: "text-foreground",
    approved: "text-blue-700 dark:text-blue-400",
    partial: "text-orange-700 dark:text-orange-400",
    delivered: "text-green-700 dark:text-green-400",
    cancelled: "text-red-700 dark:text-red-400",
  };

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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SellListingPage({}: SellListingPageProps) {
  const { page, search, limit, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
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

  const buildQueryString = (status: string) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", "1");
    params.set("limit", limit.toString());
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("status", status);
    return `?${params.toString()}`;
  };

  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

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

  if (statusFilter !== "all") {
    filteredData = filteredData.filter((item) => item.saleStatus === statusFilter);
  }

  const allStatusCounts = {
    APPROVED: sales.filter((item) => item.saleStatus === "APPROVED").length,
    NOT_APPROVED: sales.filter((item) => item.saleStatus === "NOT_APPROVED").length,
    PARTIALLY_DELIVERED: sales.filter(
      (item) => item.saleStatus === "PARTIALLY_DELIVERED",
    ).length,
    DELIVERED: sales.filter((item) => item.saleStatus === "DELIVERED").length,
    CANCELLED: sales.filter((item) => item.saleStatus === "CANCELLED").length,
  };

  const totalSells = sales.length;
  const needsApprovalCount = allStatusCounts.NOT_APPROVED;
  const filteredCount = filteredData.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <RadioGroup defaultValue={statusFilter} className="space-y-3" value={statusFilter}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatusCard
            title="All Sells"
            count={totalSells}
            variant="total"
            selected={statusFilter === "all"}
            value="all"
            href={buildQueryString("all")}
          />
          <StatusCard
            title="Approved"
            count={allStatusCounts.APPROVED}
            variant="approved"
            selected={statusFilter === "APPROVED"}
            value="APPROVED"
            href={buildQueryString("APPROVED")}
          />
          <StatusCard
            title="Partially Delivered"
            count={allStatusCounts.PARTIALLY_DELIVERED}
            variant="partial"
            selected={statusFilter === "PARTIALLY_DELIVERED"}
            value="PARTIALLY_DELIVERED"
            href={buildQueryString("PARTIALLY_DELIVERED")}
          />
          <StatusCard
            title="Delivered"
            count={allStatusCounts.DELIVERED}
            variant="delivered"
            selected={statusFilter === "DELIVERED"}
            value="DELIVERED"
            href={buildQueryString("DELIVERED")}
          />
          <StatusCard
            title="Cancelled"
            count={allStatusCounts.CANCELLED}
            variant="cancelled"
            selected={statusFilter === "CANCELLED"}
            value="CANCELLED"
            href={buildQueryString("CANCELLED")}
          />
        </div>
      </RadioGroup>

      {statusFilter !== "all" && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Filter Applied
              </Badge>
              <span className="text-muted-foreground text-sm">
                Showing {filteredCount} {statusFilter.toLowerCase()} sale
                {filteredCount === 1 ? "" : "s"}
              </span>
            </div>
            <Link href={buildQueryString("all")} className="text-primary text-sm hover:underline">
              Clear Filter
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
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
