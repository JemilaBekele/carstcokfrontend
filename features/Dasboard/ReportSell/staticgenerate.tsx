/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
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
  VisibilityState,
  HeaderGroup,
  Cell,
  Row,
  Table
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  BarChart3,
  Box,
  PackageOpen
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table as UITable,
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
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSalesReports } from '@/service/Report';
import { getShops } from '@/service/shop';
import { getBranches } from '@/service/branch';

// models/sellreport.ts

export interface ProductReportItem {
  productId: string;
  product: {
    id: string;
    name: string;
    productCode: string;
    category?: {
      id: string;
      name: string;
    };
    brand?: {
      id: string;
      name: string;
    };
    hasBox: boolean;
    boxSize: number | null;
    UnitOfMeasure: string | null;
  } | null;
  quantity: number;
  revenue: number;
  avgPrice: number;
  hasBox: boolean;
  boxSize: number | null;
  boxQuantity: number;
  remainingPieces: number;
  UnitOfMeasure: string | null;
  category: string;
  brand: string;
  valueScore: number;
}

export interface SellerReportItem {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  totalRevenue: number;
  totalGrossRevenue: number;
  totalOrders: number;
}

export interface SalesReportResponse {
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  filters: {
    shopId?: string;
    branchId?: string;
    limit: number;
    slowMoveThreshold: number;
  };
  summary: {
    totalItemsAnalyzed: number;
    totalSellers: number;
    totalSlowMovingItems: number;
    totalTopItems: number;
    totalProducts: number;
  };
  reports: {
    topItemsByQuantity: ProductReportItem[];
    topItemsByRevenue: ProductReportItem[];
    topItemsByValue: ProductReportItem[];
    slowMovingItems: ProductReportItem[];
    topSellers: SellerReportItem[];
  };
}
// Define columns for different report types
const topItemsColumns: ColumnDef<ProductReportItem>[] = [
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
    id: 'product.name',
    accessorKey: 'product.name',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className='font-medium'>{row.original.product?.name || 'N/A'}</div>
    )
  },
  {
    id: 'product.productCode',
    accessorKey: 'product.productCode',
    header: 'Product Code',
    cell: ({ row }) => (
      <div className='font-mono text-sm'>
        {row.original.product?.productCode || 'N/A'}
      </div>
    )
  },
  {
    id: 'product.category.name',
    accessorKey: 'product.category.name',
    header: 'Category',
    cell: ({ row }) => (
      <div>{row.original.product?.category?.name || 'N/A'}</div>
    )
  },
  {
    id: 'product.brand.name',
    accessorKey: 'product.brand.name',
    header: 'Brand',
    cell: ({ row }) => (
      <div>{row.original.product?.brand?.name || 'N/A'}</div>
    )
  },
  {
    id: 'quantity',
    accessorKey: 'quantity',
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quantity Sold
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      const displayQuantity = item.hasBox && item.boxQuantity > 0
        ? `${item.boxQuantity} box(es) + ${item.remainingPieces} pcs`
        : `${item.quantity} ${item.UnitOfMeasure || 'units'}`;
      
      return (
        <div className='text-right font-medium'>
          <div>{displayQuantity}</div>
          {item.hasBox && item.boxSize && (
            <div className='text-xs text-muted-foreground'>
              ({item.boxSize} pcs/box)
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'revenue',
    accessorKey: 'revenue',
    header: () => <div className='text-right'>Revenue</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(row.original.revenue);
      return <div className='text-right font-medium'>{formatted}</div>;
    }
  },
  {
    id: 'avgPrice',
    accessorKey: 'avgPrice',
    header: () => <div className='text-right'>Avg. Unit Price</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(row.original.avgPrice);
      return <div className='text-right font-medium'>{formatted}</div>;
    }
  },
  {
    id: 'valueScore',
    accessorKey: 'valueScore',
    header: () => <div className='text-right'>Value Score</div>,
    cell: ({ row }) => {
      const score = row.original.valueScore || 0;
      return <div className='text-right font-medium'>{score.toFixed(2)}</div>;
    }
  }
];

const sellersColumns: ColumnDef<SellerReportItem>[] = [
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
    id: 'user.name',
    accessorKey: 'user.name',
    header: 'Seller Name',
    cell: ({ row }) => (
      <div className='font-medium'>{row.original.user?.name || 'N/A'}</div>
    )
  },
  {
    id: 'user.email',
    accessorKey: 'user.email',
    header: 'Email',
    cell: ({ row }) => <div>{row.original.user?.email || 'N/A'}</div>
  },
  {
    id: 'totalOrders',
    accessorKey: 'totalOrders',
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total Orders
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className='text-center font-medium'>
          {row.original.totalOrders}
        </div>
      );
    }
  },
  {
    id: 'totalRevenue',
    accessorKey: 'totalRevenue',
    header: () => <div className='text-right'>Total Sales</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(row.original.totalRevenue);
      return <div className='text-right font-medium'>{formatted}</div>;
    }
  },
  {
    id: 'totalGrossRevenue',
    accessorKey: 'totalGrossRevenue',
    header: () => <div className='text-right'>Gross Revenue</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(row.original.totalGrossRevenue);
      return <div className='text-right font-medium'>{formatted}</div>;
    }
  }
];

interface IShop {
  id: string;
  name: string;
}

interface IBranch {
  id: string;
  name: string;
}

const renderTable = <T,>(
  table: Table<T>,
  exportData: T[],
  exportName: string,
  loading: boolean,
  filterColumn?: string
) => {
  const filterCol = filterColumn || 'product.name';
  const column = table.getColumn(filterCol);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{exportName}</CardTitle>
          <Button
            onClick={() => exportToExcel(exportData, exportName)}
            variant='outline'
            size='sm'
            disabled={exportData.length === 0}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center py-4'>
          {column && (
            <Input
              placeholder={`Filter ${exportName.toLowerCase()}...`}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className='max-w-sm'
            />
          )}
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
          <UITable>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
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
                table.getRowModel().rows.map((row: Row<T>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell: Cell<T, any>) => (
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
                    colSpan={table.getAllColumns().length}
                    className='h-24 text-center'
                  >
                    {loading ? 'Loading...' : 'No results.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </UITable>
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
  );
};

const exportToExcel = (data: any[], sheetName: string) => {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);
  writeFile(workbook, `sales-reports-${sheetName.toLowerCase()}.xlsx`);
};

export function SalesReportsDataTable() {
  const [reportData, setReportData] = useState<SalesReportResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Table states for different report types
  const [topQuantitySorting, setTopQuantitySorting] = useState<SortingState>([]);
  const [topRevenueSorting, setTopRevenueSorting] = useState<SortingState>([]);
  const [slowMovingSorting, setSlowMovingSorting] = useState<SortingState>([]);
  const [sellersSorting, setSellersSorting] = useState<SortingState>([]);
  
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [limit, setLimit] = useState<number>(10);
  const [slowMoveThreshold, setSlowMoveThreshold] = useState<number>(10);

  // Dropdown data
  const [, setShops] = useState<IShop[]>([]);
  const [, setBranches] = useState<IBranch[]>([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Load reports with current filters
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedShop && selectedShop !== 'all') params.shopId = selectedShop;
      if (selectedBranch && selectedBranch !== 'all')
        params.branchId = selectedBranch;
      if (limit) params.limit = limit;
      if (slowMoveThreshold) params.slowMoveThreshold = slowMoveThreshold;

      const reportData = await getSalesReports(params);
      setReportData(reportData);
    } catch {
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [
    startDate,
    endDate,
    selectedShop,
    selectedBranch,
    limit,
    slowMoveThreshold
  ]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shopsData, branchesData] = await Promise.all([
          getShops(),
          getBranches()
        ]);

        setShops(shopsData || []);
        setBranches(branchesData || []);

        await loadReports();
      } catch {
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadReports]);

  // Clear all filters
  const clearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedShop('all');
    setSelectedBranch('all');
    setLimit(10);
    setSlowMoveThreshold(10);
    await loadReports();
  };

  // Create tables for different data types
  const topItemsByQuantityTable = useReactTable({
    data: reportData?.reports.topItemsByQuantity || [],
    columns: topItemsColumns,
    onSortingChange: setTopQuantitySorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: topQuantitySorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  const topItemsByRevenueTable = useReactTable({
    data: reportData?.reports.topItemsByRevenue || [],
    columns: topItemsColumns,
    onSortingChange: setTopRevenueSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: topRevenueSorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  const slowMovingItemsTable = useReactTable({
    data: reportData?.reports.slowMovingItems || [],
    columns: topItemsColumns,
    onSortingChange: setSlowMovingSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: slowMovingSorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  const topSellersTable = useReactTable({
    data: reportData?.reports.topSellers || [],
    columns: sellersColumns,
    onSortingChange: setSellersSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: sellersSorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Items Analyzed',
      value: reportData?.summary.totalItemsAnalyzed || 0,
      icon: Package,
      description: 'Unique products in report',
      color: 'blue'
    },
    {
      title: 'Top Sellers',
      value: reportData?.summary.totalSellers || 0,
      icon: Users,
      description: 'Active sales personnel',
      color: 'green'
    },
    {
      title: 'Total Revenue (Top Items)',
      value:
        reportData?.reports.topItemsByRevenue.reduce(
          (sum, item) => sum + item.revenue,
          0
        ) || 0,
      icon: DollarSign,
      description: 'From top revenue items',
      color: 'emerald'
    },
    {
      title: 'Slow Moving Items',
      value: reportData?.reports.slowMovingItems.length || 0,
      icon: AlertTriangle,
      description: 'Items needing attention',
      color: 'orange'
    }
  ];

  return (
    <div className='w-full space-y-4'>
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Reports & Analytics</CardTitle>
          <CardDescription>
            Generate comprehensive sales performance reports
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
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
          </div>

          <div className='flex gap-2'>
            <Button onClick={loadReports} disabled={loading}>
              Generate Reports
            </Button>
            <Button variant='outline' onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Report Period Info */}
          {reportData && (
            <div className='bg-muted rounded-lg p-3'>
              <div className='text-sm font-medium'>Report Period</div>
              <div className='text-muted-foreground text-sm'>
                {new Date(
                  reportData.reportPeriod.startDate
                ).toLocaleDateString()}{' '}
                -{' '}
                {new Date(reportData.reportPeriod.endDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {card.title}
                </CardTitle>
                <card.icon className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {typeof card.value === 'number' && card.value >= 1000
                    ? `${(card.value / 1000).toFixed(1)}k`
                    : card.value}
                </div>
                <p className='text-muted-foreground text-xs'>
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>
            <BarChart3 className='mr-2 h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='topQuantity'>
            <TrendingUp className='mr-2 h-4 w-4' />
            Top by Quantity
          </TabsTrigger>
          <TabsTrigger value='topRevenue'>
            <DollarSign className='mr-2 h-4 w-4' />
            Top by Revenue
          </TabsTrigger>
          <TabsTrigger value='slowMoving'>
            <AlertTriangle className='mr-2 h-4 w-4' />
            Slow Moving
          </TabsTrigger>
          <TabsTrigger value='topSellers'>
            <Users className='mr-2 h-4 w-4' />
            Top Sellers
          </TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='space-y-4'>
          {reportData ? (
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {/* Top Items by Quantity */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Items by Quantity</CardTitle>
                  <CardDescription>
                    Most sold products by quantity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {reportData.reports.topItemsByQuantity
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between rounded border p-2'
                        >
                          <div>
                            <div className='font-medium'>
                              {item.product?.name}
                            </div>
                            <div className='text-muted-foreground text-sm'>
                              {item.product?.productCode}
                            </div>
                            {item.hasBox && (
                              <Badge variant='outline' className='mt-1 text-xs'>
                                <Box className='mr-1 h-3 w-3' />
                                Box: {item.boxSize} pcs/box
                              </Badge>
                            )}
                          </div>
                          <div className='text-right'>
                            <div className='font-bold'>
                              {item.hasBox && item.boxQuantity > 0
                                ? `${item.boxQuantity} boxes + ${item.remainingPieces} pcs`
                                : `${item.quantity} ${item.UnitOfMeasure || 'units'}`}
                            </div>
                            <div className='text-sm'>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'ETB'
                              }).format(item.revenue)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Items by Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Items by Revenue</CardTitle>
                  <CardDescription>
                    Highest revenue generating products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {reportData.reports.topItemsByRevenue
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between rounded border p-2'
                        >
                          <div>
                            <div className='font-medium'>
                              {item.product?.name}
                            </div>
                            <div className='text-muted-foreground text-sm'>
                              {item.product?.productCode}
                            </div>
                            {item.hasBox && (
                              <Badge variant='outline' className='mt-1 text-xs'>
                                <Box className='mr-1 h-3 w-3' />
                                Box: {item.boxSize} pcs/box
                              </Badge>
                            )}
                          </div>
                          <div className='text-right'>
                            <div className='font-bold'>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'ETB'
                              }).format(item.revenue)}
                            </div>
                            <div className='text-sm'>
                              {item.hasBox && item.boxQuantity > 0
                                ? `${item.boxQuantity} boxes + ${item.remainingPieces} pcs`
                                : `${item.quantity} ${item.UnitOfMeasure || 'units'}`}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='p-6'>
                <div className='text-muted-foreground text-center'>
                  {loading
                    ? 'Loading reports...'
                    : 'Generate reports to see overview'}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value='topQuantity'>
          {renderTable(
            topItemsByQuantityTable,
            reportData?.reports.topItemsByQuantity || [],
            'Top Items By Quantity',
            loading,
            'product.name'
          )}
        </TabsContent>
        <TabsContent value='topRevenue'>
          {renderTable(
            topItemsByRevenueTable,
            reportData?.reports.topItemsByRevenue || [],
            'Top Items By Revenue',
            loading,
            'product.name'
          )}
        </TabsContent>
        <TabsContent value='slowMoving'>
          {renderTable(
            slowMovingItemsTable,
            reportData?.reports.slowMovingItems || [],
            'Slow Moving Items',
            loading,
            'product.name'
          )}
        </TabsContent>
        <TabsContent value='topSellers'>
          {renderTable(
            topSellersTable,
            reportData?.reports.topSellers || [],
            'Top Sellers',
            loading,
            'user.name'
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}