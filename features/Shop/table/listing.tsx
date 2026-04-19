/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/newdatatable';
import { getAllSells } from '@/service/Sell';
import { sellColumns } from './tables/columns';
import { SaleStatus } from '@/models/Sell';
import { AlertCircle, DollarSign } from 'lucide-react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import ExportButtons from '@/components/ExportButtonsd';
import { StatusCard } from '../userbased/listing';
import { getAllEmployapi } from '@/service/employee';
import { IEmployee } from '@/models/employee';
import EmployeeFilter from './employee';

type SellListingPageProps = object;

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
  // Query‑string inputs - Add employee filter and payment status filter
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');
  const statusFilter = searchParamsCache.get('status') || 'all';
  const employeeFilter = searchParamsCache.get('employee') || 'all';
  const paymentStatusFilter = searchParamsCache.get('paymentStatus') || 'all';
  const uncheckedCorrectionsFilter = searchParamsCache.get('unchecked') === 'true';

  // Helper function to build query strings
  const buildQueryStringLocal = (params: {
    status?: string;
    employee?: string;
    paymentStatus?: string;
    unchecked?: boolean;
    page?: string;
  }) => {
    const urlParams = new URLSearchParams();

    // Always include search if it exists
    if (search) urlParams.set('q', search);

    // Set page (default to 1 when changing filters)
    urlParams.set('page', params.page || '1');

    // Include limit
    urlParams.set('limit', limit.toString());

    // Include date filters if they exist
    if (startDate) urlParams.set('startDate', startDate);
    if (endDate) urlParams.set('endDate', endDate);

    // Set status
    urlParams.set('status', params.status || statusFilter);

    // Set employee - ensure it's a string
    const employeeValue = params.employee || employeeFilter;
    urlParams.set('employee', employeeValue.toString());

    // Set payment status
    const paymentStatusValue = params.paymentStatus || paymentStatusFilter;
    urlParams.set('paymentStatus', paymentStatusValue.toString());

    // Set unchecked corrections filter
    const uncheckedValue = params.unchecked !== undefined ? params.unchecked : uncheckedCorrectionsFilter;
    if (uncheckedValue) {
      urlParams.set('unchecked', 'true');
    } else {
      urlParams.delete('unchecked');
    }

    return `?${urlParams.toString()}`;
  };

  // Build status filter URL helper (for StatusCard links)
  const buildStatusFilterUrl = (status: string) => {
    return buildQueryStringLocal({
      status: status,
      employee: employeeFilter,
      paymentStatus: paymentStatusFilter,
      unchecked: uncheckedCorrectionsFilter,
      page: '1'
    });
  };

  // Build payment status filter URL helper
  const buildPaymentStatusFilterUrl = (paymentStatus: string) => {
    return buildQueryStringLocal({
      status: statusFilter,
      employee: employeeFilter,
      paymentStatus: paymentStatus,
      unchecked: uncheckedCorrectionsFilter,
      page: '1'
    });
  };

  try {
    // Fetch data from API
    const { data: salesData } = await getAllSells({
      page,
      limit,
      startDate,
      endDate
    });

    // Fetch employees for the dropdown
    const employees = await getAllEmployapi().catch(() => []);

    // ────────────────────────────────────────────────────────────────
    // Client‑side search filter with status, employee, AND payment status filtering
    // ────────────────────────────────────────────────────────────────
    const filteredData = salesData.filter((item) => {
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const invoiceMatch = item.invoiceNo?.toLowerCase().includes(searchLower);
        const customerMatch = item.customer?.name?.toLowerCase().includes(searchLower);
        const createdByMatch = item.createdBy?.name?.toLowerCase().includes(searchLower);
        const saleStatusDisplayText = getSaleStatusDisplayText(item.saleStatus);
        const saleStatusMatch = saleStatusDisplayText.includes(searchLower);
        const saleStatusEnumMatch = item.saleStatus.includes(search);
        const paymentStatusMatch = item.paymentStatus?.toLowerCase().includes(searchLower);

        if (!(invoiceMatch || customerMatch || createdByMatch || saleStatusMatch || saleStatusEnumMatch || paymentStatusMatch)) {
          return false;
        }
      }

      // Apply status filter
      if (statusFilter !== 'all' && item.saleStatus !== statusFilter) {
        return false;
      }

      // Apply employee filter
      if (employeeFilter !== 'all') {
        const employeeId = item.createdBy?.id;
        if (employeeId !== employeeFilter) {
          return false;
        }
      }

      // Apply payment status filter
      if (paymentStatusFilter !== 'all' && item.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      return true;
    });

    // ────────────────────────────────────────────────────────────────
    // Count sell statuses (using ALL data, not filtered by status/employee)
    // ────────────────────────────────────────────────────────────────
    const allStatusCounts = {
      [SaleStatus.APPROVED]: salesData.filter(
        (item) => item.saleStatus === SaleStatus.APPROVED
      ).length,
      [SaleStatus.NOT_APPROVED]: salesData.filter(
        (item) => item.saleStatus === SaleStatus.NOT_APPROVED
      ).length,
      [SaleStatus.PARTIALLY_DELIVERED]: salesData.filter(
        (item) => item.saleStatus === SaleStatus.PARTIALLY_DELIVERED
      ).length,
      [SaleStatus.DELIVERED]: salesData.filter(
        (item) => item.saleStatus === SaleStatus.DELIVERED
      ).length,
      [SaleStatus.CANCELLED]: salesData.filter(
        (item) => item.saleStatus === SaleStatus.CANCELLED
      ).length
    };

    // Count payment statuses
    const paymentStatusCounts = {
      PAID: salesData.filter((item) => item.paymentStatus === 'PAID').length,
      PARTIAL: salesData.filter((item) => item.paymentStatus === 'PARTIAL').length,
      PENDING: salesData.filter((item) => item.paymentStatus === 'PENDING').length
    };

    const totalSells = salesData.length;
    const needsApprovalCount = allStatusCounts[SaleStatus.NOT_APPROVED];
    const filteredCount = filteredData.length;

    // Get selected employee name for display
    const selectedEmployee = employees.find((emp: IEmployee) => {
      const empId = emp.id;
      return empId === employeeFilter;
    });

    // ────────────────────────────────────────────────────────────────
    // Client‑side pagination
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      <div className='space-y-6'>
        {/* Export Buttons and Header */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Sales Management</div>
          <ExportButtons 
            data={filteredData} 
            statusCounts={allStatusCounts}
            totalSells={totalSells}
          />
        </div>

        {/* Employee Filter Dropdown - Client Component */}
        <EmployeeFilter
          employees={employees}
          currentEmployeeFilter={employeeFilter}
          statusFilter={statusFilter}
          search={search}
          limit={limit}
          startDate={startDate}
          endDate={endDate}
          uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
        />

        {/* Radio Group for Sale Status Filter */}
        <div className='space-y-2'>
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
            Sale Status
          </h3>
          <RadioGroup
            defaultValue={statusFilter}
            value={statusFilter}
          >
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
              <StatusCard
                title='All'
                count={totalSells}
                variant='total'
                selected={statusFilter === 'all'}
                value='all'
                href={buildStatusFilterUrl('all')}
              />
              <StatusCard
                title='Approved'
                count={allStatusCounts[SaleStatus.APPROVED]}
                variant='approved'
                selected={statusFilter === SaleStatus.APPROVED}
                value={SaleStatus.APPROVED}
                href={buildStatusFilterUrl(SaleStatus.APPROVED)}
              />
              <StatusCard
                title='Not Approved'
                count={allStatusCounts[SaleStatus.NOT_APPROVED]}
                variant='notApproved'
                needsAttention={allStatusCounts[SaleStatus.NOT_APPROVED] > 0}
                selected={statusFilter === SaleStatus.NOT_APPROVED}
                value={SaleStatus.NOT_APPROVED}
                href={buildStatusFilterUrl(SaleStatus.NOT_APPROVED)}
              />
              <StatusCard
                title='Partial'
                count={allStatusCounts[SaleStatus.PARTIALLY_DELIVERED]}
                variant='partial'
                selected={statusFilter === SaleStatus.PARTIALLY_DELIVERED}
                value={SaleStatus.PARTIALLY_DELIVERED}
                href={buildStatusFilterUrl(SaleStatus.PARTIALLY_DELIVERED)}
              />
              <StatusCard
                title='Delivered'
                count={allStatusCounts[SaleStatus.DELIVERED]}
                variant='delivered'
                selected={statusFilter === SaleStatus.DELIVERED}
                value={SaleStatus.DELIVERED}
                href={buildStatusFilterUrl(SaleStatus.DELIVERED)}
              />
              <StatusCard
                title='Cancelled'
                count={allStatusCounts[SaleStatus.CANCELLED]}
                variant='cancelled'
                selected={statusFilter === SaleStatus.CANCELLED}
                value={SaleStatus.CANCELLED}
                href={buildStatusFilterUrl(SaleStatus.CANCELLED)}
              />
            </div>
          </RadioGroup>
        </div>

        {/* Radio Group for Payment Status Filter */}
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
                href={buildPaymentStatusFilterUrl('all')}
              />
              <StatusCard
                title='Paid'
                count={paymentStatusCounts.PAID}
                variant='paid'
                selected={paymentStatusFilter === 'PAID'}
                value='PAID'
                href={buildPaymentStatusFilterUrl('PAID')}
              />
              <StatusCard
                title='Partial'
                count={paymentStatusCounts.PARTIAL}
                variant='partialPayment'
                selected={paymentStatusFilter === 'PARTIAL'}
                value='PARTIAL'
                href={buildPaymentStatusFilterUrl('PARTIAL')}
              />
              <StatusCard
                title='Pending'
                count={paymentStatusCounts.PENDING}
                variant='unpaid'
                selected={paymentStatusFilter === 'PENDING'}
                value='PENDING'
                href={buildPaymentStatusFilterUrl('PENDING')}
              />
            </div>
          </RadioGroup>
        </div>

        {/* Filter Status Display */}
        {(statusFilter !== 'all' || employeeFilter !== 'all' || paymentStatusFilter !== 'all' || uncheckedCorrectionsFilter) && (
          <div className='bg-muted/50 rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Filters Applied
                </Badge>
                
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Sale: {getSaleStatusDisplayText(statusFilter as SaleStatus)}
                  </Badge>
                )}
                
                {employeeFilter !== 'all' && selectedEmployee && (
                  <Badge variant="secondary" className="text-xs">
                    Employee: {selectedEmployee.name}
                  </Badge>
                )}
                
                {paymentStatusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Payment: {paymentStatusFilter}
                  </Badge>
                )}
                
                {uncheckedCorrectionsFilter && (
                  <Badge className="text-xs">
                    Unchecked Corrections Only
                  </Badge>
                )}
                
                <span className='text-muted-foreground text-xs'>
                  Showing {filteredCount} sale{filteredCount === 1 ? '' : 's'}
                </span>
              </div>
              
              <Link
                href={buildQueryStringLocal({
                  status: 'all',
                  employee: 'all',
                  paymentStatus: 'all',
                  unchecked: false,
                  page: '1'
                })}
                className='text-primary text-xs hover:underline'
              >
                Clear All
              </Link>
            </div>
          </div>
        )}

        {/* Attention Banners */}
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
          employeeFilter={employeeFilter}
          paymentStatusFilter={paymentStatusFilter}
          uncheckedCorrectionsFilter={uncheckedCorrectionsFilter}
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