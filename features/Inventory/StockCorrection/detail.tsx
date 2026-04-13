/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  AlertTriangle,
  MapPin
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
  approveStockCorrection,
  getStockCorrectionId,
  rejectStockCorrection
} from '@/service/StockCorrection';
import {
  IStockCorrection,
  IStockCorrectionItem,
  StockCorrectionReason,
  StockCorrectionStatus
} from '@/models/StockCorrection';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

type StockCorrectionViewProps = {
  id?: string;
};

const StockCorrectionDetailPage: React.FC<StockCorrectionViewProps> = ({
  id
}) => {
  const [stockCorrection, setStockCorrection] =
    useState<IStockCorrection | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchStockCorrection = useCallback(
    async () => {
      try {
        if (id) {
          const stockCorrectionData = await getStockCorrectionId(id);
          setStockCorrection(stockCorrectionData);
        }
      } catch  {
        toast.error('Failed to fetch stock correction details');
      } finally {
        setLoading(false);
      }
    },
    [id] // ✅ Added dependencies array
  );

  useEffect(() => {
    fetchStockCorrection();
  }, [fetchStockCorrection, id]);

const handleApprove = async () => {
  if (!id) return;

  setUpdating(true);
  try {
    const updatedStockCorrection = await approveStockCorrection(id);
    setStockCorrection(updatedStockCorrection);
    toast.success('Stock correction approved successfully');
    await fetchStockCorrection();
  } catch (error: any) { // Add error parameter
    console.error('Backend error:', error); // Log the error
    
    // Check for specific error messages
    if (error?.message?.includes('Insufficient stock')) {
      toast.error('Insufficient stock available. Please check stock levels.');
    } else if (error?.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to approve stock correction');
    }
  } finally {
    setUpdating(false);
  }
};
  const handleReject = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const updatedStockCorrection = await rejectStockCorrection(id);
      setStockCorrection(updatedStockCorrection);
      toast.success('Stock correction rejected successfully');

      // Refresh the data to ensure we have the latest state
      await fetchStockCorrection();
    } catch  {
      toast.error('Failed to reject stock correction');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading stock correction details...</p>
      </div>
    );
  }

  if (!stockCorrection) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Stock correction not found</p>
      </div>
    );
  }

  // Check if stock correction is approved or rejected
  const isImmutable =
    stockCorrection.status === StockCorrectionStatus.APPROVED ||
    stockCorrection.status === StockCorrectionStatus.REJECTED;

  // Get badge variant based on status
  const getStatusVariant = (status: StockCorrectionStatus) => {
    switch (status) {
      case StockCorrectionStatus.APPROVED:
        return 'default';
      case StockCorrectionStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get reason display text
  const getReasonText = (reason: StockCorrectionReason) => {
    switch (reason) {
      case 'PURCHASE_ERROR':
        return 'Purchase Error';
      case 'TRANSFER_ERROR':
        return 'Transfer Error';
      case 'EXPIRED':
        return 'Expired';
      case 'DAMAGED':
        return 'Damaged';
      case 'MANUAL_ADJUSTMENT':
        return 'Manual Adjustment';
      default:
        return reason;
    }
  };

  return (
   <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
  {/* Stock Correction Status Update Section - Only show if pending */}
  {!isImmutable && (
    <Card className='shadow-lg'>
      <CardHeader className='p-4 md:p-6'>
        <CardTitle className='text-lg font-bold md:text-xl'>
          Review Stock Correction
        </CardTitle>
      </CardHeader>
      <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
        <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:w-auto'>
            <PermissionGuard
              requiredPermission={PERMISSIONS.STOCK_CORRECTION.APPROVE.name}
            >
              <Button
                onClick={handleApprove}
                disabled={updating}
                className='w-full sm:w-auto'
                size="sm"
              >
                {updating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className='mr-2 h-4 w-4' />
                    Approve
                  </>
                )}
              </Button>
            </PermissionGuard>
            <PermissionGuard
              requiredPermission={PERMISSIONS.STOCK_CORRECTION.REJECT.name}
            >
              <Button
                variant='destructive'
                onClick={handleReject}
                disabled={updating}
                className='w-full sm:w-auto'
                size="sm"
              >
                {updating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className='mr-2 h-4 w-4' />
                    Reject
                  </>
                )}
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </CardContent>
    </Card>
  )}

  {/* Stock Correction Details Card */}
  <Card className='shadow-lg'>
    <CardHeader className='p-4 md:p-6'>
      <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='text-primary h-5 w-5' />
          <span className='truncate'>
            Stock Correction {stockCorrection.reference || ''}
          </span>
        </div>
        <Badge
          variant={getStatusVariant(stockCorrection.status)}
          className='mt-1 md:mt-0 md:ml-2'
        >
          {stockCorrection.status === StockCorrectionStatus.APPROVED ? (
            <>
              <Check className='mr-1 h-3 w-3' /> 
              <span className='hidden sm:inline'>{stockCorrection.status}</span>
              <span className='sm:hidden'>Approved</span>
            </>
          ) : stockCorrection.status === StockCorrectionStatus.REJECTED ? (
            <>
              <X className='mr-1 h-3 w-3' />
              <span className='hidden sm:inline'>{stockCorrection.status}</span>
              <span className='sm:hidden'>Rejected</span>
            </>
          ) : (
            <span>{stockCorrection.status}</span>
          )}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
        {/* Stock Correction Details */}
        <div className='space-y-3 md:space-y-4'>
          <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
            <Info className='text-primary h-4 w-4 md:h-5 md:w-5' />
            Correction Information
          </h3>
          <div className='space-y-2'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <p className='font-medium text-sm'>Reference:</p>
                <p className='text-muted-foreground text-sm truncate'>
                  {stockCorrection.reference || 'N/A'}
                </p>
              </div>
            </div>

            {/* Location - Store or Shop */}
            {(stockCorrection.store?.name || stockCorrection.shop?.name) && (
              <div className='flex items-start gap-2'>
                <MapPin className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>
                    {stockCorrection.store?.name ? 'Store' : 'Shop'}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {stockCorrection.store?.name || stockCorrection.shop?.name}
                    {(stockCorrection.store?.branch?.name || stockCorrection.shop?.branch?.name) && 
                      <span className='block sm:inline'>
                        {` (${stockCorrection.store?.branch?.name || stockCorrection.shop?.branch?.name})`}
                      </span>
                    }
                  </p>
                </div>
              </div>
            )}

            <div className='flex items-center gap-2'>
              <AlertTriangle className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='font-medium text-sm'>Type:</p>
                {/* Add type value here if available */}
              </div>
            </div>

            <div className='flex items-start gap-2'>
              <AlertTriangle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <p className='font-medium text-sm'>Reason:</p>
                <p className='text-muted-foreground text-sm'>
                  {getReasonText(stockCorrection.reason)}
                </p>
              </div>
            </div>

            {stockCorrection.purchaseId && (
              <div className='flex items-center gap-2'>
                <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Purchase:</p>
                  <p className='text-muted-foreground text-sm truncate'>
                    {stockCorrection.purchase?.invoiceNo || stockCorrection.purchaseId}
                  </p>
                </div>
              </div>
            )}

            {stockCorrection.transferId && (
              <div className='flex items-center gap-2'>
                <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Transfer:</p>
                  <p className='text-muted-foreground text-sm truncate'>
                    {stockCorrection.transfer?.reference || stockCorrection.transferId}
                  </p>
                </div>
              </div>
            )}

            {stockCorrection.createdBy && (
              <div className='flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Created By:</p>
                  <p className='text-muted-foreground text-sm'>
                    {stockCorrection.createdBy.name ?? 'Unknown Employee'}
                  </p>
                </div>
              </div>
            )}

            {stockCorrection.updatedBy && (
              <div className='flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Updated By:</p>
                  <p className='text-muted-foreground text-sm'>
                    {stockCorrection.updatedBy.name ?? 'Unknown Employee'}
                  </p>
                </div>
              </div>
            )}

            {stockCorrection.notes && (
              <div>
                <p className='font-medium text-sm'>Notes:</p>
                <p className='text-muted-foreground text-sm'>
                  {stockCorrection.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Details */}
        <div className='space-y-3 md:space-y-4'>
          <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
            <Calendar className='text-primary h-4 w-4 md:h-5 md:w-5' />
            Date Details
          </h3>
          <div className='space-y-2'>
            <div>
              <p className='font-medium text-sm'>Created At:</p>
              <p className='text-muted-foreground text-sm'>
                {formatDate(stockCorrection.createdAt)}
              </p>
            </div>
            <div>
              <p className='font-medium text-sm'>Updated At:</p>
              <p className='text-muted-foreground text-sm'>
                {formatDate(stockCorrection.updatedAt)}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Package className='text-muted-foreground h-4 w-4 shrink-0' />
              <div>
                <p className='font-medium text-sm'>Total Items:</p>
                <p className='text-muted-foreground text-sm'>
                  {stockCorrection.items?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Correction Items Table Section */}
      {stockCorrection.items?.length > 0 && (
        <div className='space-y-3 md:space-y-4'>
          <h3 className='text-base font-semibold md:text-lg'>Correction Items</h3>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='whitespace-nowrap text-xs md:text-sm'>Product</TableHead>
                  <TableHead className='whitespace-nowrap text-xs md:text-sm'>Batch</TableHead>
                  <TableHead className='whitespace-nowrap text-xs md:text-sm'>Unit</TableHead>
                  <TableHead className='whitespace-nowrap text-xs md:text-sm'>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockCorrection.items.map((item: IStockCorrectionItem) => (
                  <TableRow key={item.id}>
                    <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                      {item.product?.name || 'Unknown Product'}
                    </TableCell>
                  
                    <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                      {item.isBox ? 'Box' : 'piece'}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                      <div className='flex items-center'>{item.quantity}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</div>
  );
};

export default StockCorrectionDetailPage;
