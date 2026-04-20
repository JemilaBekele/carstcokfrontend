/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  Calendar,
  User,
  Info,
  Check,
  X,
  Loader2,
  ShoppingCart,
  Truck,
  CreditCard,
  Printer,
  Box,
  PackageOpen,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ISell, ISellItem, SaleStatus, ItemSaleStatus } from '@/models/Sell';
import { cancelSale, getSellId, updateSaleStatus, deliverAllSaleItems } from '@/service/Sell';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserById } from '@/service/user';

type SaleViewProps = {
  id?: string;
};

interface UserShop {
  id: string;
  name: string;
}

interface DeliveryItem {
  itemId: string;
  givenQuantity?: number;
}

const SaleDetailPage: React.FC<SaleViewProps> = ({ id }) => {
  const [sale, setSale] = useState<ISell | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [partialDeliveryDialogOpen, setPartialDeliveryDialogOpen] = useState(false);
  const [selectedItemForPartial, setSelectedItemForPartial] = useState<ISellItem | null>(null);
  const [givenQuantity, setGivenQuantity] = useState<number>(0);
  const [quantityError, setQuantityError] = useState<string>('');
  const [userShops, setUserShops] = useState<UserShop[]>([]);
  const [userShopsMap, setUserShopsMap] = useState<Map<string, UserShop>>(new Map());

  // Get user's accessible shops from API
  useEffect(() => {
    const fetchUserShops = async () => {
      try {
        const userData = await getUserById();
        if (userData && userData.shops) {
          const shops = userData.shops as UserShop[];
          setUserShops(shops);
          
          // Create a map for quick lookup by ID and by name (case-insensitive)
          const shopsMap = new Map<string, UserShop>();
          shops.forEach(shop => {
            shopsMap.set(shop.id, shop);
            shopsMap.set(shop.name.toLowerCase(), shop);
          });
          setUserShopsMap(shopsMap);
          
         
        }
      } catch (error) {
        console.error('Failed to fetch user shops:', error);
      }
    };
    
    fetchUserShops();
  }, []);

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellId(id);
        setSale(saleData);
      } catch {
        toast.error('Failed to fetch sale details');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const handlePrint = () => {
    if (!sale) return;
    window.print();
  };

  const confirmStatusUpdate = async () => {
    if (!id || !selectedStatus) return;

    setUpdating(true);
    try {
      const updatedSale = await updateSaleStatus(id, selectedStatus);
      setSale(updatedSale);
      toast.success(`Sale status updated to ${selectedStatus}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to update sale status to ${selectedStatus}`
      );
    } finally {
      setUpdating(false);
      setStatusUpdateDialog(false);
      setSelectedStatus(null);
    }
  };

  const handleCancelSale = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const updatedSale = await cancelSale(id);
      setSale(updatedSale);
      toast.success('Sale cancelled successfully');
      setCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel sale');
    } finally {
      setUpdating(false);
    }
  };

  // Check if user has access to a shop by ID or name
  const hasShopAccess = (shopId?: string, shopName?: string): boolean => {
    if (!shopId && !shopName) return false;
    
    // Check by ID
    if (shopId && userShopsMap.has(shopId)) {
      return true;
    }
    
    // Check by name (case-insensitive)
    if (shopName && userShopsMap.has(shopName.toLowerCase())) {
      return true;
    }
    
    // Also check if any user shop name matches (case-insensitive)
    const hasAccess = userShops.some(shop => 
      shop.name.toLowerCase() === shopName?.toLowerCase()
    );
    
    return hasAccess;
  };

  const handleDeliverItems = async () => {
    if (!id || selectedItems.length === 0) return;

    // Check if user has access to all selected items' shops
    const selectedSaleItems = sale?.items?.filter(item => selectedItems.includes(item.id)) || [];
    const unauthorizedShops: string[] = [];

    for (const item of selectedSaleItems) {
      const hasAccess = hasShopAccess(item.shop?.id, item.shop?.name);
      if (!hasAccess) {
        unauthorizedShops.push(item.shop?.name || item.shop?.id || 'Unknown Shop');
      }
    }

    if (unauthorizedShops.length > 0) {
      toast.error(`You don't have access to deliver items from shops: ${unauthorizedShops.join(', ')}`);
      return;
    }

    setUpdating(true);
    try {
      const deliveryData = {
        items: selectedItems.map(itemId => ({ itemId }))
      };
      
      await deliverAllSaleItems(id, deliveryData);
      toast.success(`${selectedItems.length} item(s) delivered successfully`);
      
      // Refresh sale data
      const updatedSale = await getSellId(id);
      setSale(updatedSale);
      setSelectedItems([]);
      setDeliverDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deliver items');
    } finally {
      setUpdating(false);
    }
  };

  const handlePartialDelivery = async () => {
    if (!id || !selectedItemForPartial) return;

    if (givenQuantity <= 0) {
      setQuantityError('Quantity must be greater than 0');
      return;
    }

    const maxQuantity = selectedItemForPartial.remainingQuantity || selectedItemForPartial.quantity;
    if (givenQuantity > maxQuantity) {
      setQuantityError(`Quantity cannot exceed ${maxQuantity}`);
      return;
    }

    setUpdating(true);
    try {
      const deliveryData = {
        items: [{ 
          itemId: selectedItemForPartial.id, 
          givenQuantity: givenQuantity 
        }]
      };
      
      await deliverAllSaleItems(id, deliveryData);
      toast.success(`${givenQuantity} item(s) delivered successfully`);
      
      // Refresh sale data
      const updatedSale = await getSellId(id);
      setSale(updatedSale);
      setPartialDeliveryDialogOpen(false);
      setSelectedItemForPartial(null);
      setGivenQuantity(0);
      setQuantityError('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deliver items');
    } finally {
      setUpdating(false);
    }
  };

  const handleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!sale?.items) return;

    // Only select items that user has access to deliver
    const undeliveredItemIds = sale.items
      .filter((item) => 
        item.itemSaleStatus !== ItemSaleStatus.DELIVERED &&
        hasShopAccess(item.shop?.id, item.shop?.name)
      )
      .map((item) => item.id);

    if (selectedItems.length === undeliveredItemIds.length && undeliveredItemIds.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(undeliveredItemIds);
    }
  };

  const openPartialDeliveryModal = (item: ISellItem) => {
    const remainingQty = item.remainingQuantity || item.quantity;
    setSelectedItemForPartial(item);
    setGivenQuantity(remainingQty > 0 ? Math.min(remainingQty, item.quantity) : item.quantity);
    setQuantityError('');
    setPartialDeliveryDialogOpen(true);
  };

  // Check if user can deliver selected items
  const canDeliverSelected = () => {
    if (selectedItems.length === 0) return false;
    
    const selectedSaleItems = sale?.items?.filter(item => selectedItems.includes(item.id)) || [];
    for (const item of selectedSaleItems) {
      if (!hasShopAccess(item.shop?.id, item.shop?.name)) {
        return false;
      }
    }
    return true;
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading sale details...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Sale not found</p>
      </div>
    );
  }

  const hasUndeliveredItems = sale.items?.some(
    (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
  );
  const undeliveredItemsCount =
    sale.items?.filter(
      (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
    ).length || 0;
  
  // Count deliverable items (undelivered and user has access)
  const deliverableItemsCount = sale.items?.filter(
    (item) => 
      item.itemSaleStatus !== ItemSaleStatus.DELIVERED &&
      hasShopAccess(item.shop?.id, item.shop?.name)
  ).length || 0;

  const getStatusVariant = (
    status: SaleStatus
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case SaleStatus.APPROVED:
      case SaleStatus.PARTIALLY_DELIVERED:
        return 'secondary';
      case SaleStatus.CANCELLED:
        return 'destructive';
      case SaleStatus.DELIVERED:
        return 'outline';
      default:
        return 'default';
    }
  };

  const grandTotal = sale.grandTotal || 0;

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Print Button */}
      <div className='flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2'>
        <Button
          onClick={handlePrint}
          variant='outline'
          className='flex w-full items-center justify-center gap-2 sm:w-auto'
        >
          <Printer className='h-4 w-4' />
          Print Invoice
        </Button>
      </div>

      {/* Cancel Sale Modal */}
      <AlertModal
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelSale}
        loading={updating}
        title='Cancel Sale'
        description='Are you sure you want to cancel this sale? This action cannot be undone.'
        confirmText='Cancel Sale'
        cancelText='Go Back'
        variant='destructive'
      />

      {/* Deliver Items Modal */}
      <AlertModal
        isOpen={deliverDialogOpen}
        onClose={() => setDeliverDialogOpen(false)}
        onConfirm={handleDeliverItems}
        loading={updating}
        title='Deliver Items'
        description={`Are you sure you want to deliver ${selectedItems.length} selected item(s)? This action will remove the items from stock and cannot be undone.`}
        confirmText='Confirm Delivery'
        cancelText='Cancel'
        variant='default'
      />

      {/* Partial Delivery Modal */}
      <Dialog open={partialDeliveryDialogOpen} onOpenChange={setPartialDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partial Delivery</DialogTitle>
            <DialogDescription>
              Enter the quantity to deliver for {selectedItemForPartial?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Deliver</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={selectedItemForPartial?.remainingQuantity || selectedItemForPartial?.quantity}
                value={givenQuantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setGivenQuantity(value);
                  if (value > 0) setQuantityError('');
                }}
                placeholder="Enter quantity"
              />
              {quantityError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{quantityError}</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Total Quantity: {selectedItemForPartial?.quantity}</p>
                <p>Already Given: {selectedItemForPartial?.givenQuantity || 0}</p>
                <p>Remaining: {selectedItemForPartial?.remainingQuantity || selectedItemForPartial?.quantity}</p>
                {selectedItemForPartial?.isBox && selectedItemForPartial?.product?.boxSize && (
                  <p className="text-xs">
                    Box size: {selectedItemForPartial.product.boxSize} pieces/box
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setPartialDeliveryDialogOpen(false);
                setSelectedItemForPartial(null);
                setGivenQuantity(0);
                setQuantityError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePartialDelivery} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <AlertDialog
        open={statusUpdateDialog}
        onOpenChange={setStatusUpdateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the sale status to{' '}
              <strong>{selectedStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex flex-col gap-2 text-xl font-bold sm:flex-row sm:items-center sm:gap-2 sm:text-2xl'>
            <div className='flex items-center gap-2'>
              <ShoppingCart className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
              <span className='truncate'>Sale {sale.invoiceNo}</span>
            </div>
            <Badge 
              variant={getStatusVariant(sale.saleStatus)} 
              className='ml-0 mt-1 w-fit sm:ml-2 sm:mt-0'
            >
              {sale.saleStatus === SaleStatus.DELIVERED ? (
                <>
                  <Check className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : sale.saleStatus === SaleStatus.CANCELLED ? (
                <>
                  <X className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : sale.saleStatus === SaleStatus.PARTIALLY_DELIVERED ? (
                <>
                  <Truck className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : (
                <>{sale.saleStatus}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Sale Information */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <Info className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                Sale Information
              </h3>
              <div className='space-y-3'>
                <div className='flex items-start gap-2'>
                  <ShoppingCart className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <p>
                    <span className='font-medium'>Invoice No:</span>{' '}
                    <span className='break-all'>{sale.invoiceNo}</span>
                  </p>
                </div>
                {sale.branch && (
                  <div className='flex items-start gap-2'>
                    <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Branch:</span>{' '}
                      {sale.branch.name}
                    </p>
                  </div>
                )}
                {sale.customer && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Customer:</span>{' '}
                      {sale.customer.name}
                    </p>
                  </div>
                )}
                {sale.createdBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Created By:</span>{' '}
                      {sale.createdBy.name}
                    </p>
                  </div>
                )}
                {sale.updatedBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Updated By:</span>{' '}
                      {sale.updatedBy.name}
                    </p>
                  </div>
                )}
                {sale.notes && (
                  <div>
                    <p className='font-medium'>Notes:</p>
                    <p className='text-muted-foreground wrap-break-word'>{sale.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <CreditCard className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                Financial Details
              </h3>
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  {sale.subTotal > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>Sub Total:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        {(sale.subTotal || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {sale.discount > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>Discount:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        -{(sale.discount || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {sale.vat > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>VAT:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        {(sale.vat || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className='col-span-2 border-t pt-2'>
                    <p className='font-medium text-sm sm:text-base'>Grand Total:</p>
                    <p className='text-muted-foreground text-base font-bold sm:text-lg'>
                      {grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className='space-y-2 pt-2'>
                  <div className='flex items-start gap-2'>
                    <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Sale Date:</span>{' '}
                      {formatDate(sale.saleDate || sale.createdAt)}
                    </p>
                  </div>
                  <div className='flex items-start gap-2'>
                    <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Total Items:</span>{' '}
                      {sale.totalProducts}
                    </p>
                  </div>
                  {hasUndeliveredItems && (
                    <div className='flex items-start gap-2'>
                      <Truck className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' />
                      <div>
                        <p className='font-medium text-amber-600'>
                          Undelivered Items: {undeliveredItemsCount}
                        </p>
                        {deliverableItemsCount < undeliveredItemsCount && (
                          <p className='text-xs text-red-500'>
                            You can only deliver {deliverableItemsCount} of {undeliveredItemsCount} items (no access to some shops)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sale Items Table */}
          {sale.items && sale.items.length > 0 ? (
            <div className='space-y-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h3 className='text-base font-semibold sm:text-lg'>Sale Items</h3>
                {hasUndeliveredItems && deliverableItemsCount > 0 && (
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleSelectAll}
                      disabled={updating}
                      className='w-full sm:w-auto'
                    >
                      {selectedItems.length === deliverableItemsCount && deliverableItemsCount > 0
                        ? 'Deselect All'
                        : 'Select All Deliverable'}
                    </Button>
                    <Button
                      variant='default'
                      size='sm'
                      onClick={() => setDeliverDialogOpen(true)}
                      disabled={updating || selectedItems.length === 0 || !canDeliverSelected()}
                      className='w-full sm:w-auto'
                    >
                      <Truck className='mr-2 h-4 w-4' />
                      Deliver Selected ({selectedItems.length})
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className='overflow-x-auto'>
                <div className='inline-block min-w-full align-middle'>
                  <div className='overflow-hidden border rounded-lg'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {hasUndeliveredItems && deliverableItemsCount > 0 && (
                            <TableHead className='w-12 px-3'>
                              <Checkbox
                                checked={
                                  selectedItems.length === deliverableItemsCount &&
                                  deliverableItemsCount > 0
                                }
                                onCheckedChange={handleSelectAll}
                                disabled={updating}
                              />
                            </TableHead>
                          )}
                          <TableHead className='min-w-40'>Product</TableHead>
                          <TableHead className='min-w-28'>Shop</TableHead>
                          <TableHead className='min-w-24'>Type</TableHead>
                          <TableHead className='min-w-20'>Quantity</TableHead>
                          <TableHead className='min-w-28'>Given</TableHead>
                          <TableHead className='min-w-28'>Remaining</TableHead>
                          <TableHead className='min-w-28'>Unit Price</TableHead>
                          <TableHead className='min-w-28'>Total Price</TableHead>
                          <TableHead className='min-w-32'>Status</TableHead>
                          <TableHead className='min-w-32'>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items.map((item: ISellItem) => {
                          const isDelivered = item.itemSaleStatus === ItemSaleStatus.DELIVERED;
                          const hasAccess = hasShopAccess(item.shop?.id, item.shop?.name);
                          const canDeliver = !isDelivered && hasAccess;
                          const remainingQty = item.remainingQuantity || item.quantity;
                          const givenQty = item.givenQuantity || 0;

                          return (
                            <TableRow
                              key={item.id}
                              className={`
                                ${selectedItems.includes(item.id) ? 'bg-primary/5' : ''}
                                ${isDelivered ? 'opacity-80' : ''}
                              `}
                            >
                              {hasUndeliveredItems && deliverableItemsCount > 0 && (
                                <TableCell className='px-3'>
                                  <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() =>
                                      handleItemSelection(item.id)
                                    }
                                    disabled={
                                      updating ||
                                      isDelivered ||
                                      !hasAccess
                                    }
                                  />
                                </TableCell>
                              )}
                              <TableCell className='font-medium'>
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {item.product?.name || 'Unknown Product'}
                                  </span>
                                  {item.product?.productCode && (
                                    <span className='text-xs text-muted-foreground'>
                                      {item.product.productCode}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span>{item.shop?.name || 'Unknown Shop'}</span>
                                  {!hasAccess && !isDelivered && (
                                    <div className='text-xs text-red-500'>No access to this shop</div>
                                  )}
                                </div>
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
                                {item.isBox && item.product?.boxSize && (
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    {item.product.boxSize} pcs/box
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className='font-medium'>{item.quantity}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium text-green-600'>{givenQty}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium text-orange-600'>{remainingQty}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium'>{item.unitPrice.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-bold'>{item.totalPrice.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-2'>
                                  <Badge
                                    variant={
                                      isDelivered
                                        ? 'default'
                                        : item.itemSaleStatus === ItemSaleStatus.PENDING
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                    className='capitalize'
                                  >
                                    {item.itemSaleStatus.toLowerCase()}
                                  </Badge>
                                  {isDelivered && (
                                    <Check className='h-3 w-3 text-muted-foreground' />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {!isDelivered && hasAccess && (
                                  <div className='flex gap-2'>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => {
                                        setSelectedItems([item.id]);
                                        setDeliverDialogOpen(true);
                                      }}
                                      disabled={updating}
                                    >
                                      <Truck className='mr-1 h-3 w-3' />
                                      Deliver All
                                    </Button>
                                    <Button
                                      variant='secondary'
                                      size='sm'
                                      onClick={() => openPartialDeliveryModal(item)}
                                      disabled={updating || remainingQty <= 0}
                                    >
                                      Partial
                                    </Button>
                                  </div>
                                )}
                                {!isDelivered && !hasAccess && (
                                  <span className='text-xs text-red-500'>No access</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Summary for mobile */}
              <div className='sm:hidden'>
                <Card>
                  <CardContent className='pt-4'>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Total Items:</span>
                        <span className='font-semibold'>{sale.items.length}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Undelivered:</span>
                        <span className='font-semibold text-amber-600'>
                          {undeliveredItemsCount}
                        </span>
                      </div>
                      {hasUndeliveredItems && selectedItems.length > 0 && (
                        <div className='flex items-center justify-between border-t pt-2'>
                          <span className='text-sm font-medium'>Selected:</span>
                          <span className='font-bold text-primary'>
                            {selectedItems.length} items
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground py-8 text-center'>
              <Package className='mx-auto h-12 w-12 opacity-20' />
              <p className='mt-2'>No items found in this sale</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetailPage;