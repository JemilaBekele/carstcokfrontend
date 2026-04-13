import { getProductById } from '@/service/Product';
import ProductForm from './form';
import { IProduct } from '@/models/Product';
import { getCategories } from '@/service/Category';
import { normalizeImagePath } from '@/lib/norm'; // 👈 import helper
import { toast } from 'sonner';
import { getShopallapi } from '@/service/shop';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product: IProduct | null = null;
  let combinedProductData: IProduct | null = null;
  let pageTitle = 'Create New Product';

  if (productId !== 'new') {
    try {
      const data = await getProductById(productId);
      product = data as IProduct | null;

      if (product) {
        combinedProductData = {
          ...product,
          imageUrl:
            typeof product?.imageUrl === 'string'
              ? normalizeImagePath(product.imageUrl)
              : undefined
        };

        pageTitle = `Edit Product: ${product?.name || product.id}`;
      }
    } catch  {
      toast.error('Error loading product');
    }
  }

  // Fetch dropdown data
  const [categories, shops] = await Promise.all([
    getCategories(),
    getShopallapi()
  ]);

  return (
    <ProductForm
      initialData={combinedProductData}
      pageTitle={pageTitle}
      categories={categories}
      shops={shops}
    />
  );
}
