"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { ICustomer } from "@/models/customer";
import { getCustomerById } from "@/service/customer";
import CustomerForm from "./form";

type TCustomerViewPageProps = {
  customerId: string;
};

export default function CustomerViewPage({
  customerId,
}: TCustomerViewPageProps) {
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(customerId !== "new");
  const pageTitle =
    customerId === "new" ? "Create New Customer" : "Edit Customer";

  useEffect(() => {
    let cancelled = false;

    const loadCustomer = async () => {
      if (customerId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getCustomerById(customerId);

        if (!cancelled) {
          setCustomer(data as ICustomer);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return <CustomerForm initialData={customer} pageTitle={pageTitle} />;
}
