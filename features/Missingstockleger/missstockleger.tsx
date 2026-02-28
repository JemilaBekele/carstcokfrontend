/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { createMissingStockLedgerForSale, getMissingStockLedgers } from "@/service/MissingStockLedger";

interface MissingItem {
  itemId: string;
  productName: string;
  quantity: number;
  batchNumber: string;
  shopName: string;
}

interface MissingSaleGroup {
  saleId: string;
  invoiceNo: string;
  saleStatus: string;
  saleDate: string;
  totalMissing: number;
  items: MissingItem[];
}

export default function StockLedgerReconciliationPage() {
  const [loading, setLoading] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [sales, setSales] = useState<MissingSaleGroup[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const fetchMissing = async () => {
    try {
      setLoading(true);
      const res = await getMissingStockLedgers();

      setSales(res.data?.groupedBySale || []);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async (saleId: string) => {
    try {
      setFixingId(saleId);
      await createMissingStockLedgerForSale(saleId);
      await fetchMissing();
    } catch (error) {
      console.error(error);
    } finally {
      setFixingId(null);
    }
  };

  useEffect(() => {
    fetchMissing();
  }, []);

  return (
    <div className="p-6 space-y-6">

      {/* SUMMARY CARD */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>Total Sales: {summary.totalSales}</div>
            <div>Total Items: {summary.totalItems}</div>
            <div>Delivered Items: {summary.deliveredItems}</div>
            <div>Batches Checked: {summary.processedBatches}</div>
          </CardContent>
        </Card>
      )}

      {/* MAIN CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Missing Stock Ledgers</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" />
              Scanning sales...
            </div>
          )}

          {!loading && sales.length === 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle />
              No missing stock ledgers 🎉
            </div>
          )}

          {sales.map((sale) => (
            <Card key={sale.saleId} className="border">

              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <div className="font-semibold">
                    Invoice: {sale.invoiceNo}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(sale.saleDate).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {sale.saleStatus}
                  </Badge>

                  <Badge variant="destructive">
                    Missing: {sale.totalMissing}
                  </Badge>

                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={fixingId === sale.saleId}
                    onClick={() => handleFix(sale.saleId)}
                  >
                    {fixingId === sale.saleId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Reconcile
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              {/* ITEMS */}
              <CardContent className="space-y-2">
                {sale.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex justify-between border rounded p-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {item.productName}
                      </div>
                      <div className="text-muted-foreground">
                        Batch: {item.batchNumber} | Shop: {item.shopName}
                      </div>
                    </div>

                    <div className="font-semibold">
                      Qty: {item.quantity}
                    </div>
                  </div>
                ))}
              </CardContent>

            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}