/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
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
  Download,
  PackageOpen
} from 'lucide-react';
import { deleteStockLedgerByIds } from '@/service/MissingStockLedger';
import { Trash2 } from 'lucide-react';
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
    viscosity?: string;      // 0W-20, 5W-30
  oilType?: string;        // Fully Synthetic, Semi Synthetic
  additiveType?: string; 
    warningQuantity?: number;
    sellPrice: number;
    imageUrl: string | null;
    hasBox: boolean;
    boxSize: number | null;
    UnitOfMeasure: string | null;
    category: {
      id: string;
      name: string;
    } | null;
    brand: {
      id: string;
      name: string;
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
  stockLedgers: Array<{
    id: string;
    invoiceNo: string | null;
    movementType: string;
    pieceQuantity: number;
    boxQuantity: number;
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
    notes: string | null;
    movementDate: string;
    createdAt: string;
    updatedAt: string;
  }>;
  summary: {
    totalStoreQuantity: number;
    totalShopQuantity: number;
    overallTotalQuantity: number;
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
  const [viewInBoxes, setViewInBoxes] = useState(false); // Toggle between Box and Piece view

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

  // Convert pieces to boxes based on product's boxSize
  const piecesToBoxes = (pieces: number): number => {
    if (!productDetails?.product.hasBox || !productDetails?.product.boxSize) {
      return pieces;
    }
    return Math.floor(pieces / productDetails.product.boxSize);
  };

  // Get remaining pieces after converting to boxes
  const getRemainingPieces = (pieces: number): number => {
    if (!productDetails?.product.hasBox || !productDetails?.product.boxSize) {
      return pieces;
    }
    return pieces % productDetails.product.boxSize;
  };

  // Format quantity display based on view mode
  const formatQuantity = (pieces: number, boxQty: number = 0): string => {
    if (viewInBoxes && productDetails?.product.hasBox && productDetails?.product.boxSize) {
      const boxes = piecesToBoxes(pieces);
      const remaining = getRemainingPieces(pieces);
      if (boxes === 0) {
        return `${pieces} pieces`;
      }
      if (remaining === 0) {
        return `${boxes} box(es)`;
      }
      return `${boxes} box(es) + ${remaining} pieces`;
    }
    return `${pieces} ${productDetails?.product.UnitOfMeasure || 'pieces'}`;
  };

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
      } catch {
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

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
  }, [productDetails]);

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
  }, [productDetails, selectedBranch]);

  const handleExportExcel = () => {
    try {
      if (!productDetails || filteredStockLedgers.length === 0) {
        toast.error('No data to export');
        return;
      }

      const { product, stockLedgers: allLedgers } = productDetails;
      const unitSymbol = product.UnitOfMeasure || 'unit';

      const sortedLedgers = [...filteredStockLedgers].sort(
        (a, b) =>
          new Date(a.movementDate).getTime() -
          new Date(b.movementDate).getTime()
      );

      let runningBalance = 0;

      const exportData: StockLedgerExportData[] = sortedLedgers.map(
        (ledger) => {
          const quantity = ledger.pieceQuantity || 0;
          
          if (ledger.movementType.includes('IN')) {
            runningBalance += quantity;
          } else if (ledger.movementType.includes('OUT')) {
            runningBalance -= quantity;
          }

          return {
            Date: formatDateTime(ledger.movementDate),
            Type: ledger.movementType,
            Batch: 'N/A',
            Location: ledger.store
              ? `Store: ${ledger.store.name}`
              : ledger.shop
                ? `Shop: ${ledger.shop.name}`
                : 'N/A',
            Branch:
              ledger.store?.branch?.name || ledger.shop?.branch?.name || 'N/A',
            In: ledger.movementType.includes('IN')
              ? `${quantity} ${unitSymbol}`
              : '-',
            Out: ledger.movementType.includes('OUT')
              ? `${quantity} ${unitSymbol}`
              : '-',
            Balance: `${runningBalance} ${unitSymbol}`,
            'Reference/Invoice': ledger.invoiceNo || ledger.reference || 'N/A',
            User: ledger.user?.name || 'System',
            Notes: ledger.notes || 'N/A'
          };
        }
      );

      const finalBalance = filteredStockLedgers.reduce((balance, ledger) => {
        const quantity = ledger.pieceQuantity || 0;
        if (ledger.movementType.includes('IN')) {
          return balance + quantity;
        } else if (ledger.movementType.includes('OUT')) {
          return balance - quantity;
        }
        return balance;
      }, 0);

      const finalBalanceText = `${finalBalance} ${unitSymbol}`;
      const filename = `${product.productCode}_${product.name.replace(/\s+/g, '_')}_Stock_Ledger`;

      const exportOptions = {
        productName: product.name,
        productCode: product.productCode,
        unitSymbol: unitSymbol,
        selectedBranch: selectedBranch,
        finalBalance: finalBalanceText
      };

      exportStockLedgerToExcel(exportData, exportOptions, filename);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const handleDeleteStockLedger = async (ledgerId: string) => {
    if (confirm('Are you sure you want to delete this stock ledger entry?')) {
      try {
        await deleteStockLedgerByIds(ledgerId);
        toast.success('Stock ledger entry deleted successfully');
        
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

  if (!productDetails || !productDetails.product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Product not found</p>
      </div>
    );
  }

  const { product, locationStocks, summary } = productDetails;
  const unitSymbol = product.UnitOfMeasure || 'unit';
  const canShowBoxes = product.hasBox && product.boxSize && product.boxSize > 0;

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Header with actions */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold'>
            <Package className='text-primary' />
            {product.name}
          </h1>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className='flex items-center gap-1'>
              <Hash className='h-3 w-3' />
              {product.productCode}
            </Badge>
            {product.category && (
              <Badge variant='secondary'>{product.category.name}</Badge>
            )}
            {product.brand && (
              <Badge variant='outline'>{product.brand.name}</Badge>
            )}
            {product.hasBox && (
              <Badge variant='default' className='flex items-center gap-1'>
                <Box className='h-3 w-3' />
                Box: {product.boxSize} pieces/box
              </Badge>
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

        {/* View Toggle Switch */}
        {canShowBoxes && (
          <div className='flex items-center gap-3 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <PackageOpen className='h-4 w-4' />
              <span className='text-sm font-medium'>View as Pieces</span>
            </div>
            <Switch
              checked={viewInBoxes}
              onCheckedChange={setViewInBoxes}
              className='data-[state=checked]:bg-primary'
            />
            <div className='flex items-center gap-2'>
              <Box className='h-4 w-4' />
              <span className='text-sm font-medium'>View as Boxes</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards - Updated to show boxes if toggled */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Quantity
            </CardTitle>
            {viewInBoxes && canShowBoxes ? <Box className='text-muted-foreground h-4 w-4' /> : <Package className='text-muted-foreground h-4 w-4' />}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {viewInBoxes && canShowBoxes
                ? formatQuantity(summary.overallTotalQuantity)
                : `${summary.overallTotalQuantity} ${unitSymbol}`}
            </div>
            <p className='text-muted-foreground text-xs'>
              {viewInBoxes && canShowBoxes
                ? `${formatQuantity(summary.totalStoreQuantity)} in stores + ${formatQuantity(summary.totalShopQuantity)} in shops`
                : `${summary.totalStoreQuantity} in stores + ${summary.totalShopQuantity} in shops`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Locations</CardTitle>
            <Layers className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {locationStocks?.length || 0}
            </div>
            <p className='text-muted-foreground text-xs'>
              Active stock locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Branches</CardTitle>
            <MapPin className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{branches.length}</div>
            <div className='text-muted-foreground mt-2 text-xs'>
              {branches.length > 0 ? `${branches.length} active branches` : 'No branches'}
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
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
    
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
      <p className='font-medium'>Brand</p>
      <p className='text-muted-foreground'>
        {product.brand?.name || 'N/A'}
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
        {product.UnitOfMeasure || 'N/A'}
      </p>
    </div>

    {product.hasBox && (
      <>
        <div>
          <p className='font-medium'>Box Support</p>
          <Badge variant='default' className='flex items-center gap-1'>
            <Box className='h-3 w-3' />
            Enabled
          </Badge>
        </div>

        <div>
          <p className='font-medium'>Box Size</p>
          <p className='text-muted-foreground'>
            {product.boxSize} pieces per box
          </p>
        </div>
      </>
    )}
<div>
  <p className='font-medium'>Viscosity</p>
  <p className='text-muted-foreground'>
    {product.viscosity || 'N/A'}
  </p>
</div>

<div>
  <p className='font-medium'>Oil Type</p>
  <p className='text-muted-foreground'>
    {product.oilType || 'N/A'}
  </p>
</div>

<div>
  <p className='font-medium'>Additive Type</p>
  <p className='text-muted-foreground'>
    {product.additiveType || 'N/A'}
  </p>
</div>

    {product.description && (
      <div className='md:col-span-2 lg:col-span-3'>
        <p className='font-medium'>Description</p>
        <p className='text-muted-foreground'>{product.description}</p>
      </div>
    )}
  </div>

  {/* Additional Prices Section */}
  {product.additionalPrices?.length > 0 && (
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

  {/* Dates */}
  <div className='border-t pt-4'>
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

        {/* Location Stock Summary - Updated to show boxes if toggled */}
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
                      Quantity {viewInBoxes && canShowBoxes ? '(Boxes)' : `(${unitSymbol})`}
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
                      <TableCell>{location.branchName || 'N/A'}</TableCell>
                      <TableCell className='text-right font-medium'>
                        {viewInBoxes && canShowBoxes
                          ? formatQuantity(location.quantity)
                          : `${location.quantity}`}
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
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-medium'>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className='text-right font-bold'>
                      {viewInBoxes && canShowBoxes
                        ? formatQuantity(summary.overallTotalQuantity)
                        : `${summary.overallTotalQuantity} ${unitSymbol}`}
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

      {/* Stock Ledger with Branch Filter - Updated to show boxes if toggled */}
      <Card>
        <CardHeader>
          <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='text-primary h-5 w-5' />
              Stock Ledger ({filteredStockLedgers.length})
            </CardTitle>
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
                  <TableHead>Quantity ({viewInBoxes && canShowBoxes ? 'Boxes' : 'Pieces'})</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Reference/Invoice</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const sortedLedgers = [...filteredStockLedgers].sort(
                    (a, b) =>
                      new Date(a.movementDate).getTime() -
                      new Date(b.movementDate).getTime()
                  );

                  let runningBalance = 0;

                  return sortedLedgers.map((ledger) => {
                    const quantity = ledger.pieceQuantity || 0;
                    const boxQty = ledger.boxQuantity || 0;
                    
                    if (ledger.movementType.includes('IN')) {
                      runningBalance += quantity;
                    } else if (ledger.movementType.includes('OUT')) {
                      runningBalance -= quantity;
                    }

                    const displayQuantity = viewInBoxes && canShowBoxes
                      ? formatQuantity(quantity, boxQty)
                      : `${quantity} ${unitSymbol}`;

                    return (
                      <TableRow key={ledger.id}>
                        <TableCell>{formatDateTime(ledger.movementDate)}</TableCell>
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
                          {displayQuantity}
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
                        <TableCell className='font-medium text-green-600'>
                          {ledger.movementType.includes('IN')
                            ? `${viewInBoxes && canShowBoxes ? formatQuantity(quantity) : `${quantity} ${unitSymbol}`}`
                            : '-'}
                        </TableCell>
                        <TableCell className='font-medium text-red-600'>
                          {ledger.movementType.includes('OUT')
                            ? `${viewInBoxes && canShowBoxes ? formatQuantity(quantity) : `${quantity} ${unitSymbol}`}`
                            : '-'}
                        </TableCell>
                        <TableCell className='font-bold'>
                          {viewInBoxes && canShowBoxes
                            ? formatQuantity(runningBalance)
                            : `${runningBalance} ${unitSymbol}`}
                        </TableCell>
                        <TableCell>
                          {ledger.invoiceNo || ledger.reference || 'N/A'}
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
                        <TableCell className='max-w-50 truncate' title={ledger.notes || ''}>
                          {ledger.notes || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
              <tfoot>
                <TableRow className='bg-muted/50'>
                  <TableCell colSpan={7} className='text-right font-bold'>
                    Final Balance:
                  </TableCell>
                  <TableCell className='text-lg font-bold'>
                    {(() => {
                      const finalBalance = filteredStockLedgers.reduce(
                        (balance, ledger) => {
                          const qty = ledger.pieceQuantity || 0;
                          if (ledger.movementType.includes('IN')) {
                            return balance + qty;
                          } else if (ledger.movementType.includes('OUT')) {
                            return balance - qty;
                          }
                          return balance;
                        },
                        0
                      );
                      return viewInBoxes && canShowBoxes
                        ? formatQuantity(finalBalance)
                        : `${finalBalance} ${unitSymbol}`;
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