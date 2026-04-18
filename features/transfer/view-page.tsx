"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { ITransfer } from "@/models/transfer";
import { getTransferById } from "@/service/transfer";
import TransferForm from "./form";

type TTransferViewPageProps = {
  transferId: string;
};

export default function TransferViewPage({
  transferId,
}: TTransferViewPageProps) {
  const [transfer, setTransfer] = useState<ITransfer | null>(null);
  const [loading, setLoading] = useState(transferId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadTransfer = async () => {
      if (transferId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getTransferById(transferId);

        if (!cancelled) {
          setTransfer(data as ITransfer);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransfer();

    return () => {
      cancelled = true;
    };
  }, [transferId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return <TransferForm initialData={transfer} isEdit={transferId !== "new"} />;
}
