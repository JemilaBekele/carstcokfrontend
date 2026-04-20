'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  Calendar,
  User,
  Info,
  Check,
  X,
  DollarSign,
  FileText,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Box,
  PackageOpen,
  Eye,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  CreditCard
} from 'lucide-react';
import { IPurchase, PaymentStatus, PurchaseItem } from '@/models/purchase';
import {
  getPurchaseId,
  acceptPurchase,
  getStockCorrectionsByPurchaseId
} from '@/service/purchase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { IStockCorrection } from '@/models/StockCorrection';
import Link from 'next/link';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import Image from 'next/image';
import { normalizeImagePath } from '@/lib/norm';

type PurchaseViewProps = {
  id?: string;
};

const PurchasedetailPage: React.FC<PurchaseViewProps> = ({ id }) => {
  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [stockCorrections, setStockCorrections] = useState<IStockCorrection[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);

  // Normalize image and document URLs
  const normalizedImageUrl = normalizeImagePath(purchase?.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(purchase?.documentUrl);

  const hasAttachedFiles = !!(normalizedImageUrl || normalizedDocumentUrl);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        if (id) {
          const purchaseData = await getPurchaseId(id);
          setPurchase(purchaseData);
          setSelectedStatus(purchaseData.paymentStatus);
          setImageError(false);
          
          // Auto-expand if there are attached files
          if (purchaseData?.imageUrl || purchaseData?.documentUrl) {
            setShowAttachedFiles(false);
          }

          // Fetch stock corrections for this purchase
          await fetchStockCorrections(id);
        }
      } catch {
        toast.error('Failed to fetch purchase details');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseData();
  }, [id, refreshTrigger]);

  const fetchStockCorrections = async (purchaseId: string) => {
    setLoadingCorrections(true);
    try {
      const corrections = await getStockCorrectionsByPurchaseId(purchaseId);
      setStockCorrections(corrections);
    } catch {
      toast.error('Failed to load stock corrections');
    } finally {
      setLoadingCorrections(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus || selectedStatus === purchase?.paymentStatus) {
      return;
    }

    setUpdating(true);
    try {
      const updatedPurchase = await acceptPurchase(id, selectedStatus);

      // Preserve the existing items when updating the purchase
      setPurchase((prevPurchase) => ({
        ...updatedPurchase,
        items: prevPurchase?.items || updatedPurchase.items || []
      }));

      toast.success('Payment status updated successfully');

      // If status was changed to APPROVED, trigger a refresh
      if (selectedStatus === PaymentStatus.APPROVED) {
        // Force a refresh of the data
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch {
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const refreshStockCorrections = async () => {
    if (id) {
      await fetchStockCorrections(id);
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading purchase details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Purchase not found</p>
      </div>
    );
  }

  // Calculate financial details safely
  const subtotal =
    purchase.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  const grandTotal = purchase.grandTotal || subtotal;

  // Check if purchase is already paid
  const isPaid = purchase.paymentStatus === PaymentStatus.APPROVED;

  return (
    <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
      {/* Payment Status Update Section - Only show if not paid */}
      {!isPaid && (
        <Card className='shadow-lg'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='text-lg font-bold md:text-xl'>
              Update Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <PermissionGuard fallback="hide"
              requiredPermission={PERMISSIONS.PURCHASE.ACCEPT.name}
            >
              <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                <div className='w-full sm:w-auto sm:flex-1'>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: PaymentStatus) =>
                      setSelectedStatus(value)
                    }
                  >
                    <SelectTrigger className='w-full sm:w-45 lg:w-50'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentStatus.APPROVED}>
                        APPROVED
                      </SelectItem>
                      <SelectItem value={PaymentStatus.REJECTED}>
                        REJECTED
                      </SelectItem>
                      <SelectItem value={PaymentStatus.PENDING}>
                        PENDING
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex w-full flex-col gap-2 sm:flex-row sm:w-auto sm:items-center'>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={
                      updating ||
                      !selectedStatus ||
                      selectedStatus === purchase.paymentStatus
                    }
                    className='w-full sm:w-auto'
                    size="sm"
                  >
                    {updating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        <span className='hidden sm:inline'>Updating...</span>
                        <span className='sm:hidden'>Update</span>
                      </>
                    ) : (
                      <>
                        <span className='hidden sm:inline'>Update Status</span>
                        <span className='sm:hidden'>Update</span>
                      </>
                    )}
                  </Button>

                  {selectedStatus &&
                    selectedStatus !== purchase.paymentStatus && (
                      <Badge variant='outline' className='w-full justify-center sm:w-auto sm:ml-2'>
                        <span className='truncate'>
                          {purchase.paymentStatus} → {selectedStatus}
                        </span>
                      </Badge>
                    )}
                </div>
              </div>
            </PermissionGuard>
          </CardContent>
        </Card>
      )}

      {/* Purchase Details Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
            <div className='flex items-center gap-2'>
              <Package className='text-primary h-5 w-5' />
              <span className='truncate'>
                Purchase {purchase.invoiceNo || purchase.id}
              </span>
            </div>
            <Badge
              variant={
                purchase.paymentStatus === PaymentStatus.APPROVED
                  ? 'default'
                  : purchase.paymentStatus === PaymentStatus.REJECTED
                    ? 'destructive'
                    : 'secondary'
              }
              className='mt-1 md:mt-0 md:ml-2'
            >
              {purchase.paymentStatus === PaymentStatus.APPROVED ? (
                <>
                  <Check className='mr-1 h-3 w-3' />
                  <span className='hidden sm:inline'>{purchase.paymentStatus}</span>
                  <span className='sm:hidden'>Approved</span>
                </>
              ) : purchase.paymentStatus === PaymentStatus.REJECTED ? (
                <>
                  <X className='mr-1 h-3 w-3' />
                  <span className='hidden sm:inline'>{purchase.paymentStatus}</span>
                  <span className='sm:hidden'>Rejected</span>
                </>
              ) : (
                <span>{purchase.paymentStatus}</span>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
            {/* Purchase Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <Info className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Purchase Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Invoice Number:</p>
                    <p className='text-muted-foreground text-sm truncate'>
                      {purchase.invoiceNo}
                    </p>
                  </div>
                </div>
                
                {purchase.supplier && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Supplier:</p>
                      <p className='text-muted-foreground text-sm'>
                        {purchase.supplier.name ?? 'Unknown Supplier'}
                      </p>
                    </div>
                  </div>
                )}
                
                {purchase.store && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Store:</p>
                      <p className='text-muted-foreground text-sm'>
                        {purchase.store.name ?? 'Unknown Store'}
                      </p>
                    </div>
                  </div>
                )}
                    {purchase.shop && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Shop:</p>
                      <p className='text-muted-foreground text-sm'>
                        {purchase.shop.name ?? 'Unknown Store'}
                      </p>
                    </div>
                  </div>
                )}
                
                {purchase.createdBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Created By:</p>
                      <p className='text-muted-foreground text-sm'>
                        {purchase.createdBy.name ?? 'Unknown Employee'}
                      </p>
                    </div>
                  </div>
                )}
                
                {purchase.updatedBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Approved By:</p>
                      <p className='text-muted-foreground text-sm'>
                        {purchase.updatedBy.name ?? 'Unknown Employee'}
                      </p>
                    </div>
                  </div>
                )}
                
                {purchase.notes && (
                  <div>
                    <p className='font-medium text-sm'>Notes:</p>
                    <p className='text-muted-foreground text-sm'>
                      {purchase.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial and Date Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <CreditCard className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Financial Details
              </h3>
              <div className='space-y-2'>
                <div>
                  <p className='font-medium text-sm'>Purchase Date:</p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(purchase.purchaseDate)}
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <DollarSign className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Total:</p>
                    <p className='text-muted-foreground text-sm'>
                      {grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Total Products:</p>
                    <p className='text-muted-foreground text-sm'>
                      {purchase.totalProducts || 0}
                    </p>
                  </div>
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
                          Purchase Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
                          <Image
                            src={normalizedImageUrl}
                            alt={`Purchase ${purchase.invoiceNo} image`}
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
                          Purchase Document
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

          {/* Purchased Items Table Section */}
          {purchase.items?.length > 0 && (
            <div className='space-y-3 md:space-y-4'>
              <h3 className='text-base font-semibold md:text-lg'>Purchased Items</h3>
              
              {/* Mobile View - Stacked Cards */}
              <div className='space-y-3 md:hidden'>
                {purchase.items.map((item: PurchaseItem, index) => (
                  <div 
                    key={item.id || item.productId || index} 
                    className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'
                  >
                    <div className='space-y-3'>
                      {/* Product Info */}
                      <div>
                        <div className='flex justify-between'>
                          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Product</span>
                          <span className='text-right text-sm font-medium'>
                            {item.product?.name || 'Unknown Product'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Box/Piece Info */}
                      <div className='flex justify-between'>
                        <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Type</span>
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
                      
                      {/* Quantity & Unit Price */}
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Qty</span>
                          <div className='mt-1 text-sm font-medium'>
                            {item.quantity}
                          </div>
                        </div>
                        
                        <div>
                          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Unit Price</span>
                          <div className='mt-1 text-sm font-medium'>
                            ${(item.unitPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Total Price */}
                      <div className='pt-2 border-t border-gray-100 dark:border-gray-700'>
                        <div className='flex justify-between'>
                          <span className='text-sm font-medium'>Total</span>
                          <span className='text-sm font-bold text-primary'>
                            ${(item.totalPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Summary on Mobile */}
                <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
                  <div className='flex justify-between text-sm font-semibold'>
                    <span>Grand Total</span>
                    <span className='text-primary'>
                      {purchase.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop View - Table */}
              <div className='hidden overflow-x-auto md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Product</TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Type</TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Quantity</TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Unit Price</TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item: PurchaseItem, index) => (
                      <TableRow key={item.id || item.productId || index}>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                          <div className='font-medium'>
                            {item.product?.name || 'Unknown Product'}
                          </div>
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
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
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                          <div className='font-medium'>
                            {item.quantity}
                          </div>
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                          <div className='font-medium'>
                            {(item.unitPrice || 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                          <div className='font-bold text-primary'>
                            {(item.totalPrice || 0).toFixed(2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Total Row on Desktop
                    <TableRow className='bg-gray-50 dark:bg-gray-800'>
                      <TableCell colSpan={4} className='text-right text-sm font-semibold'>
                        Grand Total
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                        <div className='font-bold text-lg text-primary'>
                          ${purchase.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow> */}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Corrections Section */}
      <Card className='shadow-lg'>
        <CardHeader className='flex flex-col items-start gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-6'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold md:text-xl'>
              <AlertTriangle className='text-amber-500 h-5 w-5' />
              Stock Corrections
              {stockCorrections.length > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {stockCorrections.length}
                </Badge>
              )}
            </CardTitle>
            <div className='sm:ml-2'>
              <Link href={`/dashboard/purchase/StockCorrection/${id}`}>
                <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                  Add Stock Correction
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshStockCorrections}
            disabled={loadingCorrections}
            className='w-full sm:w-auto'
          >
            {loadingCorrections ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <>
                <RefreshCw className='mr-2 h-4 w-4' />
                <span className='hidden sm:inline'>Refresh</span>
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
          {loadingCorrections ? (
            <div className='flex flex-col items-center justify-center py-4 md:flex-row'>
              <Loader2 className='mr-2 h-6 w-6 animate-spin' />
              <p className='mt-2 text-sm md:mt-0 md:text-base'>Loading stock corrections...</p>
            </div>
          ) : stockCorrections.length === 0 ? (
            <div className='text-muted-foreground py-4 text-center md:py-6'>
              <p className='text-sm md:text-base'>No stock corrections found for this purchase</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {stockCorrections.map((correction) => (
                <Card
                  key={correction.id}
                  className='border-l-4 border-l-amber-500'
                >
                  <CardContent className='p-4 md:p-6'>
                    <div className='mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                      <div className='flex-1'>
                        <h4 className='text-base font-semibold md:text-lg'>
                          Stock Correction #{correction.id.slice(-6)}
                        </h4>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          <Badge variant='outline' className='capitalize text-xs md:text-sm'>
                            Reason: {correction.reason.toLowerCase()}
                          </Badge>
                          <Badge
                            variant={
                              correction.status === 'APPROVED'
                                ? 'default'
                                : correction.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className='capitalize text-xs md:text-sm'
                          >
                            Status: {correction.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                      {correction.reference && (
                        <div className='text-right text-sm'>
                          <p className='font-medium'>Reference:</p>
                          <p className='text-muted-foreground truncate'>
                            {correction.reference}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4'>
                      <div>
                        <p className='text-muted-foreground text-xs md:text-sm'>
                          <span className='font-medium'>Created:</span>{' '}
                          {formatDate(correction.createdAt)}
                          {correction.createdBy &&
                            ` by ${correction.createdBy.name}`}
                        </p>
                      </div>
                      <div>
                        {correction.store && (
                          <p className='text-muted-foreground text-xs md:text-sm'>
                            <span className='font-medium'>Store:</span>{' '}
                            {correction.store.name}
                          </p>
                        )}
                        {correction.shop && (
                          <p className='text-muted-foreground text-xs md:text-sm'>
                            <span className='font-medium'>Shop:</span>{' '}
                            {correction.shop.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {correction.notes && (
                      <div className='bg-muted mb-4 rounded-md p-3'>
                        <p className='text-xs font-medium md:text-sm'>Notes:</p>
                        <p className='text-muted-foreground text-xs md:text-sm'>
                          {correction.notes}
                        </p>
                      </div>
                    )}

                    <div className='mt-4'>
                      <h5 className='mb-2 text-sm font-medium md:text-base'>Correction Items:</h5>
                      
                      {/* Mobile View - Stacked Cards */}
                      <div className='space-y-3 md:hidden'>
                        {correction.items && correction.items.map((item, index) => (
                          <div key={index} className='rounded-lg border border-gray-200 p-3 dark:border-gray-700'>
                            <div className='space-y-2'>
                              <div className='flex justify-between'>
                                <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Product:</span>
                                <span className='text-right text-sm'>
                                  {item.product?.name || 'Unknown Product'}
                                </span>
                              </div>
                              
                              <div className='flex justify-between'>
                                <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Type:</span>
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
                              
                              <div className='flex justify-between'>
                                <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Quantity:</span>
                                <span className={`
                                  text-right text-sm font-medium
                                  ${item.quantity > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : item.quantity < 0 
                                      ? 'text-red-600 dark:text-red-400'
                                      : ''
                                  }
                                `}>
                                  {item.quantity > 0 ? '+' : ''}
                                  {item.quantity}
                                  {item.isBox && item.quantity !== 0 && (
                                    <span className='text-xs text-gray-500 ml-1'>
                                      ({Math.abs(item.quantity) * (item.product?.boxSize || 1)} pieces)
                                    </span>
                                  )}
                                </span>
                              </div>
                              
                              {item.isBox && item.product?.boxSize && (
                                <div className='flex justify-between'>
                                  <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Box Size:</span>
                                  <span className='text-right text-xs text-gray-600 dark:text-gray-400'>
                                    {item.product.boxSize} pieces/box
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Desktop View - Table */}
                      <div className='hidden overflow-x-auto md:block'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className='whitespace-nowrap text-xs md:text-sm'>Product</TableHead>
                              <TableHead className='whitespace-nowrap text-xs md:text-sm'>Type</TableHead>
                              <TableHead className='whitespace-nowrap text-xs md:text-sm'>Quantity</TableHead>
                              <TableHead className='whitespace-nowrap text-xs md:text-sm'>Pieces Equivalent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {correction.items &&
                              correction.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                    <div className='font-medium'>
                                      {item.product?.name || 'Unknown Product'}
                                    </div>
                                  </TableCell>
                                  <TableCell className='whitespace-nowrap text-xs md:text-sm'>
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
                                      <div className='text-xs text-gray-500 mt-1'>
                                        {item.product.boxSize} pieces/box
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                    <div className={`
                                      font-medium
                                      ${item.quantity > 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : item.quantity < 0 
                                          ? 'text-red-600 dark:text-red-400'
                                          : ''
                                      }
                                    `}>
                                      {item.quantity > 0 ? '+' : ''}
                                      {item.quantity}
                                      {item.isBox && <span className='text-xs text-gray-500 ml-1'>(box{Math.abs(item.quantity) !== 1 ? 'es' : ''})</span>}
                                      {!item.isBox && <span className='text-xs text-gray-500 ml-1'>(piece{Math.abs(item.quantity) !== 1 ? 's' : ''})</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                    <div className={`
                                      font-medium
                                      ${item.quantity > 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : item.quantity < 0 
                                          ? 'text-red-600 dark:text-red-400'
                                          : ''
                                      }
                                    `}>
                                      {item.quantity > 0 ? '+' : ''}
                                      {item.isBox 
                                        ? Math.abs(item.quantity) * (item.product?.boxSize || 1)
                                        : Math.abs(item.quantity)
                                      } pieces
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasedetailPage;