"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { IProduct } from "@/models/Product";
import type { ISell } from "@/models/Sell";
import { getProductsnew } from "@/service/Product";
import { getSellById } from "@/service/Sell";
import SalesForm from "./form";

type SalesViewPageProps = {
  sellId: string;
};

export default function UserSalesViewPage({ sellId }: SalesViewPageProps) {
  const [sell, setSell] = useState<ISell | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSellPage = async () => {
      try {
        const [productsData, sellData] = await Promise.all([
          getProductsnew(),
          sellId !== "new" ? getSellById(sellId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setProducts(productsData || []);
        setSell((sellData as ISell) || null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSellPage();

    return () => {
      cancelled = true;
    };
  }, [sellId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return (
    <SalesForm
      initialData={sell}
      pageTitle={sellId === "new" ? "Create New Sell" : "Edit Sell"}
      products={products}
    />
  );
}
