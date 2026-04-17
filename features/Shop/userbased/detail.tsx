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
  Image as ImageIcon,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp
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
import { getSellId } from '@/service/Sell';
import Image from 'next/image';
import { normalizeImagePath } from '@/lib/norm';

type SaleViewProps = {
  id?: string;
};

interface PrintableSaleData {
  sale: ISell;
  printedAt: string;
}

const SaleDetailPage: React.FC<SaleViewProps> = ({ id }) => {
  const [sale, setSale] = useState<ISell | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, ] = useState(false);
  const [refreshTrigger,] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [, setImageError] = useState(false);
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);

  // Normalize image and document URLs
  const normalizedImageUrl = normalizeImagePath(sale?.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(sale?.documentUrl);

  const hasAttachedFiles = !!(normalizedImageUrl || normalizedDocumentUrl);

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellId(id);
        setSale(saleData);
        setImageError(false);
        // Auto-expand if there are attached files
        if (saleData?.imageUrl || saleData?.documentUrl) {
          setShowAttachedFiles(false);
        }
      } catch {
        toast.error('Failed to fetch sale details');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id, refreshTrigger]);

  const handlePrint = () => {
    if (!sale) return;

    const printableData: PrintableSaleData = {
      sale,
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
    const { sale, printedAt } = data;

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
              .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; text-align: center; font-size: 10px; color: #666; }
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
                    <th>Product</th>
                    <th>Shop</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items?.map((item) => `
                    <tr>
                      <td>${item.product?.name || 'Unknown Product'}</td>
                      <td>${item.shop?.name || 'N/A'}</td>
                      <td class="text-right">${item.quantity}</td>
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
                  <p><strong>Grand Total:</strong> ${(sale.grandTotal || 0).toFixed(2)}</p>
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
                      <p className='font-medium text-amber-600'>
                        Undelivered Items: {undeliveredItemsCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attached Files Section - Collapsible */}
          {hasAttachedFiles && (
            <div className='space-y-4'>
              <Button
                variant='ghost'
                onClick={() => setShowAttachedFiles(!showAttachedFiles)}
                className='flex w-full items-center justify-between p-4 hover:bg-gray-50'
              >
                <div className='flex items-center gap-2'>
                  <Eye className='text-primary h-5 w-5' />
                  <h3 className='text-base font-semibold'>Attached Files</h3>
                  <Badge variant='secondary' className='ml-2'>
                    {normalizedImageUrl && normalizedDocumentUrl ? '2' : '1'} file(s)
                  </Badge>
                </div>
                {showAttachedFiles ? (
                  <ChevronUp className='h-5 w-5' />
                ) : (
                  <ChevronDown className='h-5 w-5' />
                )}
              </Button>

              {showAttachedFiles && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {/* Image Display */}
                  {normalizedImageUrl && (
                    <Card className='overflow-hidden'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                          <ImageIcon className='h-4 w-4' />
                          Invoice Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
                          <Image
                            src={normalizedImageUrl}
                            alt={`Invoice ${sale.invoiceNo} image`}
                            fill
                            className='object-contain'
                            onError={(e) => {
                              console.error('Failed to load image:', normalizedImageUrl);
                              setImageError(true);
                            }}
                          />
                        </div>
                        <a
                          href={normalizedImageUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline'
                        >
                          <Eye className='h-3 w-3' />
                          View full size
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Display */}
                  {normalizedDocumentUrl && (
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                          <FileText className='h-4 w-4' />
                          Invoice Document
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
                          <div className='flex items-center gap-2'>
                            <FileText className='h-8 w-8 text-blue-500' />
                            <div>
                              <p className='text-sm font-medium'>Supporting Document</p>
                              <p className='text-xs text-muted-foreground'>
                                Click to view or download
                              </p>
                            </div>
                          </div>
                          <a
                            href={normalizedDocumentUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                          >
                            <Eye className='h-3 w-3' />
                            View
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sale Items Table */}
          {sale.items && sale.items.length > 0 ? (
            <div className='space-y-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h3 className='text-base font-semibold sm:text-lg'>Sale Items</h3>
                {hasUndeliveredItems && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleSelectAll}
                    disabled={updating}
                    className='w-full sm:w-auto'
                  >
                    {selectedItems.length === undeliveredItemsCount
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
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
                          {hasUndeliveredItems && !isDelivered && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleItemSelection(item.id)}
                              disabled={updating || isDelivered}
                              className='mt-0.5'
                            />
                          )}
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
                          {hasUndeliveredItems && (
                            <TableHead className='w-12 px-3'>
                              <Checkbox
                                checked={
                                  selectedItems.length === undeliveredItemsCount &&
                                  undeliveredItemsCount > 0
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
                              {hasUndeliveredItems && (
                                <TableCell className='px-3'>
                                  <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() =>
                                      handleItemSelection(item.id)
                                    }
                                    disabled={
                                      updating ||
                                      isDelivered
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetailPage;