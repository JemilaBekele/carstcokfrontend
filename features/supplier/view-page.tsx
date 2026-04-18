"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { ISupplier } from "@/models/supplier";
import { getSupplierById } from "@/service/supplier";
import SupplierForm from "./form";

type TSupplierViewPageProps = {
  supplierId: string;
};

export default function SupplierViewPage({
  supplierId,
}: TSupplierViewPageProps) {
  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(supplierId !== "new");
  const pageTitle =
    supplierId === "new" ? "Create New Supplier" : "Edit Supplier";

  useEffect(() => {
    let cancelled = false;

    const loadSupplier = async () => {
      if (supplierId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getSupplierById(supplierId);

        if (!cancelled) {
          setSupplier(data as ISupplier);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSupplier();

    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return <SupplierForm initialData={supplier} pageTitle={pageTitle} />;
}
