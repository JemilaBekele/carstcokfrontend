/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { InventoryDashboardApi } from '@/service/invarelDash';
import { AlertTriangle, AlertCircle, TrendingUp, Clock, Package, ShoppingCart, PackageOpen, Box } from 'lucide-react';

interface InventoryItem {
  totalQuantityPurchased: number;
  id?: string;
  productId?: string;
  productName: string;
  productCode: string;
  quantity?: number | string;
  totalQuantity?: number | string;
  currentStock?: number | string;
  totalValue?: number | string;
  inventoryValue?: number | string;
  category?: string;
  categoryName?: string;
  brand?: string;
  brandName?: string;
  warningQuantity?: number | string;
  sellPrice?: number | string;
  unitPrice?: number | string;
  avgPrice?: number | string;
  avgCost?: number | string;
  totalRevenue?: number | string;
  totalCost?: number | string;
  numberOfSales?: number;
  numberOfPurchases?: number;
  alertType?: 'LOW_STOCK' | 'OUT_OF_STOCK';
  stockPercentage?: number;
  daysInInventory?: number;
  hasBox?: boolean;
  boxSize?: number | null;
  UnitOfMeasure?: string | null;
  totalQuantitySold?: number | string;
}

interface InventoryData {
  alerts: {
    lowStockItems: InventoryItem[];
  };
  tables: {
    topItems: InventoryItem[];
    topSoldItems: InventoryItem[];
    topPurchasedItems: InventoryItem[];
    agingReport: InventoryItem[];
  };
  lastUpdated: string;
}

export function TableDashboard() {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await InventoryDashboardApi.getDashboard();
        setInventoryData(data);
      } catch {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!inventoryData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">No inventory data found.</p>
        </div>
      </div>
    );
  }

  const { alerts, tables } = inventoryData;

  // Helper function to format quantity display with box support
  const formatQuantity = (item: InventoryItem, quantity: number) => {
    if (item.hasBox && item.boxSize && item.boxSize > 0) {
      const boxes = Math.floor(quantity / item.boxSize);
      const pieces = quantity % item.boxSize;
      if (boxes > 0 && pieces > 0) {
        return `${boxes} box(es) + ${pieces} pcs`;
      } else if (boxes > 0) {
        return `${boxes} box(es)`;
      }
    }
    return `${quantity} ${item.UnitOfMeasure || 'units'}`;
  };

  // Helper function to get stock alert colors
  const getStockAlertColors = (item: InventoryItem) => {
    const currentStock = Number(item.currentStock || 0);
    const warningQuantity = Number(item.warningQuantity || 0);
    
    if (currentStock === 0) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
        status: 'Out of Stock',
        iconColor: 'text-red-600 dark:text-red-400'
      };
    }

    if (currentStock <= warningQuantity) {
      const percentage = (currentStock / warningQuantity) * 100;
      if (percentage <= 25) {
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
          badgeBg: 'bg-red-100 dark:bg-red-900/30',
          badgeText: 'text-red-800 dark:text-red-300',
          status: 'Critical',
          iconColor: 'text-red-600 dark:text-red-400'
        };
      } else if (percentage <= 50) {
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
          badgeText: 'text-amber-800 dark:text-amber-300',
          status: 'Low',
          iconColor: 'text-amber-600 dark:text-amber-400'
        };
      } else {
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/20',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400',
          badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          badgeText: 'text-yellow-800 dark:text-yellow-300',
          status: 'Warning',
          iconColor: 'text-yellow-600 dark:text-yellow-400'
        };
      }
    }

    return {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-l-4 border-l-green-500 dark:border-l-green-400',
      badgeBg: 'bg-green-100 dark:bg-green-900/30',
      badgeText: 'text-green-800 dark:text-green-300',
      status: 'Adequate',
      iconColor: 'text-green-600 dark:text-green-400'
    };
  };

  // Helper function to get aging report colors
  const getAgingAlertColors = (daysInInventory: number | undefined) => {
    if (!daysInInventory) {
      return {
        bg: 'bg-muted/30 dark:bg-muted/10',
        text: 'text-foreground',
        border: 'border-l-4 border-l-muted',
        badgeBg: 'bg-gray-100 dark:bg-gray-800',
        badgeText: 'text-gray-800 dark:text-gray-200'
      };
    }

    if (daysInInventory >= 365) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-l-4 border-l-red-500 dark:border-l-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300'
      };
    }

    if (daysInInventory >= 180) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeText: 'text-amber-800 dark:text-amber-300'
      };
    }

    if (daysInInventory >= 90) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        badgeText: 'text-yellow-800 dark:text-yellow-300'
      };
    }

    return {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-l-4 border-l-green-500 dark:border-l-green-400',
      badgeBg: 'bg-green-100 dark:bg-green-900/30',
      badgeText: 'text-green-800 dark:text-green-300'
    };
  };

  return (
    <div className='@container/dashboard space-y-5 pb-4'>
      <div className="flex items-center gap-2 border-b pb-3 mt-1">
        <Package className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Inventory Metrics</h3>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Low Stock</CardTitle>
            <AlertCircle className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tracking-tight'>{alerts.lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Top Value Items</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tracking-tight'>{tables.topItems.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Top Selling</CardTitle>
            <ShoppingCart className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tracking-tight'>{tables.topSoldItems?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Top Purchased</CardTitle>
            <Package className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tracking-tight'>{tables.topPurchasedItems?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-4'>
            <CardTitle className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Aging Items</CardTitle>
            <Clock className='h-4 w-4 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tracking-tight'>{tables.agingReport.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout for Alerts and Top Items */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Left Column: Low Stock Items */}
        <Card className='@container/card h-full border-border/40 shadow-sm overflow-hidden flex flex-col'>
          <CardHeader className='pb-3 pt-4 border-b bg-muted/10'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className='text-base font-semibold'>Low Stock Alerts</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Item</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Stock</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Warning</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.lowStockItems.length > 0 ? (
                    alerts.lowStockItems.map((item, index) => {
                      const colors = getStockAlertColors(item);
                      const currentStock = Number(item.currentStock || 0);
                      const warningQuantity = Number(item.warningQuantity || 0);
                      const stockPercentage = item.stockPercentage || 
                        (warningQuantity > 0 ? (currentStock / warningQuantity) * 100 : 0);

                      return (
                        <TableRow
                          key={`${item.id}-${index}`}
                          className={`hover:bg-muted/50 ${colors.bg} ${colors.border}`}
                        >
                          <TableCell className={`py-2 px-4 text-sm font-medium ${colors.text}`}>
                            <div className="flex items-center gap-2 line-clamp-1">
                              {item.productName}
                            </div>
                            {item.brandName && (
                              <div className="text-[10px] opacity-70 mt-0.5">{item.brandName}</div>
                            )}
                          </TableCell>
                          <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                            <div className="flex items-center gap-1.5">
                              {formatQuantity(item, currentStock)}
                              {currentStock === 0 && (
                                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                            {warningQuantity} {item.UnitOfMeasure || 'u'}
                          </TableCell>
                          <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium leading-none rounded-sm ${colors.badgeBg} ${colors.badgeText}`}>
                                {colors.status}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-lg'>
                        No low stock items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Top Items by Value */}
        <Card className='@container/card border-border/40 shadow-sm overflow-hidden flex flex-col'>
          <CardHeader className='pb-3 pt-4 border-b bg-muted/10'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <CardTitle className='text-base font-semibold'>Top Items by Value</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Item</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Quantity</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.topItems.length > 0 ? (
                    tables.topItems.map((item, index) => {
                      const totalQuantity = Number(item.totalQuantity || 0);
                      const totalValue = Number(item.totalValue || 0);
                      const unitPrice = Number(item.unitPrice || 0);
                      const isTopItem = index < 3;

                      return (
                        <TableRow
                          key={`${item.productCode}-${index}`}
                          className={`hover:bg-muted/50`}
                        >
                          <TableCell className='py-2 px-4 text-sm font-medium'>
                            <div className="flex items-center gap-1.5 line-clamp-1">
                              {item.productName}
                              {isTopItem && (
                                <span className="inline-flex items-center text-[9px] font-bold text-blue-600 bg-blue-100 px-1 rounded-sm uppercase">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            {item.brand && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">{item.brand}</div>
                            )}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm'>
                            {formatQuantity(item, totalQuantity)}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm font-semibold'>
                            {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-lg'>
                        No top items available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sold Items and Top Purchased Items - Side by Side */}
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        {/* Top Sold Items */}
        <Card className='@container/card border-border/40 shadow-sm overflow-hidden flex flex-col'>
          <CardHeader className='pb-3 pt-4 border-b bg-muted/10'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <CardTitle className='text-base font-semibold'>Top Sold Items</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Product</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Quantity Sold</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Revenue</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.topSoldItems?.length > 0 ? (
                    tables.topSoldItems.map((item, index) => {
                      const totalQuantitySold = Number(item.totalQuantitySold || 0);
                      const totalRevenue = Number(item.totalRevenue || 0);
                      const avgPrice = Number(item.avgPrice || 0);
                      const isTopItem = index < 3;

                      return (
                        <TableRow key={`${item.productId}-${index}`} className='hover:bg-muted/50'>
                          <TableCell className='py-2 px-4 text-sm font-medium'>
                            <div className="flex items-center gap-1.5 line-clamp-1">
                              {item.productName}
                              {isTopItem && (
                                <span className="inline-flex items-center text-[9px] font-bold text-green-600 bg-green-100 px-1 rounded-sm uppercase">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            {item.brand && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">{item.brand}</div>
                            )}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm'>
                            {formatQuantity(item, totalQuantitySold)}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm font-semibold text-green-600'>
                            {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm'>
                            {avgPrice.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-lg'>
                        No sold items data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Purchased Items */}
        <Card className='@container/card border-border/40 shadow-sm overflow-hidden flex flex-col'>
          <CardHeader className='pb-3 pt-4 border-b bg-muted/10'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                <CardTitle className='text-base font-semibold'>Top Purchased Items</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Product</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Quantity Purchased</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Total Cost</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wider'>Avg Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.topPurchasedItems?.length > 0 ? (
                    tables.topPurchasedItems.map((item, index) => {
                      const totalQuantityPurchased = Number(item.totalQuantityPurchased || 0);
                      const totalCost = Number(item.totalCost || 0);
                      const avgCost = Number(item.avgCost || 0);
                      const isTopItem = index < 3;

                      return (
                        <TableRow key={`${item.productId}-${index}`} className='hover:bg-muted/50'>
                          <TableCell className='py-2 px-4 text-sm font-medium'>
                            <div className="flex items-center gap-1.5 line-clamp-1">
                              {item.productName}
                              {isTopItem && (
                                <span className="inline-flex items-center text-[9px] font-bold text-purple-600 bg-purple-100 px-1 rounded-sm uppercase">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            {item.brand && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">{item.brand}</div>
                            )}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm'>
                            {formatQuantity(item, totalQuantityPurchased)}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm font-semibold text-purple-600'>
                            {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className='py-2 px-4 text-sm'>
                            {avgCost.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-lg'>
                        No purchased items data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report - Full Width */}
      <Card className='@container/card border-border/40 shadow-sm overflow-hidden flex flex-col'>
        <CardHeader className='pb-3 pt-4 border-b bg-muted/10'>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <CardTitle className='text-base font-semibold'>Aging Report</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Item Name</TableHead>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Brand</TableHead>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Quantity</TableHead>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Days in Inventory</TableHead>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Value</TableHead>
                  <TableHead className='text-xs font-semibold uppercase tracking-wider'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.agingReport.length > 0 ? (
                  tables.agingReport.map((item, index) => {
                    const colors = getAgingAlertColors(item.daysInInventory);
                    const daysInInventory = item.daysInInventory || 0;
                    const quantity = Number(item.quantity || 0);
                    const inventoryValue = Number(item.inventoryValue || 0);

                    return (
                      <TableRow
                        key={`${item.productCode}-${index}`}
                        className={`hover:bg-muted/50 ${colors.bg} ${colors.border}`}
                      >
                        <TableCell className={`py-2 px-4 text-sm font-medium ${colors.text}`}>
                          <div className="line-clamp-1">
                            {item.productName}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                          {item.brandName || '-'}
                        </TableCell>
                        <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                          {formatQuantity(item, quantity)}
                        </TableCell>
                        <TableCell className={`py-2 px-4 text-sm font-medium ${colors.text}`}>
                          <div className="flex items-center gap-1.5">
                            {daysInInventory} d
                            {daysInInventory >= 365 && (
                              <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                            )}
                            {daysInInventory >= 180 && daysInInventory < 365 && (
                              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                          {inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`py-2 px-4 text-sm ${colors.text}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium leading-none rounded-sm ${colors.badgeBg} ${colors.badgeText}`}>
                              {daysInInventory >= 365 ? '>1 year' :
                               daysInInventory >= 180 ? '6-12 months' :
                               daysInInventory >= 90 ? '3-6 months' :
                               daysInInventory >= 30 ? '1-3 months' : '<1 month'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className='py-8 text-center text-lg'>
                      No aging report data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}