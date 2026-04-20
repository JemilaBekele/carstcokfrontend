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
  AlertTriangle,
  Box,
  PackageOpen,
  Phone,
  MapPin,
  Building,
  Receipt,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getCustomerPaymentSummary, getCustomerSells } from '@/service/customer';

type CustomerSellDetailPageProps = {
  customerId?: string;
};

interface SellItem {
  id: string;
  productName: string;
  productCode: string;
  isBox: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shopName: string;
  boxInfo?: {
    hasBox: boolean;
    boxSize: number;
    boxQuantity: number | null;
    pieceQuantity: number;
  };
}

interface SellPayment {
  id: string;
  amount: number;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

interface Sell {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  paymentStatus: string;
  saleStatus: string;
  saleDate: string;
  notes?: string;
  itemsCount: number;
  items: SellItem[];
  sellPayments: SellPayment[];
  paymentSummary: {
    totalPaid: number;
    balance: number;
    paymentStatus: string;
    paymentPercentage: number;
    paymentsCount: number;
    lastPayment: SellPayment | null;
  };
  branch?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CustomerSellResponse {
  customer: {
    id: string;
    name: string;
    companyName: string | null;
    phone1: string;
    phone2: string | null;
    tinNumber: string | null;
    address: string | null;
    registeredAt: string;
  };
  sells: Sell[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalSells: number;
    totalGrandAmount: number;
    totalPaidAmount: number;
    totalBalance: number;
    totalDiscount: number;
    totalVat: number;
    totalSubTotal: number;
    totalProductsSold: number;
    averageSaleAmount: number;
    firstSaleDate: string;
    lastSaleDate: string;
    collectionRate: number;
  };
  breakdown: {
    bySaleStatus: Array<{
      status: string;
      count: number;
      totalAmount: number;
      percentage: number;
    }>;
    byPaymentStatus: Array<{
      status: string;
      count: number;
      totalAmount: number;
      totalPaid: number;
      totalBalance: number;
      percentage: number;
    }>;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    invoiceNo: string;
    grandTotal: number;
    createdAt: string;
    createdBy: string;
  }>;
}

interface PaymentSummaryResponse {
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  summary: {
    totalPurchases: number;
    totalPaid: number;
    totalBalance: number;
    paymentCompliance: number;
  };
  outstandingInvoices: Array<{
    invoiceNo: string;
    date: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    paymentStatus: string;
  }>;
  totalOutstanding: number;
  outstandingCount: number;
}

const CustomerSellDetailPage: React.FC<CustomerSellDetailPageProps> = ({ customerId }) => {
  const [data, setData] = useState<CustomerSellResponse | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

  const fetchCustomerSells = useCallback(async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (filterStatus) params.saleStatus = filterStatus;
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      
      const response = await getCustomerSells(customerId, params);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch customer sells:', error);
      toast.error('Failed to fetch customer sells');
    } finally {
      setLoading(false);
    }
  }, [customerId, currentPage, filterStatus, filterPaymentStatus]);

  const fetchPaymentSummary = useCallback(async () => {
    if (!customerId) return;
    
    try {
      const response = await getCustomerPaymentSummary(customerId);
      setPaymentSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
      toast.error('Failed to fetch payment summary');
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerSells();
      fetchPaymentSummary();
    }
  }, [customerId, currentPage, filterStatus, filterPaymentStatus, fetchCustomerSells, fetchPaymentSummary]);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'APPROVED':
      case 'DELIVERED':
        return 'default';
      case 'PARTIALLY_DELIVERED':
        return 'secondary';
      case 'NOT_APPROVED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PARTIAL':
        return 'outline';
      case 'PENDING':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading && !data) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Customer not found</p>
      </div>
    );
  }

  const { customer, sells, summary, recentPayments, pagination } = data;

  return (
    <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
      {/* Customer Profile Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
            <div className='flex items-center gap-2'>
              <User className='text-primary h-5 w-5' />
              <span className='truncate'>Customer Profile</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
            <div className='space-y-3'>
              <div className='flex items-start gap-2'>
                <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Customer Name:</p>
                  <p className='text-muted-foreground text-base font-semibold'>
                    {customer.name}
                  </p>
                </div>
              </div>
              
              {customer.companyName && (
                <div className='flex items-start gap-2'>
                  <Building className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Company:</p>
                    <p className='text-muted-foreground text-sm'>
                      {customer.companyName}
                    </p>
                  </div>
                </div>
              )}
              
              <div className='flex items-start gap-2'>
                <Phone className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Phone Numbers:</p>
                  <p className='text-muted-foreground text-sm'>{customer.phone1}</p>
                  {customer.phone2 && (
                    <p className='text-muted-foreground text-sm'>{customer.phone2}</p>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              {customer.tinNumber && (
                <div className='flex items-start gap-2'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>TIN Number:</p>
                    <p className='text-muted-foreground text-sm'>{customer.tinNumber}</p>
                  </div>
                </div>
              )}
              
              {customer.address && (
                <div className='flex items-start gap-2'>
                  <MapPin className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Address:</p>
                    <p className='text-muted-foreground text-sm'>{customer.address}</p>
                  </div>
                </div>
              )}
              
              <div className='flex items-start gap-2'>
                <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                <div>
                  <p className='font-medium text-sm'>Customer Since:</p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(customer.registeredAt)}
                  </p>
                </div>
              </div>
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
                  {summary.totalSells} invoices
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
                <p className='text-muted-foreground text-sm'>Total Paid</p>
                <p className='text-2xl font-bold text-green-600'>
                  {summary.totalPaidAmount.toFixed(2)}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  {summary.collectionRate}% collection rate
                </p>
              </div>
              <DollarSign className='text-green-600 h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Outstanding Balance</p>
                <p className='text-2xl font-bold text-orange-600'>
                  {summary.totalBalance.toFixed(2)}
                </p>
              </div>
              <AlertTriangle className='text-orange-600 h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Average Sale</p>
                <p className='text-2xl font-bold'>
                  {summary.averageSaleAmount.toFixed(2)}
                </p>
                <p className='text-muted-foreground text-xs mt-1'>
                  {summary.totalProductsSold} products sold
                </p>
              </div>
              <TrendingUp className='text-primary h-8 w-8 opacity-50' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary Card (if paymentSummary exists) */}
      {paymentSummary && paymentSummary.outstandingCount > 0 && (
        <Card className='shadow-lg border-orange-200'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold'>
              <AlertTriangle className='text-orange-500 h-5 w-5' />
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <div className='mb-4'>
              <Progress 
                value={Number(paymentSummary?.summary?.paymentCompliance)} 
                className='h-2'
              />
              <p className='text-muted-foreground text-sm mt-2'>
                Payment Compliance: {paymentSummary.summary.paymentCompliance}%
              </p>
            </div>
            
            <div className='space-y-3'>
              {paymentSummary.outstandingInvoices.map((invoice) => (
                <div key={invoice.invoiceNo} className='flex items-center justify-between p-3 bg-orange-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-sm'>{invoice.invoiceNo}</p>
                    <p className='text-muted-foreground text-xs'>{formatDate(invoice.date)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-orange-600'>${invoice.balance.toFixed(2)}</p>
                    <p className='text-muted-foreground text-xs'>of ${invoice.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className='mt-4 pt-4 border-t'>
              <div className='flex justify-between items-center'>
                <span className='font-semibold'>Total Outstanding:</span>
                <span className='text-xl font-bold text-orange-600'>
                  {paymentSummary.totalOutstanding.toFixed(2)}
                </span>
              </div>
              <p className='text-muted-foreground text-xs mt-1'>
                {paymentSummary.outstandingCount} invoice(s) with pending balance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sells List Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold md:text-xl'>
              <Package className='text-primary h-5 w-5' />
              Purchase History
              <Badge variant='secondary' className='ml-2'>
                {pagination.totalRecords}
              </Badge>
            </CardTitle>
            
            {/* Filters */}
            <div className='flex gap-2'>
              <select
                className='rounded-md border border-gray-300 px-3 py-1 text-sm'
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value=''>All Status</option>
                <option value='APPROVED'>Approved</option>
                <option value='NOT_APPROVED'>Not Approved</option>
                <option value='DELIVERED'>Delivered</option>
                <option value='PARTIALLY_DELIVERED'>Partially Delivered</option>
                <option value='CANCELLED'>Cancelled</option>
              </select>
              
              <select
                className='rounded-md border border-gray-300 px-3 py-1 text-sm'
                value={filterPaymentStatus}
                onChange={(e) => {
                  setFilterPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value=''>All Payment</option>
                <option value='PAID'>Paid</option>
                <option value='PARTIAL'>Partial</option>
                <option value='PENDING'>Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
              <p className='mt-2 text-sm'>Loading sells...</p>
            </div>
          ) : sells.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              <p>No purchases found for this customer</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Stacked Cards */}
              <div className='space-y-4 md:hidden'>
                {sells.map((sell) => (
                  <div key={sell.id} className='rounded-lg border border-gray-200 p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <div>
                        <p className='font-semibold text-sm'>{sell.invoiceNo}</p>
                        <p className='text-xs text-muted-foreground'>{formatDate(sell.saleDate)}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(sell.saleStatus)} className='text-xs'>
                        {sell.saleStatus}
                      </Badge>
                    </div>
                    
                    <div className='space-y-2 mb-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Total:</span>
                        <span className='font-semibold'>{sell.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Paid:</span>
                        <span className='text-green-600'>{sell.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Balance:</span>
                        <span className='text-orange-600 font-semibold'>{sell.balance.toFixed(2)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Items:</span>
                        <span>{sell.itemsCount}</span>
                      </div>
                    </div>
                    
                    <Badge variant={getPaymentBadgeVariant(sell.paymentStatus)} className='w-full justify-center'>
                      {sell.paymentStatus}
                    </Badge>
                    
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full mt-3'
                      onClick={() => setSelectedSell(selectedSell?.id === sell.id ? null : sell)}
                    >
                      {selectedSell?.id === sell.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    {selectedSell?.id === sell.id && (
                      <div className='mt-4 pt-4 border-t space-y-3'>
                        {/* Items */}
                        <div>
                          <p className='font-medium text-sm mb-2'>Items:</p>
                          <div className='space-y-2'>
                            {sell.items.map((item) => (
                              <div key={item.id} className='text-sm p-2 bg-gray-50 rounded'>
                                <p className='font-medium'>{item.productName}</p>
                                <div className='flex justify-between text-xs mt-1'>
                                  <span>Qty: {item.quantity}</span>
                                  <span>{item.unitPrice.toFixed(2)}/ea</span>
                                  <span className='font-semibold'>{item.totalPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Payments */}
                        {sell.sellPayments.length > 0 && (
                          <div>
                            <p className='font-medium text-sm mb-2'>Payments:</p>
                            <div className='space-y-1'>
                              {sell.sellPayments.map((payment) => (
                                <div key={payment.id} className='flex justify-between text-xs'>
                                  <span>{formatDate(payment.createdAt)}</span>
                                  <span className='text-green-600'>+{payment.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
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
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sells.map((sell) => (
                      <React.Fragment key={sell.id}>
                        <TableRow>
                          <TableCell className='font-medium'>{sell.invoiceNo}</TableCell>
                          <TableCell>{formatDate(sell.saleDate)}</TableCell>
                          <TableCell>{sell.itemsCount}</TableCell>
                          <TableCell>{sell.grandTotal.toFixed(2)}</TableCell>
                          <TableCell className='text-green-600'>{sell.totalPaid.toFixed(2)}</TableCell>
                          <TableCell className='text-orange-600 font-semibold'>
                            {sell.balance.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(sell.saleStatus)}>
                              {sell.saleStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPaymentBadgeVariant(sell.paymentStatus)}>
                              {sell.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setSelectedSell(selectedSell?.id === sell.id ? null : sell)}
                            >
                              {selectedSell?.id === sell.id ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {selectedSell?.id === sell.id && (
                          <TableRow>
                            <TableCell colSpan={9} className='bg-gray-50 p-4'>
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
                                      {sell.items.map((item) => (
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
                                
                                {sell.sellPayments.length > 0 && (
                                  <div>
                                    <h4 className='font-semibold mb-2'>Payment History</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Amount</TableHead>
                                          <TableHead>Created By</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sell.sellPayments.map((payment) => (
                                          <TableRow key={payment.id}>
                                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                                            <TableCell className='text-green-600'>
                                              +{payment.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>{payment.createdBy?.name || 'System'}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                                
                                {sell.notes && (
                                  <div>
                                    <h4 className='font-semibold mb-1'>Notes</h4>
                                    <p className='text-sm text-muted-foreground'>{sell.notes}</p>
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

      {/* Recent Payments Card */}
      {recentPayments.length > 0 && (
        <Card className='shadow-lg'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='flex items-center gap-2 text-lg font-bold'>
              <Clock className='text-primary h-5 w-5' />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <div className='space-y-3'>
              {recentPayments.map((payment) => (
                <div key={payment.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-sm'>{payment.invoiceNo}</p>
                    <p className='text-muted-foreground text-xs'>{formatDate(payment.createdAt)}</p>
                    <p className='text-muted-foreground text-xs'>by {payment.createdBy}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-green-600 font-bold'>+{payment.amount.toFixed(2)}</p>
                    <p className='text-muted-foreground text-xs'>of {payment.grandTotal.toFixed(2)}</p>
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

export default CustomerSellDetailPage;