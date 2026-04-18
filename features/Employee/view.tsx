"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { IEmployee } from "@/models/employee";
import { getEmployeeById } from "@/service/employee";
import EmployeeForm from "./formwithoutpass";

type TEmployeeViewPageProps = {
  id: string;
};

export default function EmployeeViewPage({ id }: TEmployeeViewPageProps) {
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(id !== "new");
  const pageTitle = id === "new" ? "Create New Employee" : "Edit Employee";

  useEffect(() => {
    let cancelled = false;

    const loadEmployee = async () => {
      if (id === "new") {
        setLoading(false);
        return;
      }

      try {
        const response = await getEmployeeById(id);

        if (!cancelled) {
          setEmployee(response || null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return <EmployeeForm initialData={employee} pageTitle={pageTitle} />;
}
