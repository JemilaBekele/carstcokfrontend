"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { IPurchase } from "@/models/purchase";
import { getPurchaseById } from "@/service/purchase";
import PurchaseForm from "./form";

type TPurchaseViewPageProps = {
  purchaseId: string;
};

export default function PurchaseViewPage({
  purchaseId,
}: TPurchaseViewPageProps) {
  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [loading, setLoading] = useState(purchaseId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadPurchase = async () => {
      if (purchaseId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getPurchaseById(purchaseId);

        if (!cancelled) {
          setPurchase(data as IPurchase);
        }
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

  return <PurchaseForm initialData={purchase} isEdit={purchaseId !== "new"} />;
}
