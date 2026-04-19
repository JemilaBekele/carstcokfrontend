/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  Calendar,
  User,
  DollarSign,
  FileText,
  Loader2,
  Box,
  PackageOpen,
  Phone,
  MapPin,
  Building,
  Receipt,
  TrendingUp,
  Clock,
  Mail,
  Store,
  ShoppingBag
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getSupplierPurchases } from '@/service/customer';

type SupplierPurchaseDetailPageProps = {
  supplierId?: string;
};

interface PurchaseItem {
  id: string;
  productName: string;
  productCode: string;
  isBox: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  boxInfo?: {
    hasBox: boolean;
    boxSize: number;
    boxQuantity: number | null;
    pieceQuantity: number;
  };
}

interface Purchase {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  subTotal: number;
  paymentStatus: string;
  purchaseDate: string;
  notes?: string;
  itemsCount: number;
  items: PurchaseItem[];
  location: {
    type: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface SupplierPurchaseResponse {
  supplier: {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    tinNumber: string | null;
    notes: string | null;
    registeredAt: string;
  };
  purchases: Purchase[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalPurchases: number;
    totalGrandAmount: number;
    totalSubTotal: number;
    totalProductsPurchased: number;
    averagePurchaseAmount: number;
    firstPurchaseDate: string;
    lastPurchaseDate: string;
  };
  breakdown: {
    byPaymentStatus: Array<{
      status: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
  };
  recentPurchases: Array<{
    id: string;
    invoiceNo: string;
    grandTotal: number;
    purchaseDate: string;
    paymentStatus: string;
  }>;
}

const SupplierPurchaseDetailPage: React.FC<SupplierPurchaseDetailPageProps> = ({ supplierId }) => {
  const [data, setData] = useState<SupplierPurchaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

  const fetchSupplierPurchases = useCallback(async () => {
    if (!supplierId) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      
      const response = await getSupplierPurchases(supplierId, params);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch supplier purchases:', error);
      toast.error('Failed to fetch supplier purchases');
    } finally {
      setLoading(false);
    }
  }, [supplierId, currentPage, filterPaymentStatus]);

  useEffect(() => {
    if (supplierId) {
      fetchSupplierPurchases();
    }
  }, [supplierId, currentPage, filterPaymentStatus, fetchSupplierPurchases]);

  const getPaymentBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'outline';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading && !data) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading supplier details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Supplier not found</p>
      </div>
    );
  }

  const { supplier, purchases, summary, recentPurchases, pagination, breakdown } = data;

  return (
    <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
      {/* Supplier Profile Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
            <div className='flex items-center gap-2'>
              <Building className='text-primary h-5 w-5' />
              <span className='truncate'>Supplier Profile</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
            <div className='space-y-3'>
              <div className='flex items-start gap-2'>
                <Building className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Supplier Name:</p>
                  <p className='text-muted-foreground text-base font-semibold'>
                    {supplier.name}
                  </p>
                </div>
              </div>
              
              {supplier.contactName && (
                <div className='flex items-start gap-2'>
                  <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Contact Person:</p>
                    <p className='text-muted-foreground text-sm'>
                      {supplier.contactName}
                    </p>
                  </div>
                </div>
              )}
              
              {supplier.phone && (
                <div className='flex items-start gap-2'>
                  <Phone className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Phone:</p>
                    <p className='text-muted-foreground text-sm'>{supplier.phone}</p>
                  </div>
                </div>
              )}
              
              {supplier.email && (
                <div className='flex items-start gap-2'>
                  <Mail className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Email:</p>
                    <p className='text-muted-foreground text-sm'>{supplier.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-3'>
              {supplier.tinNumber && (
                <div className='flex items-start gap-2'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>TIN Number:</p>
                    <p className='text-muted-foreground text-sm'>{supplier.tinNumber}</p>
                  </div>
                </div>
              )}
              
              {(supplier.address || supplier.city || supplier.country) && (
                <div className='flex items-start gap-2'>
                  <MapPin className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Address:</p>
                    <p className='text-muted-foreground text-sm'>
                      {[supplier.address, supplier.city, supplier.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              <div className='flex items-start gap-2'>
                <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Supplier Since:</p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(supplier.registeredAt)}
                  </p>
                </div>
              </div>
              
              {supplier.notes && (
                <div className='flex items-start gap-2'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Notes:</p>
                    <p className='text-muted-foreground text-sm'>{supplier.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Total Purchases</p>
                <p className='text-2xl font-bold'>
                  {summary.totalGrandAmount.toFixed(2)}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  {summary.totalPurchases} invoices
                </p>
              </div>
              <Receipt className='text-primary h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Total Products</p>
                <p className='text-2xl font-bold'>
                  {summary.totalProductsPurchased}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  items purchased
                </p>
              </div>
              <Package className='text-primary h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Average Purchase</p>
                <p className='text-2xl font-bold'>
                  {summary.averagePurchaseAmount.toFixed(2)}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  per order
                </p>
              </div>
              <TrendingUp className='text-primary h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'> Status</p>
                <div className='space-y-1 mt-1'>
                  {breakdown.byPaymentStatus.map((status) => (
                    <div key={status.status} className='flex justify-between gap-2 text-xs'>
                      <span>{status.status}:</span>
                      <span className='font-semibold'>{status.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <DollarSign className='text-primary h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases List Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold md:text-xl'>
              <ShoppingBag className='text-primary h-5 w-5' />
              Purchase History
              <Badge variant='secondary' className='ml-2'>
                {pagination.totalRecords}
              </Badge>
            </CardTitle>
            
            {/* Filters */}
            <div className='flex gap-2'>
              <select
                className='rounded-md border border-gray-300 px-3 py-1 text-sm'
                value={filterPaymentStatus}
                onChange={(e) => {
                  setFilterPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value=''>All Payment Status</option>
                <option value='APPROVED'>Approved</option>
                <option value='PENDING'>Pending</option>
                <option value='REJECTED'>Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
              <p className='mt-2 text-sm'>Loading purchases...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              <p>No purchases found for this supplier</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Stacked Cards */}
              <div className='space-y-4 md:hidden'>
                {purchases.map((purchase) => (
                  <div key={purchase.id} className='rounded-lg border border-gray-200 p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div>
                        <p className='font-semibold text-sm'>{purchase.invoiceNo}</p>
                        <p className='text-xs text-muted-foreground'>{formatDate(purchase.purchaseDate)}</p>
                      </div>
                      <Badge variant={getPaymentBadgeVariant(purchase.paymentStatus)} className='text-xs'>
                        {purchase.paymentStatus}
                      </Badge>
                    </div>
                    
                    <div className='space-y-2 mb-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Total:</span>
                        <span className='font-semibold'>${purchase.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Items:</span>
                        <span>{purchase.itemsCount}</span>
                      </div>
                      {purchase.location && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>Location:</span>
                          <span>{purchase.location.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full mt-3'
                      onClick={() => setSelectedPurchase(selectedPurchase?.id === purchase.id ? null : purchase)}
                    >
                      {selectedPurchase?.id === purchase.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    {selectedPurchase?.id === purchase.id && (
                      <div className='mt-4 pt-4 border-t space-y-3'>
                        {/* Items */}
                        <div>
                          <p className='font-medium text-sm mb-2'>Items:</p>
                          <div className='space-y-2'>
                            {purchase.items.map((item) => (
                              <div key={item.id} className='text-sm p-2 bg-gray-50 rounded'>
                                <p className='font-medium'>{item.productName}</p>
                                <div className='flex justify-between text-xs mt-1'>
                                  <span>Qty: {item.quantity}</span>
                                  <span>${item.unitPrice.toFixed(2)}/ea</span>
                                  <span className='font-semibold'>${item.totalPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {purchase.createdBy && (
                          <div className='text-xs text-muted-foreground'>
                            Created by: {purchase.createdBy.name}
                          </div>
                        )}
                        
                        {purchase.notes && (
                          <div>
                            <p className='font-medium text-sm mb-1'>Notes:</p>
                            <p className='text-sm text-muted-foreground'>{purchase.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Desktop View - Table */}
              <div className='hidden overflow-x-auto md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead> Total</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <React.Fragment key={purchase.id}>
                        <TableRow>
                          <TableCell className='font-medium'>{purchase.invoiceNo}</TableCell>
                          <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                          <TableCell>{purchase.itemsCount}</TableCell>
                          <TableCell className='font-semibold'>{purchase.grandTotal.toFixed(2)}</TableCell>
                          <TableCell>
                            {purchase.location && (
                              <Badge variant='outline' className='text-xs'>
                                {purchase.location.type === 'store' ? (
                                  <Store className='mr-1 h-3 w-3' />
                                ) : (
                                  <Building className='mr-1 h-3 w-3' />
                                )}
                                {purchase.location.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPaymentBadgeVariant(purchase.paymentStatus)}>
                              {purchase.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setSelectedPurchase(selectedPurchase?.id === purchase.id ? null : purchase)}
                            >
                              {selectedPurchase?.id === purchase.id ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {selectedPurchase?.id === purchase.id && (
                          <TableRow>
                            <TableCell colSpan={8} className='bg-gray-50 p-4'>
                              <div className='space-y-4'>
                                <div>
                                  <h4 className='font-semibold mb-2'>Items</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {purchase.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell>{item.productName}</TableCell>
                                          <TableCell>
                                            {item.isBox ? (
                                              <Badge variant='default' className='text-xs'>
                                                <Box className='mr-1 h-3 w-3' />
                                                Box
                                              </Badge>
                                            ) : (
                                              <Badge variant='secondary' className='text-xs'>
                                                <PackageOpen className='mr-1 h-3 w-3' />
                                                Piece
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>{item.quantity}</TableCell>
                                          <TableCell>{item.unitPrice.toFixed(2)}</TableCell>
                                          <TableCell className='font-semibold'>
                                            {item.totalPrice.toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                
                                {purchase.createdBy && (
                                  <div className='text-sm text-muted-foreground'>
                                    <strong>Created by:</strong> {purchase.createdBy.name}
                                    {purchase.updatedBy && ` • Updated by: ${purchase.updatedBy.name}`}
                                  </div>
                                )}
                                
                                {purchase.notes && (
                                  <div>
                                    <h4 className='font-semibold mb-1'>Notes</h4>
                                    <p className='text-sm text-muted-foreground'>{purchase.notes}</p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex justify-between items-center mt-4 pt-4 border-t'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className='text-sm'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Purchases Card */}
      {recentPurchases.length > 0 && (
        <Card className='shadow-lg'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold'>
              <Clock className='text-primary h-5 w-5' />
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <div className='space-y-3'>
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-sm'>{purchase.invoiceNo}</p>
                    <p className='text-muted-foreground text-xs'>{formatDate(purchase.purchaseDate)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold'>{purchase.grandTotal.toFixed(2)}</p>
                    <Badge variant={getPaymentBadgeVariant(purchase.paymentStatus)} className='text-xs'>
                      {purchase.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierPurchaseDetailPage;