"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import FormCardSkeleton from "@/components/form-card-skeleton";
import { normalizeImagePath } from "@/lib/norm";
import type { ICategory } from "@/models/Category";
import type { IProduct } from "@/models/Product";
import type { IShop } from "@/models/shop";
import { getCategories } from "@/service/Category";
import { getProductById } from "@/service/Product";
import { getShopallapi } from "@/service/shop";
import ProductForm from "./form";

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({
  productId,
}: TProductViewPageProps) {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProductPage = async () => {
      try {
        const [categoriesData, shopsData, productData] = await Promise.all([
          getCategories(),
          getShopallapi(),
          productId !== "new" ? getProductById(productId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoriesData || []);
        setShops(shopsData || []);

        if (productData) {
          const typedProduct = productData as IProduct;
          setProduct({
            ...typedProduct,
            imageUrl:
              typeof typedProduct.imageUrl === "string"
                ? normalizeImagePath(typedProduct.imageUrl)
                : undefined,
          });
        } else {
          setProduct(null);
        }
      } catch {
        toast.error("Error loading product");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProductPage();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  const pageTitle =
    productId === "new"
      ? "Create New Product"
      : `Edit Product: ${product?.name || product?.id || ""}`;

  return (
    <ProductForm
      initialData={product}
      pageTitle={pageTitle}
      categories={categories}
      shops={shops}
    />
  );
}
