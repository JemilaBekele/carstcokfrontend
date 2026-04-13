/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  AlertTriangle,
  Printer,
  DollarSign,
  Tag,
  Scale,
  Plus,
  Minus,
  Box,
  PackageOpen
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ISell, ISellItem, SaleStatus, ItemSaleStatus } from '@/models/Sell';
import {
  ISellStockCorrection,
  SellStockCorrectionStatus,
  ISellStockCorrectionItem
} from '@/models/SellStockCorrection';
import { cancelSale, getSellId, updateSaleStatus } from '@/service/Sell';
import {
  approveSellStockCorrection,
  deleteSellStockCorrection,
  getSellStockCorrectionsBySellId,
  rejectSellStockCorrection
} from '@/service/SellStockCorrection';
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
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

type SaleViewProps = {
  id?: string;
};

interface NetTotalAdjustment {
  totalAdjustment: number;
  adjustments: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    adjustmentValue: number;
    type: 'increase' | 'decrease';
    reason: string;
  }>;
}

interface PrintableSaleData {
  sale: ISell;
  stockCorrections: ISellStockCorrection[];
  netTotalAdjustment: NetTotalAdjustment | null;
  printedAt: string;
}

interface PriceAnalysis {
  productId: string;
  productName: string;
  sellPrice: number;
  additionalPrices: Array<{
    label: string;
    price: number;
    shopId: string | null;
    isMatch: boolean;
    difference: number;
  }>;
  hasMatchingPrice: boolean;
}

const SaleDetailPage: React.FC<SaleViewProps> = ({ id }) => {
  const [sale, setSale] = useState<ISell | null>(null);
  const [stockCorrections, setStockCorrections] = useState<
    ISellStockCorrection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<
    string | null
  >(null);
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'delete' | null
  >(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [netTotalAdjustment, setNetTotalAdjustment] =
    useState<NetTotalAdjustment | null>(null);
  const [priceAnalysisModalOpen, setPriceAnalysisModalOpen] = useState(false);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis[]>([]);
  const [loadingPriceAnalysis, setLoadingPriceAnalysis] = useState(false);

  const calculateNetTotalAdjustment = useCallback(
    (corrections: ISellStockCorrection[], currentSale: ISell | null) => {
      if (!currentSale || !currentSale.items || corrections.length === 0) {
        setNetTotalAdjustment(null);
        return;
      }

      const adjustments: NetTotalAdjustment['adjustments'] = [];
      let totalAdjustment = 0;

      corrections.forEach((correction) => {
        if (
          !correction.items ||
          correction.status !== SellStockCorrectionStatus.APPROVED
        ) {
          return;
        }

        correction.items.forEach((correctionItem: ISellStockCorrectionItem) => {
          const saleItem = currentSale.items?.find(
            (item) =>
              item.product?.id === correctionItem.productId &&
              item.shop?.id === correctionItem.shopId
          );

          if (saleItem && correctionItem.quantity !== 0) {
            const adjustmentValue =
              correctionItem.quantity * saleItem.unitPrice;
            const type = correctionItem.quantity > 0 ? 'decrease' : 'increase';
            const absoluteQuantity = Math.abs(correctionItem.quantity);

            adjustments.push({
              productName: correctionItem.product?.name || 'Unknown Product',
              quantity: absoluteQuantity,
              unitPrice: saleItem.unitPrice,
              adjustmentValue: Math.abs(adjustmentValue),
              type,
              reason:
                correctionItem.quantity > 0
                  ? `Items returned to stock (overstated sale)`
                  : `Items deducted from stock (understated sale)`
            });

            totalAdjustment -= adjustmentValue;
          }
        });
      });

      setNetTotalAdjustment({
        totalAdjustment,
        adjustments
      });
    },
    []
  );

  const analyzePrices = async () => {
    if (!sale || !sale.items) return;

    setLoadingPriceAnalysis(true);
    try {
      const analysis: PriceAnalysis[] = [];

      for (const item of sale.items) {
        if (!item.product?.id || !item.shop?.id) continue;

        try {
          const additionalPrices = item.product.AdditionalPrice || [];

          const priceComparisons = additionalPrices.map((ap) => {
            const isMatch = Math.abs(ap.price - item.unitPrice) < 0.01;
            const difference = item.unitPrice - ap.price;

            return {
              label: ap.label ?? 'N/A',
              price: ap.price,
              shopId: ap.shopId ?? null,
              isMatch,
              difference
            };
          });

          analysis.push({
            productId: item.product.id,
            productName: item.product.name,
            sellPrice: item.unitPrice,
            additionalPrices: priceComparisons,
            hasMatchingPrice: priceComparisons.some((ap) => ap.isMatch)
          });
        } catch {
          analysis.push({
            productId: item.product.id,
            productName: item.product.name,
            sellPrice: item.unitPrice,
            additionalPrices: [],
            hasMatchingPrice: false
          });
        }
      }

      setPriceAnalysis(analysis);
      setPriceAnalysisModalOpen(true);
    } catch {
      toast.error('Failed to analyze prices');
    } finally {
      setLoadingPriceAnalysis(false);
    }
  };

  useEffect(() => {
    const fetchSaleAndCorrections = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellId(id);
        setSale(saleData);

        setLoadingCorrections(true);
        const corrections = await getSellStockCorrectionsBySellId(id);
        setStockCorrections(corrections);

        calculateNetTotalAdjustment(corrections, saleData);
      } catch {
        toast.error('Failed to fetch sale details');
      } finally {
        setLoading(false);
        setLoadingCorrections(false);
      }
    };

    fetchSaleAndCorrections();
  }, [id, refreshTrigger, calculateNetTotalAdjustment]);

  useEffect(() => {
    if (sale && stockCorrections.length > 0) {
      calculateNetTotalAdjustment(stockCorrections, sale);
    } else {
      setNetTotalAdjustment(null);
    }
  }, [sale, stockCorrections, calculateNetTotalAdjustment]);

  const handlePrint = () => {
    if (!sale) return;

    const printableData: PrintableSaleData = {
      sale,
      stockCorrections: stockCorrections.filter(
        (corr) => corr.status === SellStockCorrectionStatus.APPROVED
      ),
      netTotalAdjustment,
      printedAt: new Date().toLocaleString()
    };

    const printHTML = generatePrintHTML(printableData);

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-temp';
    printContainer.innerHTML = printHTML;

    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container-temp, #print-container-temp * {
          visibility: visible;
        }
        #print-container-temp {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      document.head.removeChild(style);
    }, 100);
  };

  const generatePrintHTML = (data: PrintableSaleData) => {
    const { sale, stockCorrections, printedAt } = data;
    const netTotal = sale.NetTotal || 0;

    const combinedItemsMap = new Map();

    if (sale.items) {
      sale.items.forEach((item) => {
        const key = `${item.product?.name}-${item.shop?.name}`;

        combinedItemsMap.set(key, {
          type: 'sale',
          product: item.product?.name || 'Unknown Product',
          shop: item.shop?.name || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          status: item.itemSaleStatus,
          isBox: item.isBox,
          operation: 'sale',
          adjustments: [],
          finalQuantity: item.quantity
        });
      });
    }

    stockCorrections
      .filter((corr) => corr.status === SellStockCorrectionStatus.APPROVED)
      .forEach((correction) => {
        correction.items?.forEach((item: ISellStockCorrectionItem) => {
          const key = `${item.product?.name}-${item.shop?.name}`;
          const isAddition = item.quantity > 0;

          if (combinedItemsMap.has(key)) {
            const existingItem = combinedItemsMap.get(key);
            existingItem.adjustments.push({
              type: 'correction',
              quantity: item.quantity,
              operation: isAddition ? 'addition' : 'reduction',
              reason: correction.notes || 'Stock Correction',
              reference: correction.reference
            });
            existingItem.finalQuantity += item.quantity;
            existingItem.totalPrice =
              existingItem.finalQuantity * existingItem.unitPrice;
          } else {
            combinedItemsMap.set(key, {
              type: 'correction',
              product: item.product?.name || 'Unknown Product',
              shop: item.shop?.name || 'N/A',
              quantity: item.quantity,
              unitPrice: item.unitPrice || 0,
              totalPrice: item.totalPrice || 0,
              status: 'ADJUSTMENT',
              operation: isAddition ? 'addition' : 'reduction',
              adjustments: [],
              finalQuantity: item.quantity,
              reason: correction.notes || 'Stock Correction',
              reference: correction.reference
            });
          }
        });
      });

    const combinedItems = Array.from(combinedItemsMap.values());

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Invoice - ${sale.invoiceNo}</title>
          <style>
            @media print {
              @page { margin: 0.5in; size: letter; }
              body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4; color: #000; margin: 0; padding: 0; }
              .print-container { max-width: 100%; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .invoice-title { font-size: 24px; font-weight: bold; margin: 10px 0; }
              .section { margin-bottom: 20px; page-break-inside: avoid; }
              .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .bold { font-weight: bold; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
              .badge-approved { background-color: #d1fae5; color: #065f46; }
              .badge-pending { background-color: #fef3c7; color: #92400e; }
              .badge-adjustment { background-color: #e0e7ff; color: #3730a3; }
              .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; text-align: center; font-size: 10px; color: #666; }
              .row-sale { background-color: #ffffff; }
              .row-correction { background-color: #f8fafc; }
              .row-combined { background-color: #f0f9ff; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div class="invoice-title">SALE INVOICE</div>
              <div class="grid-2">
                <div><strong>Invoice No:</strong> ${sale.invoiceNo}</div>
                <div><strong>Date:</strong> ${formatDate(sale.saleDate || sale.createdAt)}</div>
                <div><strong>Customer:</strong> ${sale.customer?.name || 'N/A'}</div>
                <div><strong>Status:</strong> ${sale.saleStatus}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Sale Items</div>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Shop</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${combinedItems.map((item) => `
                    <tr class="${item.type === 'sale' ? 'row-sale' : 'row-correction'}">
                      <td>${item.type === 'sale' ? 'Sale' : 'Correction'}</td>
                      <td>${item.product}</td>
                      <td>${item.shop}</td>
                      <td class="text-right">${item.finalQuantity}</td>
                      <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                      <td class="text-right">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="grid-2">
                <div>
                  <p><strong>Sub Total:</strong> ${(sale.subTotal || 0).toFixed(2)}</p>
                  ${sale.discount > 0 ? `<p><strong>Discount:</strong> -${sale.discount.toFixed(2)}</p>` : ''}
                  ${sale.vat > 0 ? `<p><strong>VAT:</strong> ${sale.vat.toFixed(2)}</p>` : ''}
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Printed on: ${printedAt}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleStatusUpdate = async (newStatus: SaleStatus) => {
    if (!id) return;

    setSelectedStatus(newStatus);
    setStatusUpdateDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (!id || !selectedStatus) return;

    setUpdating(true);
    try {
      const updatedSale = await updateSaleStatus(id, selectedStatus);
      setSale(updatedSale);
      toast.success(`Sale status updated to ${selectedStatus}`);
      setRefreshTrigger((prev) => prev + 1);
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

  const handleCorrectionAction = async (
    correctionId: string,
    action: 'approve' | 'reject' | 'delete'
  ) => {
    setOpen(true);
    setActionType(action);
    setSelectedCorrectionId(correctionId);
  };

  const onConfirm = async () => {
    if (!id && !selectedCorrectionId && actionType !== 'delete') return;

    setUpdating(true);
    try {
      if (actionType === 'delete' && !selectedCorrectionId) {
        const updatedSale = await cancelSale(id!);
        setSale(updatedSale);
        toast.success('Sale cancelled successfully');
      } else if (actionType === 'approve' && selectedCorrectionId) {
        await approveSellStockCorrection(selectedCorrectionId);
        toast.success('Stock correction approved successfully');
      } else if (actionType === 'reject' && selectedCorrectionId) {
        await rejectSellStockCorrection(selectedCorrectionId);
        toast.success('Stock correction rejected successfully');
      } else if (actionType === 'delete' && selectedCorrectionId) {
        await deleteSellStockCorrection(selectedCorrectionId);
        toast.success('Stock correction deleted successfully');
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${actionType} ${selectedCorrectionId ? 'stock correction' : 'sale'}`
      );
    } finally {
      setUpdating(false);
      setOpen(false);
      setActionType(null);
      setSelectedCorrectionId(null);
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

    const undeliveredItemIds = sale.items
      .filter((item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED)
      .map((item) => item.id);

    if (selectedItems.length === undeliveredItemIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(undeliveredItemIds);
    }
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

  const isImmutable = [SaleStatus.DELIVERED, SaleStatus.CANCELLED].includes(
    sale.saleStatus
  );
  const hasUndeliveredItems = sale.items?.some(
    (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
  );
  const undeliveredItemsCount =
    sale.items?.filter(
      (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
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
  const netTotal = sale.NetTotal || 0;

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      <div className='flex justify-end gap-2'>
     
        <Button
          onClick={handlePrint}
          variant='outline'
          className='flex items-center gap-2'
        >
          <Printer className='h-4 w-4' />
          Print Invoice
        </Button>
      </div>



  

  
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
                    <p className='font-medium text-sm sm:text-base'>Total:</p>
                    <p className='text-muted-foreground text-base font-bold sm:text-lg'>
                      {grandTotal.toFixed(2)}
                    </p>
                  </div>
                  {/* <div className='col-span-2'>
                    <p className='font-medium text-sm sm:text-base'>Net Total:</p>
                    <p className='text-muted-foreground text-base font-bold sm:text-lg'>
                      {netTotal.toFixed(2)}
                    </p>
                  </div> */}
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
                      <p className='font-medium text-amber-600'>
                        Undelivered Items: {undeliveredItemsCount}
                      </p>
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
          
              </div>

              {/* Mobile Card View */}
              <div className='space-y-3 sm:hidden'>
                {sale.items.map((item: ISellItem) => {
                  const isSelected = selectedItems.includes(item.id);
                  const isDelivered = item.itemSaleStatus === ItemSaleStatus.DELIVERED;

                  return (
                    <Card
                      key={item.id}
                      className={`border ${isSelected ? 'border-primary ring-1 ring-primary' : ''} ${
                        isDelivered ? 'opacity-80' : ''
                      }`}
                    >
                      <CardContent className='pt-4'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1'>
                            <h4 className='font-semibold leading-tight'>
                              {item.product?.name || 'Unknown Product'}
                            </h4>
                            {item.product?.productCode && (
                              <p className='text-xs text-muted-foreground'>
                                Code: {item.product.productCode}
                              </p>
                            )}
                          </div>
                    
                        </div>

                        <div className='mt-3 grid grid-cols-2 gap-2'>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Shop</p>
                            <p className='text-sm font-medium truncate'>
                              {item.shop?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Type</p>
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
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Quantity</p>
                            <p className='text-sm font-medium'>{item.quantity}</p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Unit</p>
                            <p className='text-sm font-medium truncate'>
                              {item.product?.UnitOfMeasure || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className='mt-3 flex items-center justify-between border-t pt-3'>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Unit Price</p>
                            <p className='text-sm font-semibold'>
                              {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Total Price</p>
                            <p className='text-sm font-bold'>
                              {item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground text-center'>Status</p>
                            <Badge
                              variant={
                                item.itemSaleStatus === ItemSaleStatus.DELIVERED
                                  ? 'default'
                                  : item.itemSaleStatus === ItemSaleStatus.PENDING
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='capitalize'
                            >
                              {item.itemSaleStatus.toLowerCase()}
                            </Badge>
                          </div>
                        </div>

                        {isDelivered && (
                          <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
                            <Check className='h-3 w-3' />
                            <span>Already delivered</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className='hidden sm:block overflow-x-auto'>
                <div className='inline-block min-w-full align-middle'>
                  <div className='overflow-hidden border rounded-lg'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                     
                          <TableHead className='min-w-40'>Product</TableHead>
                          <TableHead className='min-w-28'>Shop</TableHead>
                          <TableHead className='min-w-24'>Type</TableHead>
                          <TableHead className='min-w-20'>Quantity</TableHead>
                          <TableHead className='min-w-28'>Unit Price</TableHead>
                          <TableHead className='min-w-28'>Total Price</TableHead>
                          <TableHead className='min-w-32'>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items.map((item: ISellItem) => {
                          const isDelivered = item.itemSaleStatus === ItemSaleStatus.DELIVERED;

                          return (
                            <TableRow
                              key={item.id}
                              className={`
                                ${selectedItems.includes(item.id) ? 'bg-primary/5' : ''}
                                ${isDelivered ? 'opacity-80' : ''}
                              `}
                            >
                      
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
                                {item.shop?.name || 'Unknown Shop'}
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
                                <span className='font-medium'>{item.quantity}</span>
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

          {/* Stock Corrections Section - Removed as requested */}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetailPage;