"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { IStockCorrection } from "@/models/StockCorrection";
import { getStockCorrectionById } from "@/service/StockCorrection";
import StockCorrectionForm from "./form";

type TStockCorrectionViewPageProps = {
  stockCorrectionId: string;
};

export default function StockCorrectionViewPage({
  stockCorrectionId,
}: TStockCorrectionViewPageProps) {
  const [stockCorrection, setStockCorrection] =
    useState<IStockCorrection | null>(null);
  const [loading, setLoading] = useState(stockCorrectionId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadStockCorrection = async () => {
      if (stockCorrectionId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getStockCorrectionById(stockCorrectionId);

        if (!cancelled) {
          setStockCorrection(data as IStockCorrection);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStockCorrection();

    return () => {
      cancelled = true;
    };
  }, [stockCorrectionId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return (
    <StockCorrectionForm
      initialData={stockCorrection}
      isEdit={stockCorrectionId !== "new"}
    />
  );
}
