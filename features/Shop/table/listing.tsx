/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/newdatatable';
import { getAllSells } from '@/service/Sell';
import { sellColumns } from './tables/columns';
import { SaleStatus } from '@/models/Sell';
import { AlertCircle } from 'lucide-react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import ExportButtons from '@/components/ExportButtonsd';
import { StatusCard } from '../userbased/listing';
import { getAllEmployapi } from '@/service/employee';
import { IEmployee } from '@/models/employee';
import EmployeeFilter from './employee';
import UncheckedCorrectionsFilter from './UncheckedCorrectionsFilter'; // Import the client component

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
  // Query‑string inputs - Add employee filter
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');
  const statusFilter = searchParamsCache.get('status') || 'all';
  const employeeFilter = searchParamsCache.get('employee') || 'all';
  const uncheckedCorrectionsFilter = searchParamsCache.get('unchecked') === 'true';

  // Helper function to build query strings
  const buildQueryStringLocal = (params: {
    status?: string;
    employee?: string;
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
    // Client‑side search filter with status AND employee filtering
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

        if (!(invoiceMatch || customerMatch || createdByMatch || saleStatusMatch || saleStatusEnumMatch)) {
          return false;
        }
      }

      // Apply status filter
      if (statusFilter !== 'all' && item.saleStatus !== statusFilter) {
        return false;
      }

      // Apply employee filter
      if (employeeFilter !== 'all') {
        // Check both _id and id for employee matching
        const employeeId = item.createdBy?.id;
        if (employeeId !== employeeFilter) {
          return false;
        }
      }

  

      return true;
    });

    // Count sells with unchecked corrections


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

       

        {/* Radio Group for Status Filter */}
        <RadioGroup
          defaultValue={statusFilter}
          className='space-y-3'
          value={statusFilter}
        >
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6'>
            <StatusCard
              title='All Sells'
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
              title='Partially Delivered'
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

        {/* Filter Status Display */}
        {(statusFilter !== 'all' || employeeFilter !== 'all' || uncheckedCorrectionsFilter) && (
          <div className='bg-muted/50 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='text-sm'>
                  Filters Applied
                </Badge>
                
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-sm">
                    Status: {getSaleStatusDisplayText(statusFilter as SaleStatus)}
                  </Badge>
                )}
                
                {employeeFilter !== 'all' && selectedEmployee && (
                  <Badge variant="secondary" className="text-sm">
                    Employee: {selectedEmployee.name}
                  </Badge>
                )}
                
                {uncheckedCorrectionsFilter && (
                  <Badge className="text-sm">
                    Unchecked Corrections Only
                  </Badge>
                )}
                
                <span className='text-muted-foreground text-sm'>
                  Showing {filteredCount} sale{filteredCount === 1 ? '' : 's'}
                </span>
              </div>
              
              <Link
                href={buildQueryStringLocal({
                  status: 'all',
                  employee: 'all',
                  unchecked: false,
                  page: '1'
                })}
                className='text-primary text-sm hover:underline'
              >
                Clear All Filters
              </Link>
            </div>
          </div>
        )}

        {/* Attention Banners */}
        {needsApprovalCount > 0 && (
          <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-400' />
              <h3 className='font-semibold text-amber-800 dark:text-amber-300'>
                Attention Required
              </h3>
            </div>
            <p className='mt-1 text-sm text-amber-700 dark:text-amber-400'>
              You have {needsApprovalCount} sale
              {needsApprovalCount === 1 ? '' : 's'} waiting for approval. Please
              review and approve them to proceed with delivery.
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