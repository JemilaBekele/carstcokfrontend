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

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ISell } from '@/models/Sell';
import { ISellStockCorrection } from '@/models/SellStockCorrection';
import { createSellStockCorrection } from '@/service/SellStockCorrection';

// Updated schema with quantity validation
const formSchema = z.object({
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      shopId: z.string().optional(),
      unitOfMeasureId: z.string(),
      quantity: z.number(),
      unitPrice: z.number().min(0),
      totalPrice: z.number().min(0),
      batches: z.array(
        z.object({
          batchId: z.string(),
          quantity: z.number()
        })
      )
    })
  )
});

interface SellCorrectionFormProps {
  sellId: string;
  initialData: ISellStockCorrection | null;
  sellData: ISell | null;
}

export default function SellCorrectionForm({
  sellId,
  initialData,
  sellData
}: SellCorrectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const calculateTotals = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    return total;
  };

  const defaultValues = useMemo(() => {
    if (initialData) {
      return {
        notes: initialData.notes || '',
        items:
          initialData.items?.map((item) => ({
            productId: item.productId,
            shopId: item.shopId,
            unitOfMeasureId: item.unitOfMeasureId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            batches:
              item.batches?.map((batch) => ({
                batchId: batch.batchId,
                quantity: batch.quantity
              })) || []
          })) || []
      };
    }

    // Create from sell data
    return {
      notes: '',
      items:
        sellData?.items?.map((item) => {
          const totalPrice =
            Number(item.unitPrice) * Math.abs(Number(item.quantity));

          return {
            productId: item.productId,
            shopId: item.shopId,
            quantity: 0, // Start with 0 adjustment
            unitPrice: Number(item.unitPrice),
            totalPrice: totalPrice,
        
        }) || []
    };
  }, [initialData, sellData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Watch items to recalculate totals
  const items = form.watch('items');
  const totalAmount = calculateTotals(items || []);

  // Calculate item quantity from batch quantities
  const calculateItemQuantityFromBatches = (batches: any[]) => {
    return batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  };

  // Validate if adjustment quantity exceeds original quantity
  const validateAdjustmentQuantity = (
    itemIndex: number,
    batchIndex: number,
    newQuantity: number,
    originalSellBatchQuantity: number
  ): boolean => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (!item || !item.batches) return false;

    // Calculate total adjustment so far (excluding current batch)
    let totalAdjustment = 0;
    item.batches.forEach((batch, idx) => {
      if (idx !== batchIndex) {
        totalAdjustment += batch.quantity || 0;
      }
    });
    
    // Add the new quantity
    totalAdjustment += newQuantity;
    
    // Get the original total quantity for this item from sell data
    const originalItemQuantity = Math.abs(sellData?.items?.[itemIndex]?.quantity || 0);
    
    // Check if total adjustment exceeds original quantity
    if (Math.abs(totalAdjustment) > originalItemQuantity) {
      toast.error(`Adjustment cannot exceed original quantity of ${originalItemQuantity}`);
      return false;
    }

    // Also check individual batch adjustment doesn't exceed original batch quantity
    if (Math.abs(newQuantity) > Math.abs(originalSellBatchQuantity)) {
      toast.error(`Batch adjustment cannot exceed original batch quantity of ${Math.abs(originalSellBatchQuantity)}`);
      return false;
    }

    return true;
  };

  // Update item quantity and total price when batches change
  const updateItemFromBatches = (itemIndex: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];

    if (item && item.batches) {
      const newQuantity = calculateItemQuantityFromBatches(item.batches);
      const originalItemQuantity = Math.abs(sellData?.items?.[itemIndex]?.quantity || 0);
      
      // Validate the total adjustment doesn't exceed original quantity
      if (Math.abs(newQuantity) > originalItemQuantity) {
        toast.error(`Total adjustment cannot exceed original quantity of ${originalItemQuantity}`);
        return;
      }

      const totalPrice = Math.abs(newQuantity) * item.unitPrice;

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...item,
        quantity: newQuantity,
        totalPrice: totalPrice
      };

      form.setValue('items', updatedItems);
    }
  };

  const handleBatchQuantityChange = (
    itemIndex: number,
    batchIndex: number,
    newQuantity: number
  ) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    const originalSellBatchQuantity = sellData?.items?.[itemIndex]?.batches?.[batchIndex]?.quantity || 0;

    // Validate the adjustment
    if (!validateAdjustmentQuantity(itemIndex, batchIndex, newQuantity, originalSellBatchQuantity)) {
      return;
    }

    if (item && item.batches) {
      const updatedBatches = [...item.batches];
      updatedBatches[batchIndex] = {
        ...updatedBatches[batchIndex],
        quantity: newQuantity
      };

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...item,
        batches: updatedBatches
      };

      form.setValue('items', updatedItems);

      // Automatically update the item quantity based on batch quantities
      setTimeout(() => {
        updateItemFromBatches(itemIndex);
      }, 0);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!sellData) {
      toast.error('Sell data not found');
      return;
    }

    // Final validation before submission
    let hasExceededQuantity = false;
    
    data.items.forEach((item, itemIndex) => {
      const originalItemQuantity = Math.abs(sellData.items?.[itemIndex]?.quantity || 0);
      const totalAdjustment = Math.abs(item.quantity);
      
      if (totalAdjustment > originalItemQuantity) {
        toast.error(`Item "${sellData.items?.[itemIndex]?.product?.name || 'Unknown'}" adjustment (${totalAdjustment}) exceeds original quantity (${originalItemQuantity})`);
        hasExceededQuantity = true;
      }

      // Validate each batch
      item.batches.forEach((batch, batchIndex) => {
        const originalBatchQuantity = Math.abs(sellData.items?.[itemIndex]?.batches?.[batchIndex]?.quantity || 0);
        if (Math.abs(batch.quantity) > originalBatchQuantity) {
          toast.error(`Batch adjustment (${Math.abs(batch.quantity)}) exceeds original batch quantity (${originalBatchQuantity})`);
          hasExceededQuantity = true;
        }
      });
    });

    if (hasExceededQuantity) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter items and batches before sending to backend
      const filteredItems = data.items
        .map((item) => {
          // Filter out batches with zero quantity
          const filteredBatches = item.batches.filter(
            (batch) => batch.quantity !== 0
          );

          return {
            ...item,
            batches: filteredBatches,
            // Recalculate quantity based on filtered batches
            quantity: filteredBatches.reduce(
              (sum, batch) => sum + batch.quantity,
              0
            ),
            // Recalculate total price based on filtered batches
            totalPrice:
              Math.abs(
                filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0)
              ) * item.unitPrice
          };
        })
        // Filter out items where total quantity is zero or below
        .filter((item) => item.quantity !== 0);

      // Check if there are any items left after filtering
      if (filteredItems.length === 0) {
        toast.error(
          'Please add at least one item with non-zero quantity adjustment'
        );
        setIsSubmitting(false);
        return;
      }

      // Recalculate total amount based on filtered items
      const filteredTotalAmount = filteredItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const correctionData = {
        sellId: sellId,
        reference: sellData.invoiceNo, // Use invoiceNo as reference
        notes: data.notes,
        status: 'PENDING' as const, // Always set to PENDING
        total: filteredTotalAmount,
        items: filteredItems
      };

      await createSellStockCorrection(correctionData);
      toast.success('Sell stock correction created successfully');
      router.refresh();
      router.push(`/dashboard/Sell/view?id=${sellId}`)
    } catch (error: any) {
      toast.error(error?.message || 'Error creating sell stock correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sellData) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-muted-foreground text-center'>
            Sell data not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Sell Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Original Sale Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Invoice No (will be used as reference)
              </label>
              <p className='text-sm font-medium'>{sellData.invoiceNo}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Sale Date
              </label>
              <p className='text-sm'>
                {new Date(sellData.saleDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Status
              </label>
              <p className='text-sm'>{sellData.saleStatus}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Customer
              </label>
              <p className='text-sm'>{sellData.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Branch
              </label>
              <p className='text-sm'>{sellData.branch?.name || 'N/A'}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                Grand Total
              </label>
              <p className='text-sm'>{sellData.grandTotal?.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correction Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Stock Correction Details</CardTitle>
           
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                name='notes'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Additional notes for this correction...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Items Section */}
              <div className='space-y-4'>
                <FormLabel>Correction Items</FormLabel>

                <FormField
                  name='items'
                  control={form.control}
                  render={() => (
                    <FormItem>
                      {items?.map((item, itemIndex) => {
                        const product = sellData.items?.[itemIndex]?.product;
                        const shop = sellData.items?.[itemIndex]?.shop;
                        const originalQuantity = Math.abs(
                          sellData.items?.[itemIndex]?.quantity || 0
                        );
                        const batchTotalQuantity =
                          calculateItemQuantityFromBatches(item.batches || []);
                        const remainingQuantity = originalQuantity - Math.abs(batchTotalQuantity);
                        
                        return (
                          <Card key={itemIndex} className='p-4'>
                            <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-5'>
                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Product
                                </label>
                                <p className='text-sm font-medium'>
                                  {product?.name || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Shop
                                </label>
                                <p className='text-sm'>{shop?.name || 'N/A'}</p>
                              </div>
                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Original Qty
                                </label>
                                <p className='text-sm'>{originalQuantity}</p>
                              </div>
                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Remaining
                                </label>
                                <p className={`text-sm font-medium ${remainingQuantity < 0 ? 'text-destructive' : ''}`}>
                                  {remainingQuantity}
                                </p>
                              </div>
                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Unit Price
                                </label>
                                <p className='text-sm'>
                                  {item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Quantity Adjustment - Now auto-calculated from batches */}
                            <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                              <div>
                                <FormLabel>
                                  Quantity Adjustment (Auto-calculated)
                                </FormLabel>
                                <div className={`rounded-md border p-3 ${Math.abs(item.quantity) > originalQuantity ? 'border-destructive bg-destructive/10' : 'bg-muted/50'}`}>
                                  <p className={`text-center text-lg font-semibold ${Math.abs(item.quantity) > originalQuantity ? 'text-destructive' : ''}`}>
                                    {item.quantity}
                                  </p>
                                  <p className='text-muted-foreground mt-1 text-center text-xs'>
                                    Sum of batch quantities:{' '}
                                    {batchTotalQuantity}
                                    {Math.abs(item.quantity) > originalQuantity && (
                                      <span className='block text-destructive'>
                                        Exceeds original quantity!
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <FormMessage>
                                  {
                                    form.formState.errors.items?.[itemIndex]
                                      ?.quantity?.message
                                  }
                                </FormMessage>
                              </div>

                              <div>
                                <label className='text-muted-foreground text-sm font-medium'>
                                  Total Price
                                </label>
                                <p className='text-lg font-semibold'>
                                  {item.totalPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Batch Adjustments */}
                            {item.batches && item.batches.length > 0 && (
                              <div className='space-y-2'>
                                <FormLabel>Batch Adjustments</FormLabel>
                                <div className='text-muted-foreground mb-2 text-sm'>
                                  
                                </div>
                                {item.batches.map((batch, batchIndex) => {
                                  const sellBatch =
                                    sellData.items?.[itemIndex]?.batches?.[
                                      batchIndex
                                    ];
                                  const batchInfo = sellBatch?.batch;
                                  const availableQty =
                                    batchInfo?.availableQuantity || 0;
                                  const originalBatchQuantity = Math.abs(sellBatch?.quantity || 0);
                                  const remainingBatchQty = originalBatchQuantity - Math.abs(batch.quantity || 0);

                                  return (
                                    <div
                                      key={batchIndex}
                                      className={`grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-5 ${Math.abs(batch.quantity || 0) > originalBatchQuantity ? 'border-destructive bg-destructive/10' : ''}`}
                                    >
                                      <div>
                                        <label className='text-muted-foreground text-xs font-medium'>
                                          Batch
                                        </label>
                                        <p className='text-sm'>
                                          {batchInfo?.batchNumber || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <label className='text-muted-foreground text-xs font-medium'>
                                          Avilable Qty
                                        </label>
                                          <p className='text-sm'>
                                          {availableQty}
                                        </p>
                                      </div>
                                      <div>
                                        <label className='text-muted-foreground text-xs font-medium'>
                                          Remaining
                                        </label>
                                        <p className={`text-sm font-medium ${remainingBatchQty < 0 ? 'text-destructive' : ''}`}>
                                          {remainingBatchQty}
                                        </p>
                                      </div>
                                      <FormItem>
                                        <FormLabel className='text-xs'>
                                          Adjust Qty
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type='number'
                                            value={
                                              batch.quantity === 0
                                                ? ''
                                                : batch.quantity
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              handleBatchQuantityChange(
                                                itemIndex,
                                                batchIndex,
                                                value === '' ? 0 : Number(value)
                                              );
                                            }}
                                            className={Math.abs(batch.quantity || 0) > originalBatchQuantity ? 'border-destructive' : ''}
                                          />
                                        </FormControl>
                                        {Math.abs(batch.quantity || 0) > originalBatchQuantity && (
                                          <p className='text-destructive text-xs mt-1'>
                                            Exceeds original batch quantity!
                                          </p>
                                        )}
                                      </FormItem>
                                      <div>
                                        <label className='text-muted-foreground text-xs font-medium'>
                                          Current
                                        </label>
                                        <p className={`text-sm font-medium ${Math.abs(batch.quantity || 0) > originalBatchQuantity ? 'text-destructive' : ''}`}>
                                          {batch.quantity}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                      <FormMessage>
                        {form.formState.errors.items?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Section */}
              <Card className='bg-muted/50'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-lg font-semibold'>
                      Total Correction Amount:
                    </span>
                    <span className='text-primary text-2xl font-bold'>
                      {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className='mt-2 text-sm text-muted-foreground'>
                    <p>Reference will be automatically set to: {sellData.invoiceNo}</p>
                    <p>Status will be automatically set to: PENDING</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Creating Correction...'
                : 'Create Stock Correction'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}