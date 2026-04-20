"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { ICompany } from "@/models/employee";
import { getCompanyById } from "@/service/companyService";
import CompanyForm from "./add";

type CompanyViewPageProps = {
  companyId: string;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://store.smartdent.online";

const normalizeLogoPath = (path?: string | File) => {
  if (!path || typeof path !== "string") {
    return undefined;
  }

  const normalizedPath = path.replace(/\\/g, "/");

  if (normalizedPath.startsWith("http")) {
    return normalizedPath;
  }

  const cleanPath = normalizedPath.replace(/^\/+/, "");
  return `${BACKEND_URL}/${cleanPath}`;
};

export default function CompanyViewPage({ companyId }: CompanyViewPageProps) {
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(companyId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadCompany = async () => {
      if (companyId === "new") {
        setLoading(false);
        return;
      }

      try {
        const response = await getCompanyById(companyId);

        if (!cancelled && response) {
          setCompany({
            ...response,
            logo: normalizeLogoPath(response.logo),
          });
        }
      } catch {
        toast.error("Error loading company");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  const pageTitle =
    companyId === "new"
      ? "Create New Company"
      : `Edit Company: ${company?.name || company?.id || ""}`;

  return <CompanyForm initialData={company} pageTitle={pageTitle} />;
}
