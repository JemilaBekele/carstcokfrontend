/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { IStockCorrection } from '@/models/StockCorrection';
import {
  createStockCorrection,
  updateStockCorrection
} from '@/service/StockCorrection';
import { TransferEntityType } from '@/models/transfer';
import { IPurchase, PaymentStatus, PurchaseItem } from '@/models/purchase';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Check,
  X,
  Info,
  Box,
  PackageOpen
} from 'lucide-react';

// Helper function to format dates
const formatDate = (dateString: string | Date) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Updated Zod schema - make isBox required with default
const formSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  reason: z.enum([
    'PURCHASE_ERROR',
    'TRANSFER_ERROR',
    'EXPIRED',
    'DAMAGED',
    'MANUAL_ADJUSTMENT'
  ]),
  purchaseId: z.string().min(1, 'Purchase ID is required for purchase corrections'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        isBox: z.boolean(),
        quantity: z.union([z.number(), z.null()]).optional()
      })
    )
    .min(1, 'At least one item is required')
    .refine(
      (items) =>
        items.some(
          (item) =>
            item.quantity !== null &&
            item.quantity !== 0 &&
            item.quantity !== undefined
        ),
      'At least one item must have a quantity'
    )
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseCorrectionFormProps {
  purchaseId: string;
  initialData?: IStockCorrection | null;
  isEdit?: boolean;
  purchaseData: IPurchase | null;
}

interface StoreStockItem {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  status: string;
  product: {
    id: string;
    productCode: string;
    name: string;
    hasBox: boolean;
    boxSize: number | null;
    UnitOfMeasure: string | null;
  };
}

export default function PurchaseCorrectionForm({
  purchaseId,
  initialData,
  isEdit = false,
  purchaseData
}: PurchaseCorrectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [storeStockItems, setStoreStockItems] = useState<StoreStockItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [initialItemsLoaded, setInitialItemsLoaded] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          storeId: initialData.storeId || '',
          reason: initialData.reason,
          purchaseId: initialData.purchaseId || purchaseId,
          reference: initialData.reference || '',
          notes: initialData.notes || '',
          items: initialData.items.map((item) => ({
            productId: item.productId,
            isBox: item.isBox || false,
            quantity: null
          }))
        }
      : {
          storeId: purchaseData?.storeId || '',
          reason: 'PURCHASE_ERROR',
          purchaseId,
          reference: '',
          notes: '',
          items: [{ productId: '', isBox: false, quantity: null }]
        }
  });

  const storeId = form.watch('storeId');

  // Get available stock for a product
  const getAvailableStock = (productId: string): StoreStockItem | undefined => {
    return storeStockItems.find((stock) => stock.product.id.toString() === productId);
  };

  // Get available pieces in stock
  const getAvailablePieces = (productId: string): number => {
    const stock = getAvailableStock(productId);
    return stock?.quantity || 0;
  };

  // Get available boxes in stock
  const getAvailableBoxes = (productId: string): number => {
    const stock = getAvailableStock(productId);
    if (!stock || !stock.product.hasBox || !stock.product.boxSize || stock.product.boxSize <= 0) return 0;
    return Math.floor(stock.quantity / stock.product.boxSize);
  };

  // Get max allowed removal quantity based on isBox flag
  const getMaxRemovalQuantity = (productId: string, isBox: boolean): number => {
    if (!productId) return 0;
    if (isBox) {
      return getAvailableBoxes(productId);
    } else {
      return getAvailablePieces(productId);
    }
  };

  // Validate if removal quantity is valid (doesn't exceed available stock)
  const isValidRemoval = (productId: string, isBox: boolean, quantity: number | null | undefined): boolean => {
    if (!productId || quantity === null || quantity === undefined) return true;
    if (quantity >= 0) return true; // Additions are always valid
    
    const removalAmount = Math.abs(quantity);
    const maxAllowed = getMaxRemovalQuantity(productId, isBox);
    return removalAmount <= maxAllowed;
  };

  // Get display text for available stock
  const getAvailableStockDisplay = (productId: string, isBox: boolean): string => {
    if (!productId) return 'Select product';
    
    const stock = getAvailableStock(productId);
    if (!stock) return 'Select product';
    
    const pieces = stock.quantity;
    
    if (isBox) {
      if (!stock.product.hasBox) {
        return 'Box not supported';
      }
      if (!stock.product.boxSize || stock.product.boxSize <= 0) {
        return 'Box size not configured';
      }
      const boxes = Math.floor(pieces / stock.product.boxSize);
      const remainingPieces = pieces % stock.product.boxSize;
      if (boxes === 0) {
        return '0 boxes available';
      }
      return `${boxes} box(es) available${remainingPieces > 0 ? ` (${remainingPieces} pieces left)` : ''}`;
    } else {
      return `${pieces} piece(s) available`;
    }
  };

  // Get box size info
  const getBoxSizeInfo = (productId: string): string => {
    const stock = getAvailableStock(productId);
    if (!stock?.product.hasBox || !stock.product.boxSize) return '';
    return `${stock.product.boxSize} pieces per box`;
  };

  // Check if product supports boxing
  const doesProductSupportBox = (productId: string): boolean => {
    const stock = getAvailableStock(productId);
    return stock?.product.hasBox || false;
  };

  // Get unique products from storeStockItems
  const getUniqueProducts = () => {
    const seenProductIds = new Set<string>();
    return storeStockItems.filter((item) => {
      if (!seenProductIds.has(item.product.id)) {
        seenProductIds.add(item.product.id);
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial items when editing
  useEffect(() => {
    if (isEdit && initialData && !initialItemsLoaded) {
      setInitialItemsLoaded(true);
    }
  }, [isEdit, initialData, initialItemsLoaded]);

  useEffect(() => {
    const fetchProductsFromStore = async () => {
      if (!storeId) return;

      setLoadingProducts(true);
      try {
        const stockData = await getAvailableProductsBySource(
          TransferEntityType.STORE,
          storeId
        );
        setStoreStockItems(stockData);
      } catch {
        toast.error('Failed to load products from store');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductsFromStore();
  }, [storeId]);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    input: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // First, validate all removal quantities against available stock
      for (const item of data.items) {
        if (item.quantity !== null && item.quantity !== undefined && item.quantity < 0) {
          const productStock = getAvailableStock(item.productId);
          const removalAmount = Math.abs(item.quantity);
          const maxAllowed = getMaxRemovalQuantity(item.productId, item.isBox);
          
          if (removalAmount > maxAllowed) {
            const productName = productStock?.product.name || 'Product';
            const unit = item.isBox ? 'boxes' : 'pieces';
            const available = item.isBox ? getAvailableBoxes(item.productId) : getAvailablePieces(item.productId);
            toast.error(`${productName}: Cannot remove ${removalAmount} ${unit}. Only ${available} ${unit} available in stock.`);
            setIsLoading(false);
            return;
          }
        }
      }

      // Filter out items with null, undefined, or zero quantities
      const filteredItems = data.items.filter(
        (item) =>
          item.quantity !== null &&
          item.quantity !== undefined &&
          item.quantity !== 0
      );

      if (filteredItems.length === 0) {
        toast.error('At least one item must have a quantity');
        setIsLoading(false);
        return;
      }

      const payload = {
        ...data,
        items: filteredItems.map((item) => ({
          productId: item.productId,
          isBox: item.isBox,
          quantity: Number(item.quantity)
        }))
      };

      if (isEdit && initialData?.id) {
        await updateStockCorrection(initialData.id, payload);
        toast.success('Purchase correction updated successfully');
      } else {
        await createStockCorrection(payload);
        toast.success('Purchase correction created successfully');
      }

      router.push('/dashboard/purchase');
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving purchase correction.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase Correction' : 'Create Purchase Correction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!purchaseData) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            Purchase Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>The requested purchase could not be found.</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate grand total
  const grandTotal =
    purchaseData.items?.reduce((total, item) => {
      return total + (item.totalPrice || 0);
    }, 0) || 0;

  return (
    <div className='space-y-6'>
      {/* Purchase Details Card */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-2xl font-bold'>
            <Package className='text-primary' />
            Purchase {purchaseData.invoiceNo || purchaseData.id}
            <Badge
              variant={
                purchaseData.paymentStatus === PaymentStatus.APPROVED
                  ? 'default'
                  : purchaseData.paymentStatus === PaymentStatus.REJECTED
                    ? 'destructive'
                    : 'secondary'
              }
              className='ml-2'
            >
              {purchaseData.paymentStatus === PaymentStatus.APPROVED ? (
                <>
                  <Check className='mr-1 h-3 w-3' />{' '}
                  {purchaseData.paymentStatus}
                </>
              ) : purchaseData.paymentStatus === PaymentStatus.REJECTED ? (
                <>
                  <X className='mr-1 h-3 w-3' /> {purchaseData.paymentStatus}
                </>
              ) : (
                <>{purchaseData.paymentStatus}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Purchase Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Info className='text-primary h-5 w-5' />
                Purchase Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <FileText className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'>Invoice Number:</span>{' '}
                    {purchaseData.invoiceNo || 'N/A'}
                  </p>
                </div>
                {purchaseData.supplier && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Supplier:</span>{' '}
                      {purchaseData.supplier.name || 'Unknown Supplier'}
                    </p>
                  </div>
                )}
                {purchaseData.store && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Store:</span>{' '}
                      {purchaseData.store.name || 'Unknown Store'}
                    </p>
                  </div>
                )}
                {purchaseData.createdBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Created By:</span>{' '}
                      {purchaseData.createdBy.name || 'Unknown Employee'}
                    </p>
                  </div>
                )}
                {purchaseData.updatedBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Updated By:</span>{' '}
                      {purchaseData.updatedBy.name || 'Unknown Employee'}
                    </p>
                  </div>
                )}
                {purchaseData.notes && (
                  <div>
                    <p className='font-medium'>Notes:</p>
                    <p className='text-muted-foreground'>
                      {purchaseData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial and Date Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Calendar className='text-primary h-5 w-5' />
                Financial Details
              </h3>
              <div className='space-y-2'>
                <div>
                  <p className='font-medium'>Purchase Date:</p>
                  <p className='text-muted-foreground'>
                    {formatDate(purchaseData.purchaseDate)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <DollarSign className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'>Total:</span>{' '}
                    {grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'>Total Products:</span>{' '}
                    {purchaseData.totalProducts || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchased Items Table Section - Updated for isBox */}
          {purchaseData.items && purchaseData.items.length > 0 ? (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Purchased Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseData.items.map(
                    (item: PurchaseItem, index: number) => (
                      <TableRow key={item.id || `${item.productId}-${index}`}>
                        <TableCell className='font-medium'>
                          {item.product?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isBox ? 'default' : 'secondary'} className='text-xs'>
                            {item.isBox ? (
                              <>
                                <Box className='mr-1 h-3 w-3' />
                                Box
                              </>
                            ) : (
                              <>
                                <PackageOpen className='mr-1 h-3 w-3' />
                                Piece
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.product?.unitOfMeasure?.symbol || 'N/A'}
                        </TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell>
                          {(item.unitPrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {(item.totalPrice || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='text-muted-foreground'>
              No items found for this purchase
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correction Form Card */}
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase Correction' : 'Create Purchase Correction'}
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            Correcting purchase {purchaseData.invoiceNo || purchaseData.id}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='purchaseId'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='storeId'
                render={({ field }) => (
                  <FormItem className='hidden'>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='reason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select reason' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='PURCHASE_ERROR'>
                            Purchase Error
                          </SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='reference'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter reference' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='items'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correction Items</FormLabel>
                    {loadingProducts && (
                      <div className='text-muted-foreground mb-2 text-sm'>
                        Loading products from store...
                      </div>
                    )}
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div>Product</div>
                          <div>Box/Piece</div>
                          <div>Adjust by (Quantity)</div>
                          <div>Available Stock</div>
                          <div>Unit</div>
                          <div>Action</div>
                        </div>
                        {field.value.map((item, index) => {
                          const stockItem = getAvailableStock(item.productId);
                          const isBox = item.isBox;
                          const pieces = stockItem?.quantity || 0;
                          const boxSize = stockItem?.product.boxSize || 1;
                          const boxes = Math.floor(pieces / boxSize);
                          const hasBox = stockItem?.product.hasBox || false;
                          
                          const maxRemoval = getMaxRemovalQuantity(item.productId, isBox);
                          const availableDisplay = getAvailableStockDisplay(item.productId, isBox);
                          const boxSizeInfo = getBoxSizeInfo(item.productId);
                          const supportsBox = doesProductSupportBox(item.productId);
                          
                          // Check if current quantity is valid
                          const currentQuantity = item.quantity;
                          const isRemovalValid = isValidRemoval(item.productId, isBox, currentQuantity);
                          
                          const uniqueProducts = getUniqueProducts();
                          const productOptions = uniqueProducts.map((s) => ({
                            value: s.product.id.toString(),
                            label: s.product.name,
                          }));

                          return (
                            <div key={index} className='grid grid-cols-6 items-center gap-4'>
                              {/* Product Selection */}
                              <div>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={async (newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].isBox = false;
                                    newItems[index].quantity = null;
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder={
                                    loadingProducts
                                      ? 'Loading products...'
                                      : 'Search product'
                                  }
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              {/* isBox Switch */}
                              <div>
                                <div className='flex items-center justify-center'>
                                  <Switch
                                    checked={isBox}
                                    onCheckedChange={(checked) => {
                                      const newItems = [...field.value];
                                      newItems[index].isBox = checked;
                                      newItems[index].quantity = null;
                                      field.onChange(newItems);
                                    }}
                                    disabled={!item.productId || loadingProducts || !supportsBox}
                                    className='data-[state=checked]:bg-primary'
                                  />
                                </div>
                              </div>

                              {/* Quantity Input */}
                              <div>
                                <Input
                                  type='number'
                                  placeholder='Enter quantity (+ for add, - for remove)'
                                  value={item.quantity === null ? '' : item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const value = e.target.value;
                                    if (value === '') {
                                      newItems[index].quantity = null;
                                    } else {
                                      const quantity = Number(value);
                                      newItems[index].quantity = isNaN(quantity) ? null : quantity;
                                    }
                                    field.onChange(newItems);
                                  }}
                                  className={
                                    !isRemovalValid && currentQuantity !== undefined && currentQuantity !== null && currentQuantity < 0
                                      ? 'border-red-500 focus:ring-red-500'
                                      : ''
                                  }
                                />
                                {currentQuantity !== null && currentQuantity !== undefined && currentQuantity < 0 && !isRemovalValid && (
                                  <div className='mt-1 text-xs text-red-500'>
                                    Maximum removal: {maxRemoval} {isBox ? 'box(es)' : 'piece(s)'}
                                  </div>
                                )}
                                <div className='mt-1 text-xs text-gray-500'>
                                  {currentQuantity != null && currentQuantity < 0
                                    ? '⚠️ Removing stock'
                                    : currentQuantity != null && currentQuantity > 0
                                      ? '➕ Adding stock'
                                      : ''}
                                </div>
                              </div>

                              {/* Available Stock Display */}
                              <div className='text-muted-foreground text-sm'>
                                {loadingProducts ? (
                                  <div className='flex items-center gap-1'>
                                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-gray-400'></div>
                                    <span>Loading...</span>
                                  </div>
                                ) : item.productId ? (
                                  <div className='space-y-1'>
                                    <div className={isBox ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
                                      {availableDisplay}
                                    </div>
                                    {isBox && boxSizeInfo && (
                                      <div className='text-xs text-gray-500'>{boxSizeInfo}</div>
                                    )}
                                    {isBox && !supportsBox && (
                                      <div className='text-xs text-red-500'>Box not supported</div>
                                    )}
                                  </div>
                                ) : (
                                  'Select product'
                                )}
                              </div>

                              {/* Unit of Measure */}
                              <div className='text-muted-foreground text-sm'>
                                {stockItem?.product?.UnitOfMeasure || <span className='text-gray-400'>Select product</span>}
                              </div>

                              {/* Delete Button */}
                              <div>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => {
                                    const newItems = [...field.value];
                                    newItems.splice(index, 1);
                                    field.onChange(newItems);
                                  }}
                                  disabled={field.value.length <= 1}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter notes (optional)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex justify-end gap-2'>
                <Button type='submit' disabled={isLoading || loadingProducts}>
                  {isEdit ? 'Update' : 'Create'} Purchase Correction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}