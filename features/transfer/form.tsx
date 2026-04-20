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
import { getStores, getStoresall } from '@/service/store';
import { getShops, getShopsall } from '@/service/shop';
import { createTransfer, updateTransfer } from '@/service/transfer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { ITransfer, TransferEntityType } from '@/models/transfer';
import { getAvailableProductsBySource } from '@/service/productBatchService';

interface FormData {
  reference?: string;
  sourceType: TransferEntityType;
  sourceStoreId?: string;
  sourceShopId?: string;
  destinationType: TransferEntityType;
  destStoreId?: string;
  destShopId?: string;
  notes?: string;
  items: Array<{
    productId: string;
    isBox: boolean;
    quantity: number;
  }>;
}

interface TransferFormProps {
  initialData: ITransfer | null;
  isEdit?: boolean;
}

interface StoreStockItem {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    branchId: string;
  };
  product: {
    id: string;
    productCode: string;
    name: string;
    generic: string | null;
    description: string | null;
    sellPrice: number | null;
    imageUrl: string;
    isActive: boolean;
    hasBox: boolean;
    boxSize: number | null;
    UnitOfMeasure: string | null;
    category: any;
    brand: any;
  };
}

export default function TransferForm({
  initialData,
  isEdit = false
}: TransferFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [disstores, setDisstores] = useState<any[]>([]);
  const [disshops, setDisshops] = useState<any[]>([]);
  const [storeStockItems, setStoreStockItems] = useState<StoreStockItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStoresShops, setLoadingStoresShops] = useState(true);
  
  const hasFetchedProductsRef = useRef(false);
  const lastSourceRef = useRef<string>('');
  
  const router = useRouter();

  const form = useForm<FormData>({
    defaultValues: {
      reference: initialData?.reference || '',
      sourceType: initialData?.sourceType || TransferEntityType.STORE,
      sourceStoreId: initialData?.sourceStoreId || '',
      sourceShopId: initialData?.sourceShopId || '',
      destinationType: initialData?.destinationType || TransferEntityType.STORE,
      destStoreId: initialData?.destStoreId || '',
      destShopId: initialData?.destShopId || '',
      notes: initialData?.notes || '',
      items: initialData?.items?.map((item) => ({
        productId: item.productId.toString(),
        isBox: item.isBox || false,
        quantity: Number(item.quantity)
      })) || [{ productId: '', isBox: false, quantity: 1 }]
    }
  });

  const sourceType = form.watch('sourceType');
  const sourceStoreId = form.watch('sourceStoreId');
  const sourceShopId = form.watch('sourceShopId');
  const destinationType = form.watch('destinationType');

  const currentSource = `${sourceType}-${sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShopId}`;

  // Helper: get available stock item by productId
  const getAvailableStock = (productId: string): StoreStockItem | undefined => {
    return storeStockItems.find((stock) => stock.product.id.toString() === productId);
  };






  // Cross-check before submit: convert to pieces and compare with available pieces
  const validateItemsPieces = (items: FormData['items']): boolean => {
    for (const item of items) {
      if (!item.productId) continue;
      const stock = getAvailableStock(item.productId);
      if (!stock) {
        toast.error(`Product not found in stock`);
        return false;
      }
      let requestedPieces = item.quantity;
      if (item.isBox) {
        const boxSize = stock.product.boxSize;
        if (!boxSize) {
          toast.error(`Product ${stock.product.name} has no box size defined`);
          return false;
        }
        requestedPieces = item.quantity * boxSize;
      }
      if (requestedPieces > stock.quantity) {
        toast.error(`${stock.product.name}: Not enough stock. Available: ${stock.quantity} pieces, Requested: ${requestedPieces} pieces.`);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch stores and shops
  useEffect(() => {
    const fetchData = async () => {
      setLoadingStoresShops(true);
      try {
        const [storesData, shopsData, disstoresData, disshopsData] = await Promise.all([
          getStores(),
          getShops(),
          getShopsall(),
          getStoresall(),
        ]);
        setStores(storesData);
        setShops(shopsData);
        setDisshops(disstoresData);
        setDisstores(disshopsData);
      } catch {
        toast.error('Failed to load stores or shops');
      } finally {
        setLoadingStoresShops(false);
      }
    };
    fetchData();
  }, []);

  // Fetch products from source
  const fetchProductsFromSource = useCallback(async () => {
    if (
      (sourceType === TransferEntityType.STORE && !sourceStoreId) ||
      (sourceType === TransferEntityType.SHOP && !sourceShopId)
    ) {
      setStoreStockItems([]);
      hasFetchedProductsRef.current = false;
      lastSourceRef.current = '';
      return;
    }

    if (currentSource === lastSourceRef.current && hasFetchedProductsRef.current) {
      return;
    }

    setLoadingProducts(true);
    hasFetchedProductsRef.current = true;
    lastSourceRef.current = currentSource;

    try {
      const sourceId = sourceType === TransferEntityType.STORE ? sourceStoreId : sourceShopId;
      if (!sourceId) return;

      const storeStockData = await getAvailableProductsBySource(sourceType, sourceId);
   
      setStoreStockItems(storeStockData);
    } catch {
      toast.error('Failed to load products from source');
      setStoreStockItems([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentSource, sourceType, sourceStoreId, sourceShopId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductsFromSource();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchProductsFromSource]);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb'
    }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2937', color: '#f9fafb' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb'
    }),
    singleValue: (base: any) => ({ ...base, color: '#f9fafb' }),
    input: (base: any) => ({ ...base, color: '#f9fafb' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af' })
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Basic validations
      if (data.sourceType === TransferEntityType.STORE && !data.sourceStoreId) {
        toast.error('Source store is required');
        setIsLoading(false);
        return;
      }
      if (data.sourceType === TransferEntityType.SHOP && !data.sourceShopId) {
        toast.error('Source shop is required');
        setIsLoading(false);
        return;
      }
      if (data.destinationType === TransferEntityType.STORE && !data.destStoreId) {
        toast.error('Destination store is required');
        setIsLoading(false);
        return;
      }
      if (data.destinationType === TransferEntityType.SHOP && !data.destShopId) {
        toast.error('Destination shop is required');
        setIsLoading(false);
        return;
      }
      if (
        (data.sourceType === TransferEntityType.STORE && data.destinationType === TransferEntityType.STORE && data.sourceStoreId === data.destStoreId) ||
        (data.sourceType === TransferEntityType.SHOP && data.destinationType === TransferEntityType.SHOP && data.sourceShopId === data.destShopId)
      ) {
        toast.error('Source and destination cannot be the same');
        setIsLoading(false);
        return;
      }

      // Filter out incomplete items
      const validItems = data.items.filter(item => item.productId && item.quantity > 0);
      if (validItems.length === 0) {
        toast.error('Please add at least one valid item');
        setIsLoading(false);
        return;
      }

      // ** Cross-check stock in pieces (ultimate validation) **
      if (!validateItemsPieces(validItems)) {
        setIsLoading(false);
        return;
      }

      // Prepare payload
      const cleanedPayload = {
        ...data,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        sourceStoreId: data.sourceStoreId || undefined,
        sourceShopId: data.sourceShopId || undefined,
        destStoreId: data.destStoreId || undefined,
        destShopId: data.destShopId || undefined,
        items: validItems.map(item => ({
          productId: item.productId.toString(),
          isBox: item.isBox,
          quantity: Number(item.quantity)
        }))
      };

      if (isEdit && initialData?.id) {
        await updateTransfer(initialData.id, cleanedPayload);
        toast.success('Transfer updated successfully');
        router.push(`/dashboard/Transfer/view?id=${initialData?.id}`);
      } else {
        const newTransfer = await createTransfer(cleanedPayload);
        toast.success('Transfer created successfully');
        router.push(`/dashboard/Transfer/view?id=${newTransfer.transfer.id}`);
      }
      router.refresh();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'An error occurred while saving transfer.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || loadingStoresShops) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Transfer' : 'Create Transfer'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2'></div>
              <div>Loading...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Transfer' : 'Create Transfer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='reference'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter transfer reference' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div></div>
            </div>

            {/* Source and Destination Section */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Source Column */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Source</h3>
                <FormField
                  control={form.control}
                  name='sourceType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) form.setValue('sourceShopId', '');
                          else form.setValue('sourceStoreId', '');
                          form.setValue('items', [{ productId: '', isBox: false, quantity: 1 }]);
                          setStoreStockItems([]);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder='Select source type' /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransferEntityType.STORE}>Store</SelectItem>
                          <SelectItem value={TransferEntityType.SHOP}>Shop</SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {sourceType === TransferEntityType.STORE && (
                  <FormField
                    control={form.control}
                    name='sourceStoreId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', isBox: false, quantity: 1 }]);
                            setStoreStockItems([]);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder='Select source store' /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {sourceType === TransferEntityType.SHOP && (
                  <FormField
                    control={form.control}
                    name='sourceShopId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', isBox: false, quantity: 1 }]);
                            setStoreStockItems([]);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder='Select source shop' /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shops.map((shop) => (
                              <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Destination Column */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Destination</h3>
                <FormField
                  control={form.control}
                  name='destinationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: TransferEntityType) => {
                          field.onChange(value);
                          if (value === TransferEntityType.STORE) form.setValue('destShopId', '');
                          else form.setValue('destStoreId', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder='Select destination type' /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TransferEntityType.STORE}>Store</SelectItem>
                          <SelectItem value={TransferEntityType.SHOP}>Shop</SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {destinationType === TransferEntityType.STORE && (
                  <FormField
                    control={form.control}
                    name='destStoreId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder='Select destination store' /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disstores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {destinationType === TransferEntityType.SHOP && (
                  <FormField
                    control={form.control}
                    name='destShopId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <ShadcnSelect value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder='Select destination shop' /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disshops.map((shop) => (
                              <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Items Section */}
            <FormField
              control={form.control}
              name='items'
              render={({ field }) => {
                // Force re-render when form values change
                const formValues = form.watch();
                
                return (
                  <FormItem>
                    <FormLabel>Items</FormLabel>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div>Product</div>
                          <div>Box/Piece</div>
                          <div>Quantity</div>
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
                          const remainingPieces = pieces % boxSize;
                          const hasBox = stockItem?.product.hasBox || false;
                          
                          // Calculate max quantity based on current isBox state
                          const maxQuantity = isBox ? boxes : pieces;
                          
                          // Determine available stock display
                          let availableDisplay = 'Select product';
                          if (item.productId && stockItem) {
                            if (isBox) {
                              if (!hasBox) {
                                availableDisplay = 'Box not supported';
                              } else if (boxes === 0) {
                                availableDisplay = '0 boxes available';
                              } else {
                                availableDisplay = `${boxes} box(es) available${remainingPieces > 0 ? ` (${remainingPieces} pieces left)` : ''}`;
                              }
                            } else {
                              availableDisplay = `${pieces} piece(s) available`;
                            }
                          } else if (item.productId) {
                            availableDisplay = 'Loading...';
                          }
                          
                          const uniqueProducts = Array.from(
                            new Map(storeStockItems.map(s => [s.product.id, s])).values()
                          );
                          const productOptions = uniqueProducts.map((s) => ({
                            value: s.product.id.toString(),
                            label: s.product.name,
                          }));


                          return (
                            <div key={index} className='grid grid-cols-6 items-center gap-4'>
                              {/* Product */}
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
                                  placeholder='Search product'
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  isLoading={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              {/* Box/Piece Switch */}
                              <div>
                                <div className='flex items-center justify-center'>
                                  <Switch
                                    checked={isBox}
                                    onCheckedChange={(checked) => {
                                      const newItems = [...field.value];
                                      newItems[index].isBox = checked;
                                      newItems[index].quantity = 1; // Reset quantity on toggle
                                      field.onChange(newItems);
                                    }}
                                    disabled={!item.productId || loadingProducts || !hasBox}
                                    className='data-[state=checked]:bg-primary'
                                  />
                                </div>
                              </div>

                              {/* Quantity */}
                              <div>
                                <Input
                                  type='number'
                                  placeholder='Qty'
                                  value={item.quantity}
                                  min={1}
                                  max={maxQuantity}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    let qty = Number(e.target.value);
                                    if (isNaN(qty)) qty = 0;
                                    if (qty > maxQuantity && maxQuantity > 0) {
                                      qty = maxQuantity;
                                      toast.warning(`Maximum ${maxQuantity} ${isBox ? 'boxes' : 'pieces'} available`);
                                    }
                                    if (qty < 0) qty = 0;
                                    newItems[index].quantity = qty;
                                    field.onChange(newItems);
                                  }}
                                  disabled={!item.productId || loadingProducts || maxQuantity === 0}
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
                                    {isBox && hasBox && boxSize > 0 && (
                                      <div className='text-xs text-gray-500'>{boxSize} pieces per box</div>
                                    )}
                                    {isBox && !hasBox && (
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
                                  disabled={field.value.length <= 1 || loadingProducts}
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
                    <FormMessage />
                  </FormItem>
                );
              }}
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
              <Button type='submit' disabled={isLoading} className='min-w-24'>
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </div>
                ) : isEdit ? (
                  'Update Transfer'
                ) : (
                  'Create Transfer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}