/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
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
import { getStores } from '@/service/store';
import { getShops } from '@/service/shop';
import { useCallback, useEffect, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { IStockCorrection } from '@/models/StockCorrection';
import {
  createStockCorrection,
  updateStockCorrection
} from '@/service/StockCorrection';
import { TransferEntityType } from '@/models/transfer';

// Define types for form data
interface FormItemType {
  productId: string;
  isBox: boolean;
  quantity: number | string;
}

interface FormDataType {
  storeId: string;
  shopId: string;
  reason: 'PURCHASE_ERROR' | 'TRANSFER_ERROR' | 'EXPIRED' | 'DAMAGED' | 'MANUAL_ADJUSTMENT';
  reference: string;
  notes: string;
  items: FormItemType[];
}

interface StockCorrectionFormProps {
  initialData: IStockCorrection | null;
  isEdit?: boolean;
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

export default function StockCorrectionForm({
  initialData,
  isEdit = false
}: StockCorrectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [storeStockItems, setStoreStockItems] = useState<StoreStockItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [initialItemsLoaded, setInitialItemsLoaded] = useState(false);
  const router = useRouter();

  const form = useForm<FormDataType>({
    defaultValues: {
      storeId: initialData?.storeId || '',
      shopId: initialData?.shopId || '',
      reason: initialData?.reason || 'MANUAL_ADJUSTMENT',
      reference: initialData?.reference || '',
      notes: initialData?.notes || '',
      items: initialData?.items?.map((item) => ({
        productId: item.productId.toString(),
        isBox: item.isBox || false,
        quantity: Number(item.quantity)
      })) || [{ productId: '', isBox: false, quantity: 1 }]
    }
  });

  const locationType = form.watch('storeId') ? 'store' : 'shop';
  const locationId = form.watch('storeId') || form.watch('shopId');

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

  // Get max quantity based on isBox flag
  const getMaxQuantity = (productId: string, isBox: boolean): number => {
    if (!productId) return 0;
    if (isBox) {
      return getAvailableBoxes(productId);
    } else {
      return getAvailablePieces(productId);
    }
  };

  // Get display text for available stock
  const getAvailableStockDisplay = (productId: string, isBox: boolean): string => {
    if (!productId) return 'Select product';
    
    const stock = getAvailableStock(productId);
    if (!stock) return 'Select product';
    
    const pieces = stock.quantity;
    
    if (isBox) {
      if (!stock.product.hasBox) {
        return 'Box not supported for this product';
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

  // Get box size info string
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

  // Validation function
  const validateForm = (data: FormDataType) => {
    const errors: any = {};

    if (!data.storeId && !data.shopId) {
      errors.storeId = 'Either store or shop must be selected';
    }

    if (!data.items || data.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].productId = 'Product is required';
        }
        const numQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        if (isNaN(numQuantity) || numQuantity === 0) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].quantity = 'Quantity must be a non-zero number';
        }
      });
    }

    return errors;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesData, shopsData] = await Promise.all([
          getStores(),
          getShops()
        ]);
        setStores(storesData);
        setShops(shopsData);
      } catch {
        toast.error('Failed to load stores or shops');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProductsFromLocation = async () => {
      if (!locationId) {
        setStoreStockItems([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const entityType = locationType === 'store'
          ? TransferEntityType.STORE
          : TransferEntityType.SHOP;

        const stockData = await getAvailableProductsBySource(entityType, locationId);
        setStoreStockItems(stockData);
      } catch {
        toast.error('Failed to load products from location');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductsFromLocation();
  }, [locationType, locationId]);

  useEffect(() => {
    if (isEdit && initialData && !initialItemsLoaded) {
      setInitialItemsLoaded(true);
    }
  }, [isEdit, initialData, initialItemsLoaded]);

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

  const onSubmit = async (data: FormDataType) => {
    const errors = validateForm(data);
    
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach((key) => {
        if (key === 'items') {
          Object.keys(errors.items).forEach((itemIndex) => {
            Object.keys(errors.items[itemIndex]).forEach((field) => {
              form.setError(`items.${itemIndex}.${field}` as any, {
                type: 'manual',
                message: errors.items[itemIndex][field]
              });
            });
          });
        } else {
          form.setError(key as any, {
            type: 'manual',
            message: errors[key]
          });
        }
      });
      return;
    }

    // Validate stock availability
    for (const item of data.items) {
      if (item.productId) {
        const numQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        const maxQty = getMaxQuantity(item.productId, item.isBox);
        
        if (Math.abs(numQuantity) > maxQty && maxQty > 0) {
          const stock = getAvailableStock(item.productId);
          const productName = stock?.product.name || 'Product';
          const unit = item.isBox ? 'boxes' : 'pieces';
          toast.error(`${productName}: Cannot adjust ${Math.abs(numQuantity)} ${unit}. Only ${maxQty} ${unit} available.`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((item) => ({
          productId: item.productId,
          isBox: item.isBox,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
        }))
      };

      if (isEdit && initialData?.id) {
        await updateStockCorrection(initialData.id, payload);
        toast.success('Stock correction updated successfully');
      } else {
        await createStockCorrection(payload);
        toast.success('Stock correction created successfully');
      }

      router.push('/dashboard/StockCorrection');
      router.refresh();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'An error occurred while saving stock correction.';
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
            {isEdit ? 'Edit Stock Correction' : 'Create Stock Correction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Stock Correction' : 'Create Stock Correction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='storeId'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Store (Optional)</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          form.setValue('shopId', '');
                        }
                        form.setValue('items', [{ productId: '', isBox: false, quantity: 1 }]);
                        setStoreStockItems([]);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select store' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='shopId'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Shop (Optional)</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          form.setValue('storeId', '');
                        }
                        form.setValue('items', [{ productId: '', isBox: false, quantity: 1 }]);
                        setStoreStockItems([]);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select shop' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id.toString()}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reason'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <ShadcnSelect value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select reason' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PURCHASE_ERROR'>Purchase Error</SelectItem>
                        <SelectItem value='TRANSFER_ERROR'>Transfer Error</SelectItem>
                        <SelectItem value='EXPIRED'>Expired</SelectItem>
                        <SelectItem value='DAMAGED'>Damaged</SelectItem>
                        <SelectItem value='MANUAL_ADJUSTMENT'>Manual Adjustment</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reference'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter reference' {...field} />
                    </FormControl>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='items'
              render={({ field, fieldState }) => {
                const itemsError = fieldState.error as any;
                
                return (
                  <FormItem>
                    <FormLabel>Items</FormLabel>
                    {loadingProducts && <div></div>}
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div>Product</div>
                          <div>Box/Piece</div>
                          <div>Quantity</div>
                          <div>Available Stock</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => {
                          const stockItem = getAvailableStock(item.productId);
                          const isBox = item.isBox;
                          const pieces = stockItem?.quantity || 0;
                          const boxSize = stockItem?.product.boxSize || 1;
                          const boxes = Math.floor(pieces / boxSize);
                          const remainingPieces = pieces % boxSize;
                          const hasBox = stockItem?.product.hasBox || false;
                          
                          const maxQuantity = getMaxQuantity(item.productId, isBox);
                          const availableDisplay = getAvailableStockDisplay(item.productId, isBox);
                          const boxSizeInfo = getBoxSizeInfo(item.productId);
                          const supportsBox = doesProductSupportBox(item.productId);

                          const uniqueProducts = getUniqueProducts();
                          const productOptions = uniqueProducts.map((s) => ({
                            value: s.product.id.toString(),
                            label: s.product.name,
                          }));

                          const itemError = itemsError?.[index];
                          const currentQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
                          const isNegative = currentQuantity < 0;

                          return (
                            <div key={index} className='grid grid-cols-5 items-center gap-4'>
                              {/* Product Selection */}
                              <div>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    const newItems = [...field.value];
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].isBox = false;
                                    newItems[index].quantity = 1;
                                    field.onChange(newItems);
                                  }}
                                  value={productOptions.find(p => p.value === item.productId) || null}
                                  placeholder={loadingProducts ? 'Loading products...' : 'Search product'}
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                                {itemError?.productId && (
                                  <p className='text-sm font-medium text-destructive mt-1'>
                                    {itemError.productId.message}
                                  </p>
                                )}
                              </div>

                              {/* isBox Switch */}
                              <div>
                                <div className='flex items-center justify-center'>
                                  <Switch
                                    checked={isBox}
                                    onCheckedChange={(checked) => {
                                      const newItems = [...field.value];
                                      newItems[index].isBox = checked;
                                      newItems[index].quantity = 1;
                                      field.onChange(newItems);
                                    }}
                                    disabled={!item.productId || loadingProducts || !supportsBox}
                                    className='data-[state=checked]:bg-primary'
                                  />
                                </div>
                              </div>

                              {/* Quantity Input */}
                              <div>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field: quantityField, fieldState: quantityFieldState }) => (
                                    <div>
                                      <Input
                                        type='text'
                                        inputMode='decimal'
                                        placeholder='Qty (+ for add, - for remove)'
                                        value={quantityField.value.toString()}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const validPattern = /^-?\d*\.?\d*$/;
                                          if (validPattern.test(value)) {
                                            quantityField.onChange(value);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === '-' || value === '.') {
                                            quantityField.onChange('0');
                                          } else if (value.endsWith('.')) {
                                            quantityField.onChange(value.slice(0, -1));
                                          }
                                        }}
                                      />
                                      <div className='mt-1 text-xs text-gray-500'>
                                        {(() => {
                                          const numValue = parseFloat(quantityField.value.toString());
                                          if (isNaN(numValue)) {
                                            return 'Enter valid number';
                                          }
                                          return numValue < 0 ? '⚠️ Removing stock' : numValue > 0 ? '➕ Adding stock' : 'Zero adjustment';
                                        })()}
                                      </div>
                                      {quantityFieldState.error && (
                                        <p className='text-sm font-medium text-destructive mt-1'>
                                          {quantityFieldState.error.message}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                />
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

                        <div className='flex justify-end'>
                          <Button
                            type='button'
                            onClick={() => {
                              field.onChange([
                                ...field.value,
                                { productId: '', isBox: false, quantity: 1 }
                              ]);
                            }}
                            disabled={loadingProducts}
                          >
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    {fieldState.error && typeof fieldState.error === 'object' && 'message' in fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message as string}
                      </p>
                    )}
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter notes (optional)' {...field} />
                  </FormControl>
                  {fieldState.error && (
                    <p className='text-sm font-medium text-destructive'>
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button type='submit' disabled={isLoading || loadingProducts}>
                {isEdit ? 'Update' : 'Create'} Stock Correction
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}