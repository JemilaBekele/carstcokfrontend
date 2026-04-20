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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IPurchase } from '@/models/purchase';
import { IProduct } from '@/models/Product';
import { getStores } from '@/service/store';
import { getProducts } from '@/service/Product';
import { createPurchase, updatePurchase } from '@/service/purchase';
import { ISupplier } from '@/models/supplier';
import { getSupplier } from '@/service/supplier';
import { getShops } from '@/service/shop';
import { IShop } from '@/models/shop';
import { useEffect, useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { Modal } from '@/components/ui/modal';
import CreateSupplierModal from './suppliyer';
import { format } from 'date-fns';

// TypeScript interfaces for form values
interface FormItemValues {
  productId: string;
  isBox: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface FormValues {
  invoiceNo: string;
  supplierId: string;
  storeId: string;
  shopId: string;
  locationType: 'store' | 'shop'; // New field to track selection
  purchaseDate: string;
  paymentStatus: string;
  notes?: string;
  items: FormItemValues[];
}

interface PurchaseFormProps {
  initialData: IPurchase | null;
  isEdit?: boolean;
}

export default function PurchaseForm({
  initialData,
  isEdit = false
}: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const router = useRouter();

  // Determine initial location type
  const getInitialLocationType = (): 'store' | 'shop' => {
    if (initialData?.storeId) return 'store';
    if (initialData?.shopId) return 'shop';
    return 'store'; // Default to store
  };

  const form = useForm<FormValues>({
    defaultValues: {
      invoiceNo: initialData?.invoiceNo || '',
      supplierId: initialData?.supplierId?.toString() || '',
      storeId: initialData?.storeId?.toString() || '',
      shopId: initialData?.shopId?.toString() || '',
      locationType: getInitialLocationType(),
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
        : format(new Date(), 'yyyy-MM-dd'),
      paymentStatus: initialData?.paymentStatus || 'PENDING',
      notes: initialData?.notes || '',
      items:
        initialData?.items?.map((item) => ({
          productId: item.productId.toString(),
          isBox: item.isBox || false,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        })) || []
    }
  });

  // Watch location type to conditionally render selects
  const locationType = form.watch('locationType');

  // Calculate totals
  const items = form.watch('items');
  const grandTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );
  const totalProducts = items.filter((item) => item.productId).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch suppliers, stores, shops, products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersData, storesData, shopsData, productsData] = await Promise.all([
          getSupplier(),
          getStores(),
          getShops(),
          getProducts()
        ]);
        setSuppliers(suppliersData);
        setStores(storesData);
        setShops(shopsData);
        setProducts(productsData);
      } catch {
        toast.error('Failed to load suppliers, stores, shops, or products');
      }
    };
    fetchData();
  }, []);

  const handleSupplierCreated = () => {
    setShowSupplierModal(false);
    getSupplier()
      .then(setSuppliers)
      .catch(() => {
        toast.error('Failed to refresh suppliers');
      });
  };

  const updateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const totalPrice = item.quantity * item.unitPrice;

    const updatedItems = [...items];
    updatedItems[index] = { ...item, totalPrice };
    form.setValue('items', updatedItems);
  };

  const validateForm = (data: FormValues): boolean => {
    let isValid = true;

    if (!data.invoiceNo || data.invoiceNo.trim() === '') {
      form.setError('invoiceNo', {
        type: 'manual',
        message: 'Invoice No is required'
      });
      isValid = false;
    }

    if (!data.supplierId || data.supplierId.trim() === '') {
      form.setError('supplierId', {
        type: 'manual',
        message: 'Supplier is required'
      });
      isValid = false;
    }

    // Validate based on location type
    if (data.locationType === 'store') {
      if (!data.storeId || data.storeId.trim() === '') {
        form.setError('storeId', {
          type: 'manual',
          message: 'Store is required'
        });
        isValid = false;
      } else {
        form.clearErrors('storeId');
      }
      // Clear shop value if store is selected
      if (data.shopId) {
        form.setValue('shopId', '');
      }
    } else if (data.locationType === 'shop') {
      if (!data.shopId || data.shopId.trim() === '') {
        form.setError('shopId', {
          type: 'manual',
          message: 'Shop is required'
        });
        isValid = false;
      } else {
        form.clearErrors('shopId');
      }
      // Clear store value if shop is selected
      if (data.storeId) {
        form.setValue('storeId', '');
      }
    }

    if (!data.purchaseDate || data.purchaseDate.trim() === '') {
      form.setError('purchaseDate', {
        type: 'manual',
        message: 'Purchase Date is required'
      });
      isValid = false;
    }

    if (!data.paymentStatus || data.paymentStatus.trim() === '') {
      form.setError('paymentStatus', {
        type: 'manual',
        message: 'Payment status is required'
      });
      isValid = false;
    }

    if (data.items.length === 0) {
      form.setError('items', {
        type: 'manual',
        message: 'At least one item is required'
      });
      isValid = false;
    }

    data.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim() === '') {
        form.setError(`items.${index}.productId` as any, {
          type: 'manual',
          message: 'Product is required'
        });
        isValid = false;
      }

      if (item.quantity <= 0 || isNaN(item.quantity)) {
        form.setError(`items.${index}.quantity` as any, {
          type: 'manual',
          message: 'Quantity must be greater than 0'
        });
        isValid = false;
      }

      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        form.setError(`items.${index}.unitPrice` as any, {
          type: 'manual',
          message: 'Unit price must be positive'
        });
        isValid = false;
      }

      if (item.totalPrice < 0 || isNaN(item.totalPrice)) {
        form.setError(`items.${index}.totalPrice` as any, {
          type: 'manual',
          message: 'Total price must be positive'
        });
        isValid = false;
      }
    });

    return isValid;
  };

  const onSubmit = async (data: FormValues) => {
    form.clearErrors();

    if (!validateForm(data)) {
      return;
    }

    // Debug: Log the form data before sending
    console.log('=== SUBMITTING PURCHASE ===');
    console.log('Form Data:', JSON.stringify(data, null, 2));
    console.log('Items with isBox:');
    data.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productId: item.productId,
        isBox: item.isBox,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      });
    });

    setIsLoading(true);
    try {
      const payload = {
        invoiceNo: data.invoiceNo,
        supplierId: data.supplierId,
        storeId: data.locationType === 'store' ? data.storeId : null,
        shopId: data.locationType === 'shop' ? data.shopId : null,
        purchaseDate: data.purchaseDate,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
        items: data.items.map((item) => ({
          productId: item.productId,
          isBox: item.isBox === true,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice)
        }))
      };

      console.log('Final Payload:', JSON.stringify(payload, null, 2));

      if (isEdit && initialData?.id) {
        await updatePurchase(initialData.id, payload);
        toast.success('Purchase updated successfully');
      } else {
        const response = await createPurchase(payload);
        console.log('Create Purchase Response:', response);
        toast.success('Purchase created successfully');
      }
      router.push('/dashboard/purchase');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      console.error('Error response:', error?.response?.data);
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving purchase.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isMounted) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='invoiceNo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice No</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter invoice number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <div className='flex gap-2'>
                        <div className='flex-1'>
                          <Select
                            instanceId='supplier-select'
                            options={suppliers.map((supplier) => ({
                              value: supplier?.id?.toString() ?? '',
                              label: supplier?.name ?? 'Unnamed Supplier'
                            }))}
                            onChange={(newValue) =>
                              field.onChange(newValue?.value || '')
                            }
                            value={suppliers
                              .map((s) => ({
                                value: s?.id?.toString() ?? '',
                                label: s?.name ?? 'Unnamed Supplier'
                              }))
                              .find((s) => s.value === field.value)}
                            placeholder='Search for a supplier'
                            isSearchable
                            styles={isDark ? darkStyles : {}}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => setShowSupplierModal(true)}
                        >
                          <IconPlus size={16} />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Type Radio Group */}
                <FormField
                  control={form.control}
                  name='locationType'
                  render={({ field }) => (
                    <FormItem className='col-span-full'>
                      <FormLabel>Select Location Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value: 'store' | 'shop') => {
                            field.onChange(value);
                            // Clear the opposite field when switching
                            if (value === 'store') {
                              form.setValue('shopId', '');
                              form.clearErrors('shopId');
                            } else {
                              form.setValue('storeId', '');
                              form.clearErrors('storeId');
                            }
                          }}
                          value={field.value}
                          className='flex space-x-4'
                        >
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='store' id='store' />
                            <label htmlFor='store' className='cursor-pointer'>
                              Store
                            </label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='shop' id='shop' />
                            <label htmlFor='shop' className='cursor-pointer'>
                              Shop
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional Store Field */}
                {locationType === 'store' && (
                  <FormField
                    control={form.control}
                    name='storeId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem
                                key={store.id}
                                value={store.id.toString()}
                              >
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Conditional Shop Field */}
                {locationType === 'shop' && (
                  <FormField
                    control={form.control}
                    name='shopId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a shop' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shops.map((shop) => (
                              <SelectItem
                                key={shop.id}
                                value={shop.id.toString()}
                              >
                                {shop.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='purchaseDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='paymentStatus'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select payment status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PENDING'>Pending</SelectItem>
                        <SelectItem value='PAID'>Paid</SelectItem>
                        <SelectItem value='PARTIAL'>Partial</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='items'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Items</FormLabel>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-6 gap-4 text-sm font-semibold'>
                          <div>Product</div>
                          <div>Box/Piece</div>
                          <div>Quantity</div>
                          <div>Purchase Price</div>
                          <div>Total</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => (
                          <div
                            key={index}
                            className='grid grid-cols-6 items-center gap-4'
                          >
                            {/* Product */}
                            <div>
                              <Select
                                instanceId={`product-select-${index}`}
                                options={products.map((product) => ({
                                  value: product.id.toString(),
                                  label: product.name
                                }))}
                                onChange={(newValue) => {
                                  const newItems = [...field.value];
                                  newItems[index].productId =
                                    newValue?.value || '';
                                  field.onChange(newItems);
                                }}
                                value={products
                                  .map((p) => ({
                                    value: p.id.toString(),
                                    label: p.name
                                  }))
                                  .find((p) => p.value === item.productId)}
                                placeholder='Search product'
                                isSearchable
                                styles={isDark ? darkStyles : {}}
                              />
                            </div>

                            {/* isBox Switch */}
                            <div>
                              <FormField
                                control={form.control}
                                name={`items.${index}.isBox`}
                                render={({ field: switchField }) => (
                                  <div className='flex items-center justify-center'>
                                    <Switch
                                      checked={switchField.value}
                                      onCheckedChange={switchField.onChange}
                                      className='data-[state=checked]:bg-primary'
                                    />
                                  </div>
                                )}
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <Input
                                type='number'
                                placeholder='Qty'
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...field.value];
                                  const quantity = Number(e.target.value);
                                  newItems[index].quantity = isNaN(quantity)
                                    ? 0
                                    : quantity;
                                  newItems[index].totalPrice =
                                    newItems[index].quantity *
                                    newItems[index].unitPrice;
                                  field.onChange(newItems);
                                  updateItemTotal(index);
                                }}
                              />
                            </div>

                            {/* Unit Price */}
                            <div>
                              <Input
                                type='number'
                                placeholder='Price'
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const newItems = [...field.value];
                                  const unitPrice = Number(e.target.value);
                                  newItems[index].unitPrice = isNaN(unitPrice)
                                    ? 0
                                    : unitPrice;
                                  newItems[index].totalPrice =
                                    newItems[index].quantity *
                                    newItems[index].unitPrice;
                                  field.onChange(newItems);
                                  updateItemTotal(index);
                                }}
                              />
                            </div>

                            {/* Total Price */}
                            <div className='flex items-center justify-center'>
                              <span className='text-sm font-medium'>
                                {(item.quantity * item.unitPrice).toFixed(2)}
                              </span>
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
                        ))}

                        {/* Summary Row */}
                        <div className='grid grid-cols-6 items-center gap-4 border-t pt-4'>
                          <div className='col-span-4 text-right font-semibold'>
                            Summary:
                          </div>
                          <div className='text-center text-lg font-bold'>
                            {grandTotal.toFixed(2)}
                          </div>
                          <div></div>
                        </div>

                        <div className='grid grid-cols-6 items-center gap-4'>
                          <div className='col-span-5 text-sm'>
                            Total Products: {totalProducts}
                          </div>
                          <div className='text-right'>
                            <Button
                              type='button'
                              onClick={() => {
                                field.onChange([
                                  ...field.value,
                                  {
                                    productId: '',
                                    isBox: false,
                                    quantity: 1,
                                    unitPrice: 0,
                                    totalPrice: 0
                                  }
                                ]);
                              }}
                            >
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grand Total Display */}
              <div className='rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-lg font-semibold'>Grand Total</div>
                  <div className='text-2xl font-bold text-green-600'>
                    {grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

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
                <Button type='submit' disabled={isLoading}>
                  {isEdit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Supplier Creation Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title='Create New Supplier'
        description={''}
      >
        <CreateSupplierModal
          closeModal={() => setShowSupplierModal(false)}
          onSuccess={handleSupplierCreated}
        />
      </Modal>
    </>
  );
}