/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Package,
  Info,
  FileText,
  Box,
  Layers,
  MapPin,
  Hash,
  DollarSign,
  AlertTriangle,
  Store,
  ShoppingBag,
  Calendar,
  User,
  Tag,
  Filter,
  Download
} from 'lucide-react';
import { deleteStockLedgerByIds } from '@/service/MissingStockLedger'; // Adjust the path as needed
import { Trash2 } from 'lucide-react'; // Add this to your lucide-react imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductdetailaById } from '@/service/Product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { exportStockLedgerToExcel, StockLedgerExportData } from '@/lib/exportExcel';
import { Button } from '@/components/ui/button';

interface ProductDetails {
  product: {
    id: string;
    productCode: string;
    name: string;
    generic: string | null;
    description: string | null;
    sellPrice: number;
    imageUrl: string | null;
    category: {
      id: string;
      name: string;
    } | null;
    subCategory: {
      id: string;
      name: string;
    } | null;
    unitOfMeasure: {
      id: string;
      name: string;
      symbol: string;
    } | null;
    additionalPrices: Array<{
      id: string;
      label: string;
      price: number;
      shopId: string | null;
      shopName: string | undefined;
      branchId: string | undefined;
      branchName: string | undefined;
    }>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  batches: Array<{
    id: string;
    batchNumber: string;
    expiryDate: string | null;
    price: number;
    stock: number;
    warningQuantity: number;
    storeId: string | null;
    store: {
      id: string;
      name: string;
      branch: {
        id: string;
        name: string;
      };
    } | null;
    shopStocks: Array<{
      id: string;
      shopId: string;
      shopName: string | undefined;
      branchId: string | undefined;
      branchName: string | undefined;
      quantity: number;
      status: string;
      unitOfMeasure: {
        id: string;
        name: string;
        symbol: string;
      } | null;
    }>;
    storeStocks: Array<{
      id: string;
      storeId: string;
      storeName: string | undefined;
      branchId: string | undefined;
      branchName: string | undefined;
      quantity: number;
      status: string;
      unitOfMeasure: {
        id: string;
        name: string;
        symbol: string;
      } | null;
    }>;
    batchStoreQuantity: number;
    batchShopQuantity: number;
    batchTotalQuantity: number;
    createdAt: string;
    updatedAt: string;
  }>;
  stockLedgers: Array<{
    id: string;
    invoiceNo: string | null;
    movementType: string;
    quantity: number;
    unitOfMeasure: {
      id: string;
      name: string;
      symbol: string;
    } | null;
    reference: string | null;
    userId: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
    store: {
      id: string;
      name: string;
      branch: {
        id: string;
        name: string;
      };
    } | null;
    shop: {
      id: string;
      name: string;
      branch: {
        id: string;
        name: string;
      };
    } | null;
    batch: {
      id: string;
      batchNumber: string;
    } | null;
    notes: string | null;
    movementDate: string;
    createdAt: string;
    updatedAt: string;
  }>;
  locationStocks: Array<{
    storeId?: string;
    shopId?: string;
    storeName?: string;
    shopName?: string;
    branchId: string | undefined;
    branchName: string | undefined;
    quantity: number;
    type: 'store' | 'shop';
    additionalPrice?: {
      id: string;
      label: string | null;
      price: number;
      shopId: string | null;
      shopName: string | undefined;
      branchId: string | undefined;
      branchName: string | undefined;
    } | null;
  }>;
  summary: {
    totalStoreQuantity: number;
    totalShopQuantity: number;
    overallTotalQuantity: number;
    batchCount: number;
    storeCount: number;
    shopCount: number;
    ledgerCount: number;
    additionalPriceCount: number;
  };
}

type ProductDetailsProps = {
  productId?: string;
};

const ProductDetailsPage: React.FC<ProductDetailsProps> = ({ productId }) => {
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP pp');
    } catch {
      return dateString;
    }
  };

  // Helper function to format currency
  const formatCurrency = (value: any) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0.00';
    }
    return numValue.toFixed(2);
  };

  // FIX 1: Separate the fetch logic from state updates
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (productId) {
          setLoading(true);
          const details = await getProductdetailaById(productId);

          if (details && details.product && details.summary) {
            setProductDetails(details);
          } else {
            toast.error('Received incomplete product data');
          }
        }
      } catch  {
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]); // Only depend on productId

  // Utility functions for expiration checking
  const isWithinSixMonths = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    return expiry <= sixMonthsFromNow && expiry >= today;
  };

  const isWithinOneYear = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    return expiry <= oneYearFromNow && expiry > sixMonthsFromNow;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // FIX 2: Remove useMemo dependency issues by simplifying the logic
  // Get unique branches from stock ledgers
  const branches = useMemo(() => {
    const stockLedgers = productDetails?.stockLedgers;
    if (!stockLedgers) return [];

    const branchSet = new Set<string>();
    const branchMap = new Map<string, string>();

    stockLedgers.forEach((ledger) => {
      if (ledger.store?.branch?.id) {
        branchSet.add(ledger.store.branch.id);
        branchMap.set(ledger.store.branch.id, ledger.store.branch.name);
      }
      if (ledger.shop?.branch?.id) {
        branchSet.add(ledger.shop.branch.id);
        branchMap.set(ledger.shop.branch.id, ledger.shop.branch.name);
      }
    });

    return Array.from(branchSet).map((branchId) => ({
      id: branchId,
      name: branchMap.get(branchId) || 'Unknown Branch'
    }));
  }, [productDetails]); // Simplified dependency

  // Filter stock ledgers by branch
  const filteredStockLedgers = useMemo(() => {
    const stockLedgers = productDetails?.stockLedgers;
    if (!stockLedgers) return [];

    if (selectedBranch === 'all') {
      return stockLedgers;
    }

    return stockLedgers.filter((ledger) => {
      return (
        ledger.store?.branch?.id === selectedBranch ||
        ledger.shop?.branch?.id === selectedBranch
      );
    });
  }, [productDetails, selectedBranch]); // More specific dependencies

  if (loading) {
    return (
      <div className='container mx-auto space-y-6 p-4 md:p-8'>
        <Skeleton className='h-12 w-1/3' />
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
        </div>
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
        <Skeleton className='h-64' />
      </div>
    );
  }

 const handleExportExcel = () => {
  try {
    if (!productDetails || filteredStockLedgers.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Sort ledgers for export
    const sortedLedgers = [...filteredStockLedgers].sort(
      (a, b) =>
        new Date(a.movementDate).getTime() -
        new Date(b.movementDate).getTime()
    );

    let runningBalance = 0;

    // Prepare data for export
    const exportData: StockLedgerExportData[] = sortedLedgers.map(
      (ledger) => {
        if (ledger.movementType.includes('IN')) {
          runningBalance += Math.abs(ledger.quantity);
        } else if (ledger.movementType.includes('OUT')) {
          runningBalance -= Math.abs(ledger.quantity);
        }

        return {
          Date: formatDateTime(ledger.movementDate),
          Type: ledger.movementType,
          Batch: ledger.batch?.batchNumber || 'N/A',
          Location: ledger.store
            ? `Store: ${ledger.store.name}`
            : ledger.shop
              ? `Shop: ${ledger.shop.name}`
              : 'N/A',
          Branch:
            ledger.store?.branch?.name || ledger.shop?.branch?.name || 'N/A',
          In: ledger.movementType.includes('IN')
            ? `${ledger.quantity} ${ledger.unitOfMeasure?.symbol || unitSymbol}`
            : '-',
          Out: ledger.movementType.includes('OUT')
            ? `${Math.abs(ledger.quantity)} ${ledger.unitOfMeasure?.symbol || unitSymbol}`
            : '-',
          Balance: `${runningBalance} ${ledger.unitOfMeasure?.symbol || unitSymbol}`,
          'Reference/Invoice': ledger.invoiceNo || ledger.reference || 'N/A',
          User: ledger.user?.name || 'System',
          Notes: ledger.notes || 'N/A'
        };
      }
    );

    // Calculate final balance
    const finalBalance = filteredStockLedgers.reduce((balance, ledger) => {
      if (ledger.movementType.includes('IN')) {
        return balance + Math.abs(ledger.quantity);
      } else if (ledger.movementType.includes('OUT')) {
        return balance - Math.abs(ledger.quantity);
      }
      return balance;
    }, 0);

    const finalBalanceText = `${finalBalance} ${unitSymbol}`;
    const filename = `${product.productCode}_${product.name.replace(/\s+/g, '_')}_Stock_Ledger`;

    // Prepare options for export
    const exportOptions = {
      productName: product.name,
      productCode: product.productCode,
      unitSymbol: unitSymbol,
      selectedBranch: selectedBranch,
      finalBalance: finalBalanceText
    };

    // Export to Excel
    exportStockLedgerToExcel(exportData, exportOptions, filename);

    toast.success('Excel file downloaded successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export Excel file');
  }
};

  if (!productDetails || !productDetails.product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Product not found</p>
      </div>
    );
  }
const handleDeleteStockLedger = async (ledgerId: string) => {
  if (confirm('Are you sure you want to delete this stock ledger entry?')) {
    try {
      await deleteStockLedgerByIds(ledgerId);
      toast.success('Stock ledger entry deleted successfully');
      
      // Refresh the product details
      if (productId) {
        const updatedDetails = await getProductdetailaById(productId);
        setProductDetails(updatedDetails);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete stock ledger entry');
    }
  }
};
  const { product, batches, locationStocks, summary } = productDetails;
  const unitSymbol = product.unitOfMeasure?.symbol || 'unit';

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header with actions */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold'>
            <Package className='text-primary' />
            {product.name}
          </h1>
          <div className='mt-2 flex items-center gap-2'>
            <Badge variant='outline' className='flex items-center gap-1'>
              <Hash className='h-3 w-3' />
              {product.productCode}
            </Badge>
            {product.category && (
              <Badge variant='secondary'>{product.category.name}</Badge>
            )}
            {product.subCategory && (
              <Badge variant='outline'>{product.subCategory.name}</Badge>
            )}
            {!product.isActive && <Badge variant='destructive'>Inactive</Badge>}
            {summary.overallTotalQuantity === 0 && (
              <Badge variant='destructive' className='flex items-center gap-1'>
                <AlertTriangle className='h-3 w-3' />
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Quantity
            </CardTitle>
            <Box className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.overallTotalQuantity} {unitSymbol}
            </div>
            <p className='text-muted-foreground text-xs'>
              {summary.totalStoreQuantity} in stores +{' '}
              {summary.totalShopQuantity} in shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Batches</CardTitle>
            <Layers className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.batchCount}</div>
            <p className='text-muted-foreground text-xs'>Active batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Branches</CardTitle>
            <MapPin className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(() => {
                // Calculate unique branches from locationStocks
                if (!locationStocks || locationStocks.length === 0) return 0;

                const uniqueBranches = new Set(
                  locationStocks
                    .map((loc) => loc.branchId)
                    .filter((id): id is string => !!id)
                );
                return uniqueBranches.size;
              })()}
            </div>

            {/* Additional branch details on hover/click (optional) */}
            <div className='text-muted-foreground mt-2 text-xs'>
              {(() => {
                if (!locationStocks || locationStocks.length === 0) return null;

                // Get unique branch names
                const branchMap = new Map<string, string>();
                locationStocks.forEach((loc) => {
                  if (loc.branchId && loc.branchName) {
                    branchMap.set(loc.branchId, loc.branchName);
                  }
                });

                if (branchMap.size === 0) return null;

                const branches = Array.from(branchMap.values()).sort();

                if (branches.length <= 3) {
                  return <span>Branches: {branches.join(', ')}</span>;
                } else {
                  return <span>{branches.length} active branches</span>;
                }
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Additional Prices
            </CardTitle>
            <Tag className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.additionalPriceCount}
            </div>
            <p className='text-muted-foreground text-xs'>Custom prices</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Info className='text-primary h-5 w-5' />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='font-medium'>Product Name</p>
                <p className='text-muted-foreground'>{product.name}</p>
              </div>
              <div>
                <p className='font-medium'>Product Code</p>
                <p className='text-muted-foreground'>{product.productCode}</p>
              </div>
              <div>
                <p className='font-medium'>Generic Name</p>
                <p className='text-muted-foreground'>
                  {product.generic || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Status</p>
                <Badge variant={product.isActive ? 'default' : 'destructive'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className='font-medium'>Category</p>
                <p className='text-muted-foreground'>
                  {product.category?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Sub Category</p>
                <p className='text-muted-foreground'>
                  {product.subCategory?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='font-medium'>Sell Price</p>
                <p className='text-muted-foreground flex items-center gap-1'>
                  <DollarSign className='h-4 w-4' />
                  {formatCurrency(product.sellPrice)}
                </p>
              </div>
              <div>
                <p className='font-medium'>Unit of Measure</p>
                <p className='text-muted-foreground'>
                  {product.unitOfMeasure?.name} (
                  {product.unitOfMeasure?.symbol || 'N/A'})
                </p>
              </div>
              {product.description && (
                <div className='col-span-2'>
                  <p className='font-medium'>Description</p>
                  <p className='text-muted-foreground'>{product.description}</p>
                </div>
              )}
            </div>

            {/* Additional Prices Section */}
            {product.additionalPrices &&
              product.additionalPrices.length > 0 && (
                <div className='border-t pt-4'>
                  <p className='mb-3 flex items-center gap-2 font-medium'>
                    <Tag className='h-4 w-4' />
                    Additional Prices
                  </p>
                  <div className='space-y-2'>
                    {product.additionalPrices.map((price) => (
                      <div
                        key={price.id}
                        className='bg-muted/50 flex items-center justify-between rounded-lg border p-3'
                      >
                        <div>
                          <p className='font-medium'>{price.label}</p>
                          <p className='text-muted-foreground text-sm'>
                            {price.shopName || 'All Shops'} •{' '}
                            {price.branchName || 'All Branches'}
                          </p>
                        </div>
                        <p className='text-lg font-bold'>
                          ${formatCurrency(price.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className='border-t pt-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='font-medium'>Created At</p>
                  <p className='text-muted-foreground'>
                    {formatDateTime(product.createdAt)}
                  </p>
                </div>
                <div>
                  <p className='font-medium'>Updated At</p>
                  <p className='text-muted-foreground'>
                    {formatDateTime(product.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Stock Summary */}
        {/* Location Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='text-primary h-5 w-5' />
              Location Stock Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationStocks && locationStocks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className='text-right'>
                      Quantity ({unitSymbol})
                    </TableHead>
                    <TableHead className='text-right'>
                      Additional Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationStocks.map((location, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {location.type === 'store' ? (
                          <div className='flex items-center gap-2'>
                            <Store className='h-4 w-4' />
                            {location.storeName || 'Unknown Store'}
                          </div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <ShoppingBag className='h-4 w-4' />
                            {location.shopName || 'Unknown Shop'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            location.type === 'store' ? 'default' : 'secondary'
                          }
                        >
                          {location.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{location.branchName || ''}</TableCell>
                      <TableCell className='text-right'>
                        {location.quantity}
                      </TableCell>
                      <TableCell className='text-right'>
                        {location.additionalPrice ? (
                          <div className='flex flex-col items-end'>
                            <span className='font-medium text-green-600'>
                              ${formatCurrency(location.additionalPrice.price)}
                            </span>
                            {location.additionalPrice.label && (
                              <span className='text-muted-foreground text-xs'>
                                {location.additionalPrice.label}
                              </span>
                            )}
                            {!location.additionalPrice.shopId && (
                              <span className='text-muted-foreground text-xs'>
                                Global Price
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'></span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-medium'>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className='text-right'>
                      {summary.overallTotalQuantity} {unitSymbol}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className='text-muted-foreground'>No stock in locations</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batches */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Layers className='text-primary h-5 w-5' />
            Batches ({batches?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches && batches.length > 0 ? (
            <div className='space-y-4'>
              {batches.map((batch) => {
                if (!batch.expiryDate) {
                  // Handle batches without expiry dates
                  return (
                    <Card key={batch.id} className='border-gray-200 p-4'>
                      <div className='mb-4 flex items-start justify-between'>
                        <div>
                          <h4 className='flex items-center gap-2 font-medium'>
                            Batch: {batch.batchNumber}
                            <Badge variant='outline'>
                              {batch.batchTotalQuantity} {unitSymbol}
                            </Badge>
                          </h4>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            No expiry date
                          </p>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            Price: ${formatCurrency(batch.price)} | Store:{' '}
                            {batch.store?.name || 'N/A'} | Warning Qty:{' '}
                            {batch.warningQuantity}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium'>
                            {batch.batchTotalQuantity} {unitSymbol}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {(() => {
                              // Calculate branch distribution for this batch
                              const branchStats = new Map<
                                string,
                                {
                                  storeQty: number;
                                  shopQty: number;
                                  branchName: string;
                                }
                              >();

                              // Process store stocks by branch
                              batch.storeStocks?.forEach((stock) => {
                                const branchId = stock.branchId || 'unknown';
                                const branchName =
                                  stock.branchName || 'Unknown Branch';

                                if (!branchStats.has(branchId)) {
                                  branchStats.set(branchId, {
                                    storeQty: 0,
                                    shopQty: 0,
                                    branchName
                                  });
                                }

                                const stats = branchStats.get(branchId)!;
                                stats.storeQty += stock.quantity || 0;
                              });

                              // Process shop stocks by branch
                              batch.shopStocks?.forEach((stock) => {
                                const branchId = stock.branchId || 'unknown';
                                const branchName =
                                  stock.branchName || 'Unknown Branch';

                                if (!branchStats.has(branchId)) {
                                  branchStats.set(branchId, {
                                    storeQty: 0,
                                    shopQty: 0,
                                    branchName
                                  });
                                }

                                const stats = branchStats.get(branchId)!;
                                stats.shopQty += stock.quantity || 0;
                              });

                              // Create summary string
                              const summaries = Array.from(
                                branchStats.values()
                              ).map((stats) => {
                                const total = stats.storeQty + stats.shopQty;
                                let details = '';

                                if (stats.storeQty > 0 && stats.shopQty > 0) {
                                  details = `${stats.storeQty} stores + ${stats.shopQty} shops`;
                                } else if (stats.storeQty > 0) {
                                  details = `${stats.storeQty} in stores`;
                                } else if (stats.shopQty > 0) {
                                  details = `${stats.shopQty} in shops`;
                                }

                                return `${stats.branchName}: ${total} (${details})`;
                              });

                              return summaries.length > 0
                                ? summaries.join('; ')
                                : 'No branch distribution';
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Store Stocks by Branch */}
                      {batch.storeStocks && batch.storeStocks.length > 0 && (
                        <div className='mt-4'>
                          <p className='mb-2 flex items-center gap-2 text-sm font-medium'>
                            <Store className='h-4 w-4' />
                            Store Stocks by Branch:
                          </p>
                          {(() => {
                            // Group store stocks by branch
                            const storeByBranch = new Map<
                              string,
                              {
                                branchName: string;
                                stocks: typeof batch.storeStocks;
                              }
                            >();

                            batch.storeStocks.forEach((stock) => {
                              const branchId = stock.branchId || 'unknown';
                              const branchName =
                                stock.branchName || 'Unknown Branch';

                              if (!storeByBranch.has(branchId)) {
                                storeByBranch.set(branchId, {
                                  branchName,
                                  stocks: []
                                });
                              }

                              storeByBranch.get(branchId)!.stocks.push(stock);
                            });

                            return (
                              <div className='space-y-3'>
                                {Array.from(storeByBranch.entries()).map(
                                  ([branchId, branchData]) => {
                                    const branchTotal =
                                      branchData.stocks.reduce(
                                        (sum, stock) =>
                                          sum + (stock.quantity || 0),
                                        0
                                      );

                                    return (
                                      <div
                                        key={branchId}
                                        className='rounded border p-3'
                                      >
                                        <div className='mb-2 flex items-center justify-between'>
                                          <div className='flex items-center gap-2'>
                                            <MapPin className='h-3 w-3 text-green-500' />
                                            <span className='font-medium'>
                                              {branchData.branchName}
                                            </span>
                                          </div>
                                          <Badge variant='outline'>
                                            {branchTotal} {unitSymbol}
                                          </Badge>
                                        </div>
                                        <div className='grid grid-cols-1 gap-2'>
                                          {branchData.stocks.map((stock) => (
                                            <div
                                              key={stock.id}
                                              className='flex justify-between rounded bg-green-50 p-2 text-sm dark:bg-green-950/20'
                                            >
                                              <span>{stock.storeName}</span>
                                              <span className='font-medium'>
                                                {stock.quantity}{' '}
                                                {stock.unitOfMeasure?.symbol ||
                                                  unitSymbol}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Shop Stocks by Branch */}
                      {batch.shopStocks && batch.shopStocks.length > 0 && (
                        <div className='mt-4'>
                          <p className='mb-2 flex items-center gap-2 text-sm font-medium'>
                            <ShoppingBag className='h-4 w-4' />
                            Shop Stocks by Branch:
                          </p>
                          {(() => {
                            // Group shop stocks by branch
                            const shopByBranch = new Map<
                              string,
                              {
                                branchName: string;
                                stocks: typeof batch.shopStocks;
                              }
                            >();

                            batch.shopStocks.forEach((stock) => {
                              const branchId = stock.branchId || 'unknown';
                              const branchName =
                                stock.branchName || 'Unknown Branch';

                              if (!shopByBranch.has(branchId)) {
                                shopByBranch.set(branchId, {
                                  branchName,
                                  stocks: []
                                });
                              }

                              shopByBranch.get(branchId)!.stocks.push(stock);
                            });

                            return (
                              <div className='space-y-3'>
                                {Array.from(shopByBranch.entries()).map(
                                  ([branchId, branchData]) => {
                                    const branchTotal =
                                      branchData.stocks.reduce(
                                        (sum, stock) =>
                                          sum + (stock.quantity || 0),
                                        0
                                      );

                                    return (
                                      <div
                                        key={branchId}
                                        className='rounded border p-3'
                                      >
                                        <div className='mb-2 flex items-center justify-between'>
                                          <div className='flex items-center gap-2'>
                                            <MapPin className='h-3 w-3 text-blue-500' />
                                            <span className='font-medium'>
                                              {branchData.branchName}
                                            </span>
                                          </div>
                                          <Badge variant='outline'>
                                            {branchTotal} {unitSymbol}
                                          </Badge>
                                        </div>
                                        <div className='grid grid-cols-1 gap-2'>
                                          {branchData.stocks.map((stock) => (
                                            <div
                                              key={stock.id}
                                              className='flex justify-between rounded bg-blue-50 p-2 text-sm dark:bg-blue-950/20'
                                            >
                                              <span>{stock.shopName}</span>
                                              <span className='font-medium'>
                                                {stock.quantity}{' '}
                                                {stock.unitOfMeasure?.symbol ||
                                                  unitSymbol}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </Card>
                  );
                }

                const expired = isExpired(batch.expiryDate);
                const expiringIn6Months = isWithinSixMonths(batch.expiryDate);
                const expiringIn1Year = isWithinOneYear(batch.expiryDate);

                // Determine styling based on expiration status
                let cardStyle = '';
                let badgeStyle = '';
                let textStyle = '';
                let bgStyle = '';

                if (expired) {
                  cardStyle = 'border-red-500 bg-red-50 border-2';
                  badgeStyle = 'border-red-500 text-red-700 bg-red-100';
                  textStyle = 'text-red-700';
                  bgStyle = 'bg-red-100';
                } else if (expiringIn6Months) {
                  cardStyle = 'border-red-300 bg-red-50';
                  badgeStyle = 'border-red-300 text-red-700 bg-red-100';
                  textStyle = 'text-red-600';
                  bgStyle = 'bg-red-50';
                } else if (expiringIn1Year) {
                  cardStyle = 'border-yellow-300 bg-yellow-50';
                  badgeStyle =
                    'border-yellow-300 text-yellow-700 bg-yellow-100';
                  textStyle = 'text-yellow-600';
                  bgStyle = 'bg-yellow-50';
                }

                return (
                  <Card key={batch.id} className={`p-4 ${cardStyle}`}>
                    <div className='mb-4 flex items-start justify-between'>
                      <div>
                        <h4 className='flex items-center gap-2 font-medium'>
                          Batch: {batch.batchNumber}
                          <Badge variant='outline' className={badgeStyle}>
                            {batch.batchTotalQuantity} {unitSymbol}
                          </Badge>
                        </h4>
                        <p
                          className={`mt-1 flex items-center gap-1 text-sm ${textStyle}`}
                        >
                          <Calendar className='h-3 w-3' />
                          Expiry: {formatDate(batch.expiryDate)}
                          {expired && (
                            <Badge
                              variant='destructive'
                              className='ml-1 text-xs'
                            >
                              EXPIRED
                            </Badge>
                          )}
                          {expiringIn6Months && !expired && (
                            <Badge className='ml-1 bg-red-100 text-xs text-red-700 hover:bg-red-100'>
                              Expiring Soon!
                            </Badge>
                          )}
                          {expiringIn1Year &&
                            !expiringIn6Months &&
                            !expired && (
                              <Badge className='ml-1 bg-yellow-100 text-xs text-yellow-700 hover:bg-yellow-100'>
                                Expiring in 1 Year
                              </Badge>
                            )}
                        </p>
                        <p className={`mt-1 text-sm ${textStyle}`}>
                          Price: ${formatCurrency(batch.price)} | Store:{' '}
                          {batch.store?.name || 'N/A'} | Warning Qty:{' '}
                          {batch.warningQuantity}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className={`font-medium ${textStyle}`}>
                          {batch.batchTotalQuantity} {unitSymbol}
                        </p>
                        <p className={`text-sm ${textStyle}`}>
                          {(() => {
                            // Calculate branch distribution for this batch
                            const branchStats = new Map<
                              string,
                              {
                                storeQty: number;
                                shopQty: number;
                                branchName: string;
                              }
                            >();

                            // Process store stocks by branch
                            batch.storeStocks?.forEach((stock) => {
                              const branchId = stock.branchId || 'unknown';
                              const branchName =
                                stock.branchName || 'Unknown Branch';

                              if (!branchStats.has(branchId)) {
                                branchStats.set(branchId, {
                                  storeQty: 0,
                                  shopQty: 0,
                                  branchName
                                });
                              }

                              const stats = branchStats.get(branchId)!;
                              stats.storeQty += stock.quantity || 0;
                            });

                            // Process shop stocks by branch
                            batch.shopStocks?.forEach((stock) => {
                              const branchId = stock.branchId || 'unknown';
                              const branchName =
                                stock.branchName || 'Unknown Branch';

                              if (!branchStats.has(branchId)) {
                                branchStats.set(branchId, {
                                  storeQty: 0,
                                  shopQty: 0,
                                  branchName
                                });
                              }

                              const stats = branchStats.get(branchId)!;
                              stats.shopQty += stock.quantity || 0;
                            });

                            // Create summary string
                            const summaries = Array.from(
                              branchStats.values()
                            ).map((stats) => {
                              const total = stats.storeQty + stats.shopQty;
                              let details = '';

                              if (stats.storeQty > 0 && stats.shopQty > 0) {
                                details = `${stats.storeQty} stores + ${stats.shopQty} shops`;
                              } else if (stats.storeQty > 0) {
                                details = `${stats.storeQty} in stores`;
                              } else if (stats.shopQty > 0) {
                                details = `${stats.shopQty} in shops`;
                              }

                              return `${stats.branchName}: ${total} (${details})`;
                            });

                            return summaries.length > 0
                              ? summaries.join('; ')
                              : 'No branch distribution';
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Store Stocks by Branch */}
                    {batch.storeStocks && batch.storeStocks.length > 0 && (
                      <div className='mt-4'>
                        <p
                          className={`mb-2 flex items-center gap-2 text-sm font-medium ${textStyle}`}
                        >
                          <Store className='h-4 w-4' />
                          Store Stocks by Branch:
                        </p>
                        {(() => {
                          // Group store stocks by branch
                          const storeByBranch = new Map<
                            string,
                            {
                              branchName: string;
                              stocks: typeof batch.storeStocks;
                            }
                          >();

                          batch.storeStocks.forEach((stock) => {
                            const branchId = stock.branchId || 'unknown';
                            const branchName =
                              stock.branchName || 'Unknown Branch';

                            if (!storeByBranch.has(branchId)) {
                              storeByBranch.set(branchId, {
                                branchName,
                                stocks: []
                              });
                            }

                            storeByBranch.get(branchId)!.stocks.push(stock);
                          });

                          return (
                            <div className='space-y-3'>
                              {Array.from(storeByBranch.entries()).map(
                                ([branchId, branchData]) => {
                                  const branchTotal = branchData.stocks.reduce(
                                    (sum, stock) => sum + (stock.quantity || 0),
                                    0
                                  );

                                  return (
                                    <div
                                      key={branchId}
                                      className={`rounded border p-3 ${bgStyle}`}
                                    >
                                      <div className='mb-2 flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                          <MapPin className='h-3 w-3 text-green-500' />
                                          <span
                                            className={`font-medium ${textStyle}`}
                                          >
                                            {branchData.branchName}
                                          </span>
                                        </div>
                                        <Badge
                                          variant='outline'
                                          className={badgeStyle}
                                        >
                                          {branchTotal} {unitSymbol}
                                        </Badge>
                                      </div>
                                      <div className='grid grid-cols-1 gap-2'>
                                        {branchData.stocks.map((stock) => (
                                          <div
                                            key={stock.id}
                                            className={`flex justify-between rounded p-2 text-sm ${bgStyle}`}
                                          >
                                            <span className={textStyle}>
                                              {stock.storeName}
                                            </span>
                                            <span
                                              className={`${textStyle} font-medium`}
                                            >
                                              {stock.quantity}{' '}
                                              {stock.unitOfMeasure?.symbol ||
                                                unitSymbol}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Shop Stocks by Branch */}
                    {batch.shopStocks && batch.shopStocks.length > 0 && (
                      <div className='mt-4'>
                        <p
                          className={`mb-2 flex items-center gap-2 text-sm font-medium ${textStyle}`}
                        >
                          <ShoppingBag className='h-4 w-4' />
                          Shop Stocks by Branch:
                        </p>
                        {(() => {
                          // Group shop stocks by branch
                          const shopByBranch = new Map<
                            string,
                            {
                              branchName: string;
                              stocks: typeof batch.shopStocks;
                            }
                          >();

                          batch.shopStocks.forEach((stock) => {
                            const branchId = stock.branchId || 'unknown';
                            const branchName =
                              stock.branchName || 'Unknown Branch';

                            if (!shopByBranch.has(branchId)) {
                              shopByBranch.set(branchId, {
                                branchName,
                                stocks: []
                              });
                            }

                            shopByBranch.get(branchId)!.stocks.push(stock);
                          });

                          return (
                            <div className='space-y-3'>
                              {Array.from(shopByBranch.entries()).map(
                                ([branchId, branchData]) => {
                                  const branchTotal = branchData.stocks.reduce(
                                    (sum, stock) => sum + (stock.quantity || 0),
                                    0
                                  );

                                  return (
                                    <div
                                      key={branchId}
                                      className={`rounded border p-3 ${bgStyle}`}
                                    >
                                      <div className='mb-2 flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                          <MapPin className='h-3 w-3 text-blue-500' />
                                          <span
                                            className={`font-medium ${textStyle}`}
                                          >
                                            {branchData.branchName}
                                          </span>
                                        </div>
                                        <Badge
                                          variant='outline'
                                          className={badgeStyle}
                                        >
                                          {branchTotal} {unitSymbol}
                                        </Badge>
                                      </div>
                                      <div className='grid grid-cols-1 gap-2'>
                                        {branchData.stocks.map((stock) => (
                                          <div
                                            key={stock.id}
                                            className={`flex justify-between rounded p-2 text-sm ${bgStyle}`}
                                          >
                                            <span className={textStyle}>
                                              {stock.shopName}
                                            </span>
                                            <span
                                              className={`${textStyle} font-medium`}
                                            >
                                              {stock.quantity}{' '}
                                              {stock.unitOfMeasure?.symbol ||
                                                unitSymbol}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className='text-muted-foreground'>No batches available</p>
          )}
        </CardContent>
      </Card>

      {/* Stock Ledger with Branch Filter */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='text-primary h-5 w-5' />
              Stock Ledger ({filteredStockLedgers.length})
            </CardTitle>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportExcel}
                  disabled={filteredStockLedgers.length === 0}
                  className='gap-2'
                >
                  <Download className='h-4 w-4' />
                  Export Excel
                </Button>
              </div>
              <Filter className='text-muted-foreground h-4 w-4' />
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className='w-45'>
                  <SelectValue placeholder='Filter by branch' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStockLedgers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Reference/Invoice</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                      {/* <TableHead>Actions</TableHead> Add this line */}

                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Sort stock ledgers by date (oldest first) for proper balance calculation
                  const sortedLedgers = [...filteredStockLedgers].sort(
                    (a, b) =>
                      new Date(a.movementDate).getTime() -
                      new Date(b.movementDate).getTime()
                  );

                  let runningBalance = 0;

                  return sortedLedgers.map((ledger) => {
                    // Calculate running balance based only on movement type
                    if (ledger.movementType.includes('IN')) {
                      runningBalance += Math.abs(ledger.quantity);
                    } else if (ledger.movementType.includes('OUT')) {
                      runningBalance -= Math.abs(ledger.quantity);
                    }

                    // Check if it's a sell invoice (starts with "Sell-")
                    const isSellInvoice = ledger.invoiceNo?.startsWith('Sell-');
                    // Also check if reference might be a sell invoice
                    const isSellReference =
                      ledger.reference?.startsWith('Sell-');

                    return (
                      <TableRow key={ledger.id}>
                        <TableCell>
                          {formatDateTime(ledger.movementDate)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              ledger.movementType.includes('IN')
                                ? 'default'
                                : ledger.movementType.includes('OUT')
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {ledger.movementType}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {ledger.batch?.batchNumber || 'N/A'}
                        </TableCell>

                        <TableCell>
                          {ledger.store ? (
                            <div className='flex items-center gap-1'>
                              <Store className='h-3 w-3' />
                              {ledger.store.name}
                            </div>
                          ) : ledger.shop ? (
                            <div className='flex items-center gap-1'>
                              <ShoppingBag className='h-3 w-3' />
                              {ledger.shop.name}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>

                        <TableCell>
                          {ledger.store?.branch?.name ||
                            ledger.shop?.branch?.name ||
                            'N/A'}
                        </TableCell>

                        {/* ✅ Show only for IN movements */}
                        <TableCell className='font-medium text-green-600'>
                          {ledger.movementType.includes('IN')
                            ? `${ledger.quantity} ${
                                ledger.unitOfMeasure?.symbol || unitSymbol
                              }`
                            : '-'}
                        </TableCell>

                        {/* ✅ Show only for OUT movements */}
                        <TableCell className='font-medium text-red-600'>
                          {ledger.movementType.includes('OUT')
                            ? `${Math.abs(ledger.quantity)} ${
                                ledger.unitOfMeasure?.symbol || unitSymbol
                              }`
                            : '-'}
                        </TableCell>

                        <TableCell className='font-bold'>
                          {runningBalance}{' '}
                          {ledger.unitOfMeasure?.symbol || unitSymbol}
                        </TableCell>

                        <TableCell>
                          {/* Check invoiceNo first */}
                          {ledger.invoiceNo ? (
                            isSellInvoice ? (
                              <a
                                href={`/dashboard/Products/view/sell?id=${ledger.invoiceNo.replace(/^Sell-/, '')}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-primary hover:text-primary/80 underline transition-colors'
                                title='View invoice details'
                              >
                                {ledger.invoiceNo}
                              </a>
                            ) : (
                              <span>{ledger.invoiceNo}</span>
                            )
                          ) : /* If no invoiceNo, check reference */
                          ledger.reference ? (
                            isSellReference ? (
                              <a
                                href={`/dashboard/Products/view/sell?id=${ledger.reference.replace(/^Sell-/, '')}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-primary hover:text-primary/80 underline transition-colors'
                                title='View invoice details'
                              >
                                {ledger.reference}
                              </a>
                            ) : (
                              <span>{ledger.reference}</span>
                            )
                          ) : (
                            'N/A'
                          )}
                        </TableCell>

                        <TableCell>
                          {ledger.user ? (
                            <div className='flex items-center gap-1'>
                              <User className='h-3 w-3' />
                              {ledger.user.name}
                            </div>
                          ) : (
                            'System'
                          )}
                        </TableCell>

                        <TableCell
                          className='max-w-50 truncate'
                          title={ledger.notes || ''}
                        >
                          {ledger.notes || 'N/A'}
                        </TableCell>
                         {/* Add delete button cell */}
          {/* <TableCell>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleDeleteStockLedger(ledger.id)}
              className='text-red-600 hover:text-red-700 hover:bg-red-100'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </TableCell> */}
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>

              {/* Footer with final balance */}
              <tfoot>
                <TableRow className='bg-muted/50'>
                  <TableCell colSpan={8} className='text-right font-bold'>
                    Final Balance:
                  </TableCell>
                  <TableCell className='text-lg font-bold'>
                    {(() => {
                      const finalBalance = filteredStockLedgers.reduce(
                        (balance, ledger) => {
                          if (ledger.movementType.includes('IN')) {
                            return balance + Math.abs(ledger.quantity);
                          } else if (ledger.movementType.includes('OUT')) {
                            return balance - Math.abs(ledger.quantity);
                          }
                          return balance;
                        },
                        0
                      );
                      return `${finalBalance} ${unitSymbol}`;
                    })()}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </tfoot>
            </Table>
          ) : (
            <p className='text-muted-foreground'>
              {selectedBranch === 'all'
                ? 'No stock movements recorded'
                : 'No stock movements found for selected branch'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailsPage;
