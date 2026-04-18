"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { IStockCorrection } from "@/models/StockCorrection";
import type { IPurchase } from "@/models/purchase";
import { getPurchaseById } from "@/service/purchase";
import PurchaseCorrectionForm from "./correction";

type TPurchaseViewPageProps = {
  purchaseId: string;
};

export default function PurchasecorrectPage({
  purchaseId,
}: TPurchaseViewPageProps) {
  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [initialData, setInitialData] = useState<IStockCorrection | null>(null);
  const [loading, setLoading] = useState(purchaseId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadPurchase = async () => {
      if (purchaseId === "new") {
        setLoading(false);
        return;
      }

      try {
        const purchaseData = await getPurchaseById(purchaseId);

        if (cancelled) {
          return;
        }

        setPurchase(purchaseData);
        setInitialData({
          storeId: purchaseData?.storeId || "",
          reason: "PURCHASE_ERROR",
          purchaseId,
          items:
            purchaseData?.items?.map((item) => ({
              productId: item.productId.toString(),
              isBox: item.isBox,
              quantity: Number(item.quantity),
            })) || [],
          reference: "",
          notes: "",
        } as IStockCorrection);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPurchase();

    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return (
    <PurchaseCorrectionForm
      purchaseId={purchaseId}
      initialData={initialData}
      isEdit={purchaseId !== "new"}
      purchaseData={purchase}
    />
  );
}
