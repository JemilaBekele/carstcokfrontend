/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import SelectReac from 'react-select';
import { Switch } from '@/components/ui/switch';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ISell, ISellItem, ItemSaleStatus } from '@/models/Sell';
import { IAdditionalPrice, IProduct } from '@/models/Product';
import { ICustomer } from '@/models/customer';
import { updateSell } from '@/service/Sell';
import { getCustomer } from '@/service/customer';
import { ActivegetProducts, getProductByShops } from '@/service/Product';
import { getShopsBasedOnUser } from '@/service/shop';
import { IShop } from '@/models/shop';
import { IProductShopAvailability } from '../list';
import { Box, PackageOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Schema for sell update (excluding status fields)
const formSchema = z.object({
  customerId: z.string().optional(),
  branchId: z.string().optional(),
  notes: z.string().optional(),
  saleDate: z.string().min(1, 'Sale date is required'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative'),
  vat: z.coerce.number().min(0, 'VAT cannot be negative')
});

// Extended sell item type for form handling
interface FormSellItem
  extends Omit<ISellItem, 'id' | 'sellId' | 'createdAt' | 'updatedAt'> {
  id?: string;
  tempId: string;
  selectedPrice?: number;
  priceLabel?: string;
  availableQuantity?: number;
}

export default function SalesUpdateForm({
  initialData,
  pageTitle,
  products: initialProducts
}: {
  initialData: ISell | null;
  pageTitle: string;
  products: IProduct[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [cartItems, setCartItems] = useState<FormSellItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [selectedShop, setSelectedShop] = useState<IShop | null>(null);
  const [shopAvailability, setShopAvailability] =
    useState<IProductShopAvailability | null>(null);
  const [selectedPriceOption, setSelectedPriceOption] =
    useState<string>('custom');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isBox, setIsBox] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FormSellItem | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(
      () => ({
        customerId: initialData?.customerId || '',
        branchId: initialData?.branchId || '',
        notes: initialData?.notes || '',
        saleDate: initialData?.saleDate
          ? new Date(initialData.saleDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        discount: initialData?.discount || 0,
        vat: initialData?.vat || 0
      }),
      [initialData]
    )
  });

  const discount =
    useWatch({
      control: form.control,
      name: 'discount'
    }) || 0;

  const vat =
    useWatch({
      control: form.control,
      name: 'vat'
    }) || 0;

  const calculatedTotals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountValue = Number(discount) || 0;
    const vatValue = Number(vat) || 0;
    const grandTotal = subTotal - discountValue + vatValue;

    return {
      subTotal,
      discount: discountValue,
      vat: vatValue,
      grandTotal,
      totalProducts: cartItems.length
    };
  }, [cartItems, discount, vat]);

  // Fetch additional data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const customersData = await getCustomer();
        setCustomers(customersData);

        const shopsData = await getShopsBasedOnUser();
        setShops(shopsData);

        const productsData = await ActivegetProducts();
        setProducts(productsData);
      } catch {
        toast.error('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize cart items from initial data
  useEffect(() => {
    if (initialData?.items) {
      const formattedItems: FormSellItem[] = initialData.items.map((item) => ({
        ...item,
        tempId: item.id,
        selectedPrice: item.unitPrice,
        priceLabel: item.isBox ? 'Box Price' : 'Piece Price',
        availableQuantity: item.quantity
      }));
      setCartItems(formattedItems);
    }
  }, [initialData]);

  // Fetch shop availability when product is selected
  useEffect(() => {
    const fetchShopAvailability = async () => {
      if (!selectedProduct) return;

      try {
        setLoading(true);
        const availabilityData = await getProductByShops(selectedProduct.id);
        setShopAvailability(availabilityData);
      } catch {
        toast.error('Failed to fetch product availability');
      } finally {
        setLoading(false);
      }
    };

    if (selectedProduct) {
      fetchShopAvailability();
    }
  }, [selectedProduct]);

  const getAvailableStockInPieces = useCallback((): number => {
    if (!selectedShop || !shopAvailability) return 0;

    const shopStock = shopAvailability.shops.find(
      (shop) => shop.shopId === selectedShop.id
    );
    return shopStock?.quantity || 0;
  }, [selectedShop, shopAvailability]);

  const getAvailableStockInBoxes = useCallback((): number => {
    const pieces = getAvailableStockInPieces();
    if (!selectedProduct?.hasBox || !selectedProduct?.boxSize || selectedProduct.boxSize <= 0) {
      return pieces;
    }
    return Math.floor(pieces / selectedProduct.boxSize);
  }, [selectedProduct, getAvailableStockInPieces]);

  const getMaxAvailableQuantity = useCallback((): number => {
    if (isBox) {
      return getAvailableStockInBoxes();
    } else {
      return getAvailableStockInPieces();
    }
  }, [isBox, getAvailableStockInBoxes, getAvailableStockInPieces]);

  const getAvailableStockDisplay = useCallback((): string => {
    const pieces = getAvailableStockInPieces();
    
    if (isBox) {
      if (!selectedProduct?.hasBox || !selectedProduct?.boxSize || selectedProduct.boxSize <= 0) {
        return `${pieces} pieces (Box not supported)`;
      }
      const boxes = Math.floor(pieces / selectedProduct.boxSize);
      const remainingPieces = pieces % selectedProduct.boxSize;
      if (boxes === 0) {
        return `${pieces} pieces available`;
      }
      if (remainingPieces === 0) {
        return `${boxes} box(es) available`;
      }
      return `${boxes} box(es) + ${remainingPieces} pieces available`;
    } else {
      return `${pieces} pieces available`;
    }
  }, [selectedProduct, isBox, getAvailableStockInPieces]);

  const getAdditionalPricesForSelectedShop = useCallback((): IAdditionalPrice[] => {
    if (!selectedShop || !shopAvailability) return [];

    const shopStock = shopAvailability.shops.find(
      (shop) => shop.shopId === selectedShop.id
    );
    return shopStock?.additionalPrices || [];
  }, [selectedShop, shopAvailability]);

  const getUnitPrice = useCallback((): number => {
    if (!selectedProduct) return 0;

    if (selectedPriceOption === 'custom') {
      return parseFloat(customPrice) || 0;
    } else {
      const additionalPrice = getAdditionalPricesForSelectedShop().find(
        (option) => option.id === selectedPriceOption
      );
      return additionalPrice?.price || 0;
    }
  }, [selectedProduct, selectedPriceOption, customPrice, getAdditionalPricesForSelectedShop]);

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      const availableStock = getMaxAvailableQuantity();

      if (newQuantity < 1) {
        setQuantity(1);
        return;
      }

      if (newQuantity > availableStock) {
        setQuantity(availableStock);
        return;
      }

      setQuantity(newQuantity);
    },
    [getMaxAvailableQuantity]
  );

  const resetProductModal = useCallback(() => {
    setEditingItem(null);
    setSelectedProduct(null);
    setSelectedShop(null);
    setSelectedPriceOption('custom');
    setCustomPrice('');
    setShopAvailability(null);
    setQuantity(1);
    setIsBox(false);
  }, []);

  const handleAddProductToCart = useCallback(() => {
    if (!selectedProduct || !selectedShop) return;

    const unitPrice = getUnitPrice();
    const priceLabel = isBox ? 'Box Price' : 'Piece Price';

    const availableQuantity = getMaxAvailableQuantity();
    
    // Calculate total pieces for storage
    let totalPieces = quantity;
    if (isBox && selectedProduct.hasBox && selectedProduct.boxSize) {
      totalPieces = quantity * selectedProduct.boxSize;
    }

    if (editingItem) {
      const updatedItem: FormSellItem = {
        ...editingItem,
        productId: selectedProduct.id,
        shopId: selectedShop.id,
        isBox,
        quantity: totalPieces,
        unitPrice,
        totalPrice: unitPrice * totalPieces,
        product: selectedProduct,
        shop: selectedShop,
        selectedPrice: unitPrice,
        priceLabel,
        availableQuantity
      };

      setCartItems((prev) =>
        prev.map((item) =>
          item.tempId === editingItem.tempId ? updatedItem : item
        )
      );
    } else {
      const newItem: FormSellItem = {
        tempId: `new-${Date.now()}`,
        productId: selectedProduct.id,
        shopId: selectedShop.id,
        isBox,
        itemSaleStatus: ItemSaleStatus.PENDING,
        quantity: totalPieces,
        unitPrice,
        totalPrice: unitPrice * totalPieces,
        product: selectedProduct,
        shop: selectedShop,
        selectedPrice: unitPrice,
        priceLabel,
        availableQuantity
      };

      setCartItems((prev) => [...prev, newItem]);
    }

    resetProductModal();
    setShowProductModal(false);
  }, [selectedProduct, selectedShop, getUnitPrice, isBox, getMaxAvailableQuantity, quantity, editingItem, resetProductModal]);

  const handleEditItem = useCallback((item: FormSellItem) => {
    setEditingItem(item);
    setSelectedProduct(item.product || null);
    setSelectedShop(item.shop || null);
    setCustomPrice(item.unitPrice.toString());
    setQuantity(item.quantity);
    setIsBox(item.isBox || false);
    setSelectedPriceOption('custom');
    setShowProductModal(true);
  }, []);

  const updateCartItem = useCallback(
    (tempId: string, updates: Partial<FormSellItem>) => {
      setCartItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  const removeCartItem = useCallback((tempId: string) => {
    setCartItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (cartItems.length === 0) {
      toast.error('Please add at least one product to the sale');
      return;
    }

    try {
      setLoading(true);
      const subTotal = cartItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const discountValue = Number(data.discount) || 0;
      const vatValue = Number(data.vat) || 0;
      const grandTotal = subTotal - discountValue + vatValue;
      
      const updateData = {
        ...data,
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          shopId: item.shopId,
          isBox: item.isBox,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          itemSaleStatus: item.itemSaleStatus
        })),
        totalProducts: calculatedTotals.totalProducts,
        subTotal: calculatedTotals.subTotal,
        discount: discountValue,
        vat: vatValue,
        grandTotal: grandTotal,
        NetTotal: grandTotal
      };

      await updateSell(initialData!.id, updateData);
      toast.success('Sale updated successfully');
      router.refresh();
      router.push('/dashboard/UserBasedSell');
    } catch (error: any) {
      toast.error(error?.message || 'Error updating sale');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(price);
  }, []);

  useEffect(() => {
    if (selectedShop && selectedProduct) {
      setCustomPrice('');
      setSelectedPriceOption('custom');
      setQuantity(1);
      setIsBox(false);
    }
  }, [selectedShop, selectedProduct]);

  useEffect(() => {
    if (selectedShop && quantity > getMaxAvailableQuantity()) {
      setQuantity(getMaxAvailableQuantity());
    }
  }, [selectedShop, quantity, shopAvailability, getMaxAvailableQuantity]);

  if (!initialData) {
    return <div>Loading...</div>;
  }

  const availableStock = getMaxAvailableQuantity();
  const unitPrice = getUnitPrice();
  const totalPrice = unitPrice * (isBox && selectedProduct?.boxSize ? quantity * selectedProduct.boxSize : quantity);
  const additionalPrices = getAdditionalPricesForSelectedShop();
  const canShowBoxes = selectedProduct?.hasBox && selectedProduct?.boxSize && selectedProduct.boxSize > 0;

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.name}`,
    data: product,
    searchText: `${product.name} ${product.generic || ''} ${product.productCode}`.toLowerCase()
  }));

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>{pageTitle}</span>
          <span className='text-sm font-normal text-gray-500'>
            Invoice: {initialData.invoiceNo}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <FormField
                  name='customerId'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select customer' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id ?? ''}
                            >
                              {customer.name}{' '}
                              {customer.companyName &&
                                `- ${customer.companyName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name='saleDate'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='space-y-4'>
                <FormField
                  name='discount'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.01' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name='vat'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.01' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              name='notes'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Additional notes...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add Product Button */}
            <div className='flex items-center justify-between'>
              <FormLabel className='text-lg'>Products</FormLabel>
              <Button
                type='button'
                onClick={() => setShowProductModal(true)}
                className='bg-blue-600 hover:bg-blue-700'
              >
                Add Product
              </Button>
            </div>

            {/* Cart Items */}
            <div className='space-y-4'>
              {cartItems.length === 0 ? (
                <div className='rounded-lg border py-8 text-center text-gray-500'>
                  No products added to the sale. Click &quot;Add Product&quot;
                  to start.
                </div>
              ) : (
                <div className='space-y-3'>
                  {cartItems.map((item) => (
                    <div
                      key={item.tempId}
                      className='grid grid-cols-1 items-center gap-4 rounded-lg border p-4 md:grid-cols-12'
                    >
                      {/* Product Info */}
                      <div className='md:col-span-3'>
                        <p className='font-medium'>{item.product?.name}</p>
                        <p className='text-sm text-gray-500'>
                          {item.shop?.name}
                        </p>
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
                      </div>

                      {/* Quantity */}
                      <div className='md:col-span-2'>
                        <FormLabel className='text-sm'>Quantity</FormLabel>
                        <Input
                          type='number'
                          min='1'
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(item.tempId, {
                              quantity: Number(e.target.value),
                              totalPrice:
                                item.unitPrice * Number(e.target.value)
                            })
                          }
                        />
                      </div>

                      {/* Unit Price */}
                      <div className='md:col-span-2'>
                        <FormLabel className='text-sm'>Unit Price</FormLabel>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateCartItem(item.tempId, {
                              unitPrice: Number(e.target.value),
                              totalPrice: Number(e.target.value) * item.quantity
                            })
                          }
                        />
                      </div>

                      {/* Total Price */}
                      <div className='md:col-span-2'>
                        <FormLabel className='text-sm'>Total</FormLabel>
                        <p className='font-medium'>
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className='flex gap-2 md:col-span-1'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditItem(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={() => removeCartItem(item.tempId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className='space-y-2 border-t pt-4'>
              <div className='flex justify-between'>
                <span>Subtotal:</span>
                <span>{formatPrice(calculatedTotals.subTotal)}</span>
              </div>
              <div className='flex justify-between'>
                <span>Discount:</span>
                <span>-{formatPrice(calculatedTotals.discount)}</span>
              </div>
              <div className='flex justify-between'>
                <span>VAT:</span>
                <span>+{formatPrice(calculatedTotals.vat)}</span>
              </div>
              <div className='flex justify-between border-t pt-2 text-lg font-bold'>
                <span>Grand Total:</span>
                <span>{formatPrice(calculatedTotals.grandTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col justify-end space-y-2 pt-4 sm:flex-row sm:space-y-0 sm:space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='w-full sm:w-auto'
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='w-full sm:w-auto'
                disabled={loading || cartItems.length === 0}
              >
                {loading ? 'Updating...' : 'Update Sale'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Product Selection Modal */}
        <Modal
          title={editingItem ? 'Edit Product' : 'Add Product to Sale'}
          description={
            editingItem
              ? 'Update the product, shop, quantity, and price for this sale item'
              : 'Select a product, shop, quantity, and price to add to the sale'
          }
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            resetProductModal();
          }}
          size='xl'
        >
          <div className='space-y-4'>
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Search Product</Label>
              <SelectReac
                options={productOptions}
                value={
                  selectedProduct
                    ? productOptions.find(opt => opt.value === selectedProduct.id) || null
                    : null
                }
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setSelectedProduct(selectedOption.data);
                    setSelectedShop(null);
                  } else {
                    setSelectedProduct(null);
                    setSelectedShop(null);
                  }
                }}
                filterOption={(option, inputValue) => {
                  if (!inputValue) return true;
                  const searchTerm = inputValue.toLowerCase();
                  const product = option.data;
                  if (!product) return false;
                  const name = product.data?.name?.toLowerCase() || '';
                  const generic = product.data?.generic?.toLowerCase() || '';
                  const productCode = product.data?.productCode?.toLowerCase() || '';
                  return (
                    name.includes(searchTerm) ||
                    generic.includes(searchTerm) ||
                    productCode.includes(searchTerm)
                  );
                }}
                placeholder="Type to search products (by name, generic name, or code)..."
                isClearable
                isSearchable
                noOptionsMessage={() => 'No products found'}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                  }),
                }}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Shop Availability Overview */}
            {selectedProduct && !selectedShop && shopAvailability && (
              <div className='space-y-3'>
                <Label className='font-semibold'>
                  Product Availability Overview
                </Label>
                <div className='overflow-hidden rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shop Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Available Quantity</TableHead>
                        <TableHead>Base Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopAvailability.shops.map((shop) => (
                        <TableRow key={shop.shopId}>
                          <TableCell className='font-medium'>
                            {shop.shopName}
                          </TableCell>
                          <TableCell>{shop.branchName}</TableCell>
                          <TableCell className='font-bold text-green-600'>
                            {shop.quantity} pieces
                            {shop.availableBoxes > 0 && (
                              <div className='text-xs text-gray-500'>
                                ({shop.availableBoxes} boxes + {shop.remainingPieces} pieces)
                              </div>
                            )}
                          </TableCell>
                          <TableCell className='font-bold text-blue-600'>
                            {formatPrice(shop.totalPrice || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Shop Selection */}
            {selectedProduct && (
              <div className='space-y-2'>
                <Label>Select Shop</Label>
                <Select
                  value={selectedShop?.id || ''}
                  onValueChange={(value) => {
                    const shop = shops.find((s) => s.id === value);
                    setSelectedShop(shop || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a shop' />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}{' '}
                        {shop.branch?.name && `(${shop.branch.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Box/Piece Toggle */}
            {selectedShop && selectedProduct && canShowBoxes && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='flex items-center gap-2'>
                    {isBox ? (
                      <Box className='h-5 w-5 text-blue-500' />
                    ) : (
                      <PackageOpen className='h-5 w-5 text-green-500' />
                    )}
                    <span className='text-sm font-medium'>
                      {isBox ? 'Selling as Boxes' : 'Selling as Pieces'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs text-gray-500'>Pieces</span>
                    <Switch
                      checked={isBox}
                      onCheckedChange={(checked) => {
                        setIsBox(checked);
                        setQuantity(1);
                      }}
                      className='data-[state=checked]:bg-primary'
                    />
                    <span className='text-xs text-gray-500'>Boxes</span>
                  </div>
                </div>
                {isBox && (
                  <p className='text-xs text-gray-500'>
                    Box size: {selectedProduct?.boxSize} pieces per box
                  </p>
                )}
              </div>
            )}

            {/* Price Selection */}
            {selectedShop && selectedProduct && (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Unit Price (per {isBox ? 'box' : 'piece'})</Label>
                  <Input
                    type='number'
                    min='0'
                    step='0.01'
                    value={customPrice}
                    onChange={(e) => {
                      setSelectedPriceOption('custom');
                      setCustomPrice(e.target.value);
                    }}
                    placeholder={`Enter price per ${isBox ? 'box' : 'piece'}`}
                  />
                </div>

                {additionalPrices.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Recommended Prices</Label>
                    <div className='flex flex-wrap gap-2'>
                      {additionalPrices.map((option) => (
                        <Button
                          key={option.id}
                          type='button'
                          variant={
                            selectedPriceOption === option.id
                              ? 'default'
                              : 'outline'
                          }
                          size='sm'
                          onClick={() => {
                            setSelectedPriceOption(option.id);
                            setCustomPrice(option.price.toString());
                          }}
                        >
                          {option.label}: {formatPrice(option.price)} per piece
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Input */}
            {selectedShop && (
              <div className='space-y-2'>
                <Label>Quantity ({isBox ? 'Boxes' : 'Pieces'})</Label>
                <Input
                  type='number'
                  min='1'
                  max={availableStock}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                />
                <p
                  className={`text-sm ${quantity > availableStock ? 'font-semibold text-red-600' : 'text-gray-500'}`}
                >
                  {getAvailableStockDisplay()}
                  {quantity > availableStock &&
                    ' - Quantity exceeds available stock!'}
                </p>
              </div>
            )}

            {/* Price Summary */}
            {selectedShop && (
              <div className='rounded-md border bg-gray-50 p-4'>
                <h4 className='mb-3 font-semibold'>Order Summary</h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Unit Price (per {isBox ? 'box' : 'piece'}):</span>
                    <span className='font-bold text-green-600'>
                      {formatPrice(unitPrice)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Quantity ({isBox ? 'Boxes' : 'Pieces'}):</span>
                    <span>{quantity}</span>
                  </div>
                  {isBox && selectedProduct?.boxSize && (
                    <div className='flex justify-between'>
                      <span className='font-medium'>Total Pieces:</span>
                      <span>{quantity * selectedProduct.boxSize} pieces</span>
                    </div>
                  )}
                  <div className='border-t pt-2'>
                    <div className='flex justify-between font-bold'>
                      <span>Total:</span>
                      <span className='text-blue-600'>
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {selectedShop && (
              <div className='flex justify-end'>
                <Button
                  onClick={handleAddProductToCart}
                  disabled={
                    !selectedShop ||
                    quantity > availableStock ||
                    quantity <= 0 ||
                    availableStock === 0
                  }
                >
                  {editingItem ? 'Update Product' : 'Add to Sale'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}