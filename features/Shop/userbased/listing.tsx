/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/newdatatable';
import { getAllSellsuserBased } from '@/service/Sell';
import { sellColumns } from './tables/columns';
import { SaleStatus } from '@/models/Sell';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, Check, DollarSign } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type SellListingPageProps = object;

// Compact Status Card Component
export function StatusCard({
  title,
  count,
  variant = 'default',
  needsAttention = false,
  selected = false,
  href,
  value
}: {
  title: string;
  count: number;
  variant?:
    | 'default'
    | 'approved'
    | 'notApproved'
    | 'partial'
    | 'delivered'
    | 'cancelled'
    | 'total'
    | 'paid'
    | 'unpaid'
    | 'partialPayment';
  needsAttention?: boolean;
  selected?: boolean;
  href: string;
  value?: string;
}) {
  const variantStyles = {
    default: 'border-border bg-card',
    total: 'border-border bg-card',
    approved:
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
    notApproved: needsAttention
      ? 'border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40 shadow-md ring-1 ring-amber-200 dark:ring-amber-800'
      : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20',
    partial:
      'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
    delivered:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
    cancelled: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    paid: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20',
    unpaid: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20',
    partialPayment: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
  };

  const selectedStyles = selected
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    : '';

  const textColors = {
    default: 'text-foreground',
    total: 'text-foreground',
    approved: 'text-blue-700 dark:text-blue-400',
    notApproved: needsAttention
      ? 'text-amber-800 dark:text-amber-300'
      : 'text-gray-700 dark:text-gray-400',
    partial: 'text-orange-700 dark:text-orange-400',
    delivered: 'text-green-700 dark:text-green-400',
    cancelled: 'text-red-700 dark:text-red-400',
    paid: 'text-emerald-700 dark:text-emerald-400',
    unpaid: 'text-rose-700 dark:text-rose-400',
    partialPayment: 'text-amber-700 dark:text-amber-400'
  };

  return (
    <Link href={href} className='block'>
      <Card
        className={`relative cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]} ${selectedStyles} ${needsAttention ? 'animate-pulse' : ''}`}
      >
        <CardContent className='p-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                value={value || ''}
                id={`status-${value}`}
                className='h-3 w-3'
                checked={selected}
              />
              <Label
                htmlFor={`status-${value}`}
                className={`text-xs font-medium ${textColors[variant]} cursor-pointer`}
              >
                {title}
              </Label>
            </div>
            <div className={`text-lg font-bold ${textColors[variant]}`}>
              {count}
            </div>
          </div>
          
          {/* Status indicators */}
          <div className='flex items-center justify-between mt-1'>
            {selected && (
              <Badge variant='secondary' className='flex items-center gap-1 text-xs px-1 py-0 h-5'>
                <Check className='h-2 w-2' />
                <span className='text-[10px]'>Selected</span>
              </Badge>
            )}
            {variant === 'notApproved' && needsAttention && count > 0 && (
              <div className='flex items-center gap-1'>
                <AlertCircle className='h-3 w-3 text-amber-600 dark:text-amber-400' />
                <span className='text-[10px] text-amber-700 dark:text-amber-400'>
                  Needs action
                </span>
              </div>
            )}
            {variant === 'paid' && count > 0 && (
              <div className='flex items-center gap-1'>
                <Check className='h-3 w-3 text-emerald-600' />
                <span className='text-[10px] text-emerald-700'>Fully paid</span>
              </div>
            )}
            {variant === 'partialPayment' && count > 0 && (
              <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3 text-amber-600' />
                <span className='text-[10px] text-amber-700'>Partial</span>
              </div>
            )}
            {variant === 'unpaid' && count > 0 && (
              <div className='flex items-center gap-1'>
                <AlertCircle className='h-3 w-3 text-rose-600' />
                <span className='text-[10px] text-rose-700'>Unpaid</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function SellListingPage({}: SellListingPageProps) {
  const getSaleStatusDisplayText = (status: SaleStatus): string => {
    switch (status) {
      case SaleStatus.APPROVED:
        return 'approved';
      case SaleStatus.NOT_APPROVED:
        return 'not approved';
      case SaleStatus.PARTIALLY_DELIVERED:
        return 'partially delivered';
      case SaleStatus.DELIVERED:
        return 'delivered';
      case SaleStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'unknown';
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Query‑string inputs - Add status filter
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');
  const statusFilter = searchParamsCache.get('status') || 'all';
  const paymentStatusFilter = searchParamsCache.get('paymentStatus') || 'all';

  // Helper function to build query strings
  const buildQueryString = (status: string, paymentStatus?: string) => {
    const params = new URLSearchParams();

    // Always include search if it exists
    if (search) params.set('q', search);

    // Always reset to page 1 when changing status
    params.set('page', '1');

    // Include limit
    params.set('limit', limit.toString());

    // Include date filters if they exist
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    // Set sale status
    params.set('status', status);
    
    // Set payment status if provided
    if (paymentStatus) {
      params.set('paymentStatus', paymentStatus);
    }

    return `?${params.toString()}`;
  };

  try {
    // Fetch data from API
    const { data } = await getAllSellsuserBased({
      page,
      limit,
      startDate,
      endDate
    });

    // ────────────────────────────────────────────────────────────────
    // Client‑side search filter with status filtering
    // ────────────────────────────────────────────────────────────────
    let filteredData = data.filter((item) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();

      // Check invoice number
      const invoiceMatch = item.invoiceNo?.toLowerCase().includes(searchLower);

      // Check customer name
      const customerMatch = item.customer?.name?.toLowerCase().includes(searchLower);

      // Check sale status
      const saleStatusDisplayText = getSaleStatusDisplayText(item.saleStatus);
      const saleStatusMatch = saleStatusDisplayText.includes(
        search.toLowerCase()
      );

      // Check sale status enum value directly
      const saleStatusEnumMatch = item.saleStatus.includes(search);

      // Check payment status
      const paymentStatusMatch = item.paymentStatus?.toLowerCase().includes(searchLower);

      return (
        invoiceMatch || customerMatch || saleStatusMatch || saleStatusEnumMatch || paymentStatusMatch
      );
    });

    // Apply sale status filter if not 'all'
    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(
        (item) => item.saleStatus === statusFilter
      );
    }

    // Apply payment status filter if not 'all'
    if (paymentStatusFilter !== 'all') {
      filteredData = filteredData.filter(
        (item) => item.paymentStatus === paymentStatusFilter
      );
    }

    // ────────────────────────────────────────────────────────────────
    // Count sell statuses (using ALL data, not filtered by status)
    // ────────────────────────────────────────────────────────────────
    const allStatusCounts = {
      [SaleStatus.APPROVED]: data.filter(
        (item) => item.saleStatus === SaleStatus.APPROVED
      ).length,
      [SaleStatus.NOT_APPROVED]: data.filter(
        (item) => item.saleStatus === SaleStatus.NOT_APPROVED
      ).length,
      [SaleStatus.PARTIALLY_DELIVERED]: data.filter(
        (item) => item.saleStatus === SaleStatus.PARTIALLY_DELIVERED
      ).length,
      [SaleStatus.DELIVERED]: data.filter(
        (item) => item.saleStatus === SaleStatus.DELIVERED
      ).length,
      [SaleStatus.CANCELLED]: data.filter(
        (item) => item.saleStatus === SaleStatus.CANCELLED
      ).length
    };

    // Count payment statuses
    const paymentStatusCounts = {
      PAID: data.filter((item) => item.paymentStatus === 'PAID').length,
      PARTIAL: data.filter((item) => item.paymentStatus === 'PARTIAL').length,
      PENDING: data.filter((item) => item.paymentStatus === 'PENDING').length
    };

    const totalSells = data.length;
    const needsApprovalCount = allStatusCounts[SaleStatus.NOT_APPROVED];

    // Current filtered count for selected status
    const filteredCount = filteredData.length;

    // ────────────────────────────────────────────────────────────────
    // Client‑side pagination
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      <div className='space-y-6'>
        {/* Sale Status Cards - Single Row */}
        <div className='space-y-2'>
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
            Sale Status
          </h3>
          <RadioGroup
            defaultValue={statusFilter}
            value={statusFilter}
          >
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6'>
              <StatusCard
                title='All'
                count={totalSells}
                variant='total'
                selected={statusFilter === 'all'}
                value='all'
                href={buildQueryString('all', paymentStatusFilter)}
              />
              <StatusCard
                title='Approved'
                count={allStatusCounts[SaleStatus.APPROVED]}
                variant='approved'
                selected={statusFilter === SaleStatus.APPROVED}
                value={SaleStatus.APPROVED}
                href={buildQueryString(SaleStatus.APPROVED, paymentStatusFilter)}
              />
              <StatusCard
                title='Not Approved'
                count={allStatusCounts[SaleStatus.NOT_APPROVED]}
                variant='notApproved'
                needsAttention={allStatusCounts[SaleStatus.NOT_APPROVED] > 0}
                selected={statusFilter === SaleStatus.NOT_APPROVED}
                value={SaleStatus.NOT_APPROVED}
                href={buildQueryString(SaleStatus.NOT_APPROVED, paymentStatusFilter)}
              />
              <StatusCard
                title='Partial'
                count={allStatusCounts[SaleStatus.PARTIALLY_DELIVERED]}
                variant='partial'
                selected={statusFilter === SaleStatus.PARTIALLY_DELIVERED}
                value={SaleStatus.PARTIALLY_DELIVERED}
                href={buildQueryString(SaleStatus.PARTIALLY_DELIVERED, paymentStatusFilter)}
              />
              <StatusCard
                title='Delivered'
                count={allStatusCounts[SaleStatus.DELIVERED]}
                variant='delivered'
                selected={statusFilter === SaleStatus.DELIVERED}
                value={SaleStatus.DELIVERED}
                href={buildQueryString(SaleStatus.DELIVERED, paymentStatusFilter)}
              />
              <StatusCard
                title='Cancelled'
                count={allStatusCounts[SaleStatus.CANCELLED]}
                variant='cancelled'
                selected={statusFilter === SaleStatus.CANCELLED}
                value={SaleStatus.CANCELLED}
                href={buildQueryString(SaleStatus.CANCELLED, paymentStatusFilter)}
              />
            </div>
          </RadioGroup>
        </div>

        {/* Payment Status Cards - Single Row */}
        <div className='space-y-2'>
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2'>
            <DollarSign className='h-4 w-4' />
            Payment Status
          </h3>
          <RadioGroup
            defaultValue={paymentStatusFilter}
            value={paymentStatusFilter}
          >
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-4'>
              <StatusCard
                title='All'
                count={totalSells}
                variant='total'
                selected={paymentStatusFilter === 'all'}
                value='all'
                href={buildQueryString(statusFilter, 'all')}
              />
              <StatusCard
                title='Paid'
                count={paymentStatusCounts.PAID}
                variant='paid'
                selected={paymentStatusFilter === 'PAID'}
                value='PAID'
                href={buildQueryString(statusFilter, 'PAID')}
              />
              <StatusCard
                title='Partial'
                count={paymentStatusCounts.PARTIAL}
                variant='partialPayment'
                selected={paymentStatusFilter === 'PARTIAL'}
                value='PARTIAL'
                href={buildQueryString(statusFilter, 'PARTIAL')}
              />
              <StatusCard
                title='Pending'
                count={paymentStatusCounts.PENDING}
                variant='unpaid'
                selected={paymentStatusFilter === 'PENDING'}
                value='PENDING'
                href={buildQueryString(statusFilter, 'PENDING')}
              />
            </div>
          </RadioGroup>
        </div>

        {/* Filter Status Display */}
        {(statusFilter !== 'all' || paymentStatusFilter !== 'all') && (
          <div className='bg-muted/50 rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 flex-wrap'>
                <Badge variant='outline' className='text-xs'>
                  Filters Applied
                </Badge>
                {statusFilter !== 'all' && (
                  <Badge variant='secondary' className='text-xs'>
                    Sale: {statusFilter.replace('_', ' ')}
                  </Badge>
                )}
                {paymentStatusFilter !== 'all' && (
                  <Badge variant='secondary' className='text-xs'>
                    Payment: {paymentStatusFilter}
                  </Badge>
                )}
                <span className='text-muted-foreground text-xs'>
                  Showing {filteredCount} result{filteredCount === 1 ? '' : 's'}
                </span>
              </div>
              <Link
                href={buildQueryString('all', 'all')}
                className='text-primary text-xs hover:underline'
              >
                Clear All
              </Link>
            </div>
          </div>
        )}

        {/* Attention Banner if there are pending approvals */}
        {needsApprovalCount > 0 && (
          <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
              <h3 className='font-semibold text-sm text-amber-800 dark:text-amber-300'>
                Attention Required
              </h3>
            </div>
            <p className='mt-1 text-xs text-amber-700 dark:text-amber-400'>
              You have {needsApprovalCount} sale
              {needsApprovalCount === 1 ? '' : 's'} waiting for approval.
            </p>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          data={paginatedData}
          totalItems={filteredCount}
          columns={sellColumns}
          currentPage={page}
          itemsPerPage={limit}
          searchValue={search}
          statusFilter={statusFilter}
          paymentStatusFilter={paymentStatusFilter}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  } catch  {
    return (
      <div className='p-4 text-red-500'>
        Error loading sells. Please try again later.
      </div>
    );
  }
}