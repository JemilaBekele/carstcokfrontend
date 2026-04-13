/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Download,
  Calculator,
  DollarSign
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getAllSells } from '@/service/Report';
import { getAllEmploy } from '@/service/employee';
import { getCustomer } from '@/service/customer';
import { ISell, SaleStatus, ItemSaleStatus } from '@/models/Sell';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface IEmployee {
  id: string;
  name: string;
  email: string;
}

interface ICustomer {
  id: string;
  name: string;
}

export const getColumns = (router: any): ColumnDef<ISell>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'invoiceNo',
    header: 'Invoice No',
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('invoiceNo')}</div>
    )
  },
  {
    accessorKey: 'saleDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sale Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('saleDate')
        ? new Date(row.getValue('saleDate') as string)
        : null;
      return <div>{date ? date.toLocaleDateString('en-GB') : '-'}</div>;
    }
  },

  {
    accessorKey: 'grandTotal',
    header: () => <div className='text-right'>Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grandTotal') as string);
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(amount);
      return <div className='text-right font-medium'>{formatted}</div>;
    }
  },
  {
    accessorKey: 'branch',
    header: 'Branch',
    cell: ({ row }) => {
      const branch = row.original.branch;
      return <div>{branch?.name || '-'}</div>;
    }
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = row.original.customer;
      return <div>{customer?.name || '-'}</div>;
    }
  },
  {
    accessorKey: 'createdBy',
    header: 'Seller',
    cell: ({ row }) => {
      const createdBy = row.original.createdBy;
      return <div>{createdBy?.name || '-'}</div>;
    }
  },

  {
    accessorKey: 'saleStatus',
    header: 'Sale Status',
    cell: ({ row }) => {
      const status = row.getValue('saleStatus') as SaleStatus;
      const getStatusVariant = (status: SaleStatus) => {
        switch (status) {
          case SaleStatus.DELIVERED:
            return 'default';
          case SaleStatus.APPROVED:
            return 'secondary';
          case SaleStatus.PARTIALLY_DELIVERED:
            return 'outline';
          case SaleStatus.NOT_APPROVED:
            return 'destructive';
          case SaleStatus.CANCELLED:
            return 'destructive';
          default:
            return 'outline';
        }
      };

      return (
        <Badge variant={getStatusVariant(status)}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'totalProducts',
    header: 'Items Count',
    cell: ({ row }) => {
      const count = row.original.totalProducts || 0;
      return <div className='text-center'>{count}</div>;
    }
  },
  {
    accessorKey: 'items',
    header: 'Items Details',
    cell: ({ row }) => {
      const items = row.original.items || [];
      const deliveredItems = items.filter(
        (item) => item.itemSaleStatus === ItemSaleStatus.DELIVERED
      ).length;
      const pendingItems = items.filter(
        (item) => item.itemSaleStatus === ItemSaleStatus.PENDING
      ).length;

      return (
        <div className='space-y-1 text-center'>
          <div className='text-sm'>{items.length} items</div>
          <div className='flex justify-center gap-2 text-xs'>
            {deliveredItems > 0 && (
              <Badge variant='default' className='h-4'>
                {deliveredItems} delivered
              </Badge>
            )}
            {pendingItems > 0 && (
              <Badge variant='outline' className='h-4'>
                {pendingItems} pending
              </Badge>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const sell = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/Selllist/view?id=${sell.id}`)
              }
            >
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

export function SellsDataTable() {
  const router = useRouter();

  const [data, setData] = useState<ISell[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedSaleStatus, setSelectedSaleStatus] = useState<string>('all');
  const [selectedItemSaleStatus, setSelectedItemSaleStatus] =
    useState<string>('all');

  // Commission calculation
  const [commissionPercent, setCommissionPercent] = useState<number>(2);
  const [commissionResult, setCommissionResult] = useState<number>(0);
  
  // Total sales calculation - ALWAYS SHOW THIS
  const [totalNetSales, setTotalNetSales] = useState<number>(0);
  const [totalGrandSales, setTotalGrandSales] = useState<number>(0);

  // Dropdown data
  const [sellers, setSellers] = useState<IEmployee[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const columns = getColumns(router); // Pass router to columns

  // Helper function to extract sells data from API response
  const extractSellsData = (response: any): ISell[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response.sells && Array.isArray(response.sells)) {
      return response.sells;
    }

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }

    return [];
  };

  // Calculate total sales whenever data changes
  useEffect(() => {
    const calculateTotals = () => {
      const totalNet = data.reduce((sum, sell) => sum + (sell.NetTotal || 0), 0);
      const totalGrand = data.reduce((sum, sell) => sum + (sell.grandTotal || 0), 0);
      setTotalNetSales(totalNet);
      setTotalGrandSales(totalGrand);
    };

    calculateTotals();
  }, [data]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sellsData, employeesData, customersData] = await Promise.all([
          getAllSells(),
          getAllEmploy(),
          getCustomer()
        ]);

        const sellsArray = extractSellsData(sellsData);
        setData(sellsArray);
        setSellers(employeesData || []);
        setCustomers(customersData || []);
      } catch  {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (selectedSeller && selectedSeller !== 'all')
        filters.createdById = selectedSeller;
      if (selectedBranch && selectedBranch !== 'all')
        filters.branchId = selectedBranch;
      if (selectedCustomer && selectedCustomer !== 'all')
        filters.customerId = selectedCustomer;
      if (selectedSaleStatus && selectedSaleStatus !== 'all')
        filters.saleStatus = selectedSaleStatus;
      if (selectedItemSaleStatus && selectedItemSaleStatus !== 'all')
        filters.itemSaleStatus = selectedItemSaleStatus;

      const sellsData = await getAllSells(filters);
      const sellsArray = extractSellsData(sellsData);
      setData(sellsArray);
    } catch  {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate commission
  const calculateCommission = () => {
    if (!selectedSeller || selectedSeller === 'all') return;

    const filteredData = selectedSeller
      ? data.filter((sell) => sell.createdBy?.id === selectedSeller)
      : data;

    const totalNet = filteredData.reduce(
      (sum, sell) => sum + (sell.NetTotal || 0),
      0
    );
    const commission = (totalNet * commissionPercent) / 100;
    setCommissionResult(commission);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(
      data.map((sell) => ({
        'Invoice No': sell.invoiceNo,
        'Sale Date': sell.saleDate
          ? new Date(sell.saleDate).toLocaleDateString('en-GB') // Use en-GB format for DD/MM/YYYY
          : '-',
        'Grand Total': sell.grandTotal,
        Branch: sell.branch?.name || '-',
        Customer: sell.customer?.name || '-',
        Seller: sell.createdBy?.name || '-',
        'Sale Status': sell.saleStatus,
        'Items Count': sell.totalProducts || 0,
        'Total Items': sell.items?.length || 0,
        'Delivered Items':
          sell.items?.filter(
            (item) => item.itemSaleStatus === ItemSaleStatus.DELIVERED
          ).length || 0,
        'Pending Items':
          sell.items?.filter(
            (item) => item.itemSaleStatus === ItemSaleStatus.PENDING
          ).length || 0
      }))
    );

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sells Data');
    writeFile(workbook, 'sells-data.xlsx');
  };

  // Clear all filters
  const clearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedSeller('all');
    setSelectedBranch('all');
    setSelectedCustomer('all');
    setSelectedSaleStatus('all');
    setSelectedItemSaleStatus('all');

    // Re-fetch all data when clearing filters
    try {
      setLoading(true);
      const sellsData = await getAllSells();
      const sellsArray = extractSellsData(sellsData);
      setData(sellsArray);
    } catch (error) {
      toast.error(error as string);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  return (
    <div className='w-full space-y-4'>
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Filters & Commission Calculator</CardTitle>
              <CardDescription>
                Filter sells data and calculate commissions
              </CardDescription>
            </div>
            
            {/* ALWAYS SHOW TOTAL SALES - NEW SECTION */}
            <div className='flex items-center gap-4'>
              {/* <div className='flex flex-col items-end'>
                <div className='flex items-center gap-2 text-sm font-medium text-gray-600'>
                  Total Net Sales:
                </div>
                <div className='text-lg font-bold text-green-700'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB'
                  }).format(totalNetSales)}
                </div>
              </div> */}
              <div className='flex flex-col items-end'>
                <div className='flex items-center gap-2 text-sm font-medium text-gray-600'>
                  Total Sales:
                </div>
                <div className='text-lg font-bold text-blue-700'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB'
                  }).format(totalGrandSales)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Update grid to have 6 columns for the filters */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6'>
            <div className='space-y-2'>
              <Label htmlFor='start-date'>Start Date</Label>
              <Input
                id='start-date'
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='end-date'>End Date</Label>
              <Input
                id='end-date'
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='seller'>Seller</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger>
                  <SelectValue placeholder='Select Seller' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Sellers</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='customer'>Customer</Label>
              <Select
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Customer' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='sale-status'>Sale Status</Label>
              <Select
                value={selectedSaleStatus}
                onValueChange={setSelectedSaleStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sale Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {Object.values(SaleStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='item-status'>Item Status</Label>
              <Select
                value={selectedItemSaleStatus}
                onValueChange={setSelectedItemSaleStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Item Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Item Statuses</SelectItem>
                  {Object.values(ItemSaleStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex gap-2'>
              <Button onClick={applyFilters} disabled={loading}>
                Apply Filters
              </Button>
              <Button variant='outline' onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            {/* Commission Calculator */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Label htmlFor='commission'>Commission %</Label>
                <Input
                  id='commission'
                  type='number'
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className='w-20'
                  min='0'
                  max='100'
                />
              </div>
              <Button
                onClick={calculateCommission}
                variant='outline'
                size='sm'
                disabled={!selectedSeller || selectedSeller === 'all'}
              >
                <Calculator className='mr-2 h-4 w-4' />
                Calculate
              </Button>
              {commissionResult > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  Commission:{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ETB'
                  }).format(commissionResult)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest of your table code remains the same */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Sells Data</CardTitle>
              <CardDescription>
                Manage and analyze your sales data
              </CardDescription>
            </div>
            <div className='flex items-center gap-4'>
              {/* Show row count and total sales */}
              <div className='text-sm text-gray-500'>
                Showing {data.length} records
              </div>
              <Button
                onClick={exportToExcel}
                variant='outline'
                size='sm'
                disabled={data.length === 0}
              >
                <Download className='mr-2 h-4 w-4' />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-center py-4'>
            <Input
              placeholder='Filter by invoice no...'
              value={
                (table.getColumn('invoiceNo')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('invoiceNo')?.setFilterValue(event.target.value)
              }
              className='max-w-sm'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='ml-auto'>
                  Columns <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className='capitalize'
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      {loading ? 'Loading...' : 'No results.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className='space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}