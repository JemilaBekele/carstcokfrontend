/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/newdatatable';
import { getAllSellsstoregetAll } from '@/service/Sell';
import { sellColumns } from './tables/columns';
import { SaleStatus } from '@/models/Sell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type SellListingPageProps = object;

function StatusCard({
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
    | 'partial'
    | 'delivered'
    | 'cancelled'
    | 'total'
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
    partial:
      'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
    delivered:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
    cancelled: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    'stock-pending': 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20',
    'stock-partial': 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20'
  };

  const selectedStyles = selected
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    : '';

  const textColors = {
    default: 'text-foreground',
    total: 'text-foreground',
    approved: 'text-blue-700 dark:text-blue-400',
    partial: 'text-orange-700 dark:text-orange-400',
    delivered: 'text-green-700 dark:text-green-400',
    cancelled: 'text-red-700 dark:text-red-400',
    'stock-pending': 'text-purple-700 dark:text-purple-400',
    'stock-partial': 'text-indigo-700 dark:text-indigo-400'
  };

  return (
    <Link href={href} className='block'>
      <Card
        className={`relative cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]} ${selectedStyles} ${needsAttention ? 'animate-pulse' : ''}`}
      >
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div className='flex items-center gap-2'>
            <RadioGroupItem
              value={value || ''}
              id={`status-${value}`}
              className='h-4 w-4'
              checked={selected}
            />
            <Label
              htmlFor={`status-${value}`}
              className={`text-sm font-medium ${textColors[variant]} cursor-pointer`}
            >
              {title}
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className={`text-2xl font-bold ${textColors[variant]}`}>
              {count}
            </div>
            {selected && (
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Check className='h-3 w-3' />
                Selected
              </Badge>
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

  // Helper function to build query strings
  const buildQueryString = (status: string) => {
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

    // Set status
    params.set('status', status);

    return `?${params.toString()}`;
  };

  try {
    // Fetch data from API - Make sure SellStockCorrection is included
    const { data } = await getAllSellsstoregetAll({
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

      // Check invoice number (case-sensitive)
      const invoiceMatch = item.invoiceNo?.toLowerCase().includes(searchLower);

      // Check customer name (case-sensitive)
      const customerMatch = item.customer?.name?.toLowerCase().includes(searchLower);

      // Check sale status (case-sensitive)
      const saleStatusDisplayText = getSaleStatusDisplayText(item.saleStatus);
      const saleStatusMatch = saleStatusDisplayText.includes(
        search.toLowerCase()
      );

      // Check sale status enum value directly (case-sensitive)
      const saleStatusEnumMatch = item.saleStatus.includes(search);

 
      return (
        invoiceMatch || 
        customerMatch || 
        saleStatusMatch || 
        saleStatusEnumMatch       );
    });

    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      // Check if it's a stock correction filter
 
        // Regular sale status filter
        filteredData = filteredData.filter(
          (item) => item.saleStatus === statusFilter
        );
    
    }

    // ────────────────────────────────────────────────────────────────
    // Count sell statuses and stock correction statuses
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
        {/* Radio Group for Status Filter */}
        <RadioGroup
          defaultValue={statusFilter}
          className='space-y-3'
          value={statusFilter}
        >
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
            <StatusCard
              title='All Sells'
              count={totalSells}
              variant='total'
              selected={statusFilter === 'all'}
              value='all'
              href={buildQueryString('all')}
            />
            <StatusCard
              title='Approved'
              count={allStatusCounts[SaleStatus.APPROVED]}
              variant='approved'
              selected={statusFilter === SaleStatus.APPROVED}
              value={SaleStatus.APPROVED}
              href={buildQueryString(SaleStatus.APPROVED)}
            />
            <StatusCard
              title='Partially Delivered'
              count={allStatusCounts[SaleStatus.PARTIALLY_DELIVERED]}
              variant='partial'
              selected={statusFilter === SaleStatus.PARTIALLY_DELIVERED}
              value={SaleStatus.PARTIALLY_DELIVERED}
              href={buildQueryString(SaleStatus.PARTIALLY_DELIVERED)}
            />
            <StatusCard
              title='Delivered'
              count={allStatusCounts[SaleStatus.DELIVERED]}
              variant='delivered'
              selected={statusFilter === SaleStatus.DELIVERED}
              value={SaleStatus.DELIVERED}
              href={buildQueryString(SaleStatus.DELIVERED)}
            />
            <StatusCard
              title='Cancelled'
              count={allStatusCounts[SaleStatus.CANCELLED]}
              variant='cancelled'
              selected={statusFilter === SaleStatus.CANCELLED}
              value={SaleStatus.CANCELLED}
              href={buildQueryString(SaleStatus.CANCELLED)}
            />
      
          </div>
        </RadioGroup>

        {/* Filter Status Display */}
        {statusFilter !== 'all' && (
          <div className='bg-muted/50 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-sm'>
                  Filter Applied
                </Badge>
                <span className='text-muted-foreground text-sm'>
                  Showing {filteredCount} {
                    statusFilter.startsWith('stock-') 
                      ? statusFilter.replace('stock-', '').toLowerCase() 
                      : statusFilter.toLowerCase()
                  } sale{filteredCount === 1 ? '' : 's'}
                </span>
              </div>
              <Link
                href={buildQueryString('all')}
                className='text-primary text-sm hover:underline'
              >
                Clear Filter
              </Link>
            </div>
          </div>
        )}

     
        {/* Data Table */}
        <DataTable
          data={paginatedData}
          totalItems={filteredCount} // Use filtered count for pagination
          columns={sellColumns}
          currentPage={page}
          itemsPerPage={limit}
          searchValue={search}
          statusFilter={statusFilter}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading sells:', error);
    return (
      <div className='p-4 text-red-500'>
        Error loading sells. Please try again later.
      </div>
    );
  }
}