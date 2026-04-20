/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { getTopProductsReportWithPrediction } from '@/service/Report';
import { utils, writeFile } from 'xlsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProductStats {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  brandName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

interface MonthlyReport {
  month: string;
  year: number;
  topByRevenue: ProductStats[];
  topByQuantity: ProductStats[];
}

interface ProductPrediction {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  brandName: string;
  predictedRank: number;
  predictedRevenue: number;
  predictedQuantity: number;
  confidence: number;
}

interface StockStatus {
  currentStock: {
    storeStock: number;
    shopStock: number;
    totalStock: number;
  };
  stockLevel: 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'HIGH';
  warningQuantity: number;
  recommendation: string;
}

interface PredictionResult {
  topPredictedProduct: ProductPrediction | null;
  stockStatus: StockStatus | null;
  recommendations: string[];
  alternativeProducts: ProductPrediction[];
}

interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    monthsCovered: number;
  };
  monthlyReports: MonthlyReport[];
  prediction: PredictionResult;
  summary: {
    totalRevenue: number;
    totalQuantity: number;
    uniqueProductsSold: number;
    averageMonthlyRevenue: number;
  };
  message?: string;
}

export function TopProductsReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const reportData = await getTopProductsReportWithPrediction();
      setData(reportData);
      
      // Extract unique categories
      const allCategories = new Set<string>();
      reportData.monthlyReports.forEach((report: MonthlyReport) => {
        report.topByRevenue.forEach((product: ProductStats) => {
          allCategories.add(product.categoryName);
        });
      });
      setCategories(Array.from(allCategories));
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = (products: ProductStats[]) => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoryName === selectedCategory);
    }
    return filtered;
  };

  const getSelectedMonthData = () => {
    if (!data) return null;
    if (selectedMonth === 'all') {
      // Combine all months data
      const allProducts = new Map<string, ProductStats>();
      data.monthlyReports.forEach((report) => {
        report.topByRevenue.forEach((product) => {
          if (!allProducts.has(product.productId)) {
            allProducts.set(product.productId, { ...product });
          } else {
            const existing = allProducts.get(product.productId)!;
            existing.totalQuantity += product.totalQuantity;
            existing.totalRevenue += product.totalRevenue;
            existing.averagePrice = existing.totalRevenue / existing.totalQuantity;
          }
        });
      });
      return {
        topByRevenue: Array.from(allProducts.values())
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 50),
        topByQuantity: Array.from(allProducts.values())
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 50),
      };
    }
    return data.monthlyReports[parseInt(selectedMonth)];
  };

  const exportToExcel = () => {
    if (!data) return;

    const monthlyData: any[] = [];
    data.monthlyReports.forEach((report) => {
      report.topByRevenue.slice(0, 20).forEach((product) => {
        monthlyData.push({
          Month: `${report.month} ${report.year}`,
          'Product Name': product.productName,
          'Product Code': product.productCode,
          Category: product.categoryName,
          Brand: product.brandName,
          'Total Quantity': product.totalQuantity,
          'Total Revenue': product.totalRevenue,
          'Average Price': product.averagePrice,
          'Rank By Revenue': report.topByRevenue.findIndex(p => p.productId === product.productId) + 1,
          'Rank By Quantity': report.topByQuantity.findIndex(p => p.productId === product.productId) + 1,
        });
      });
    });

    const worksheet = utils.json_to_sheet(monthlyData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Top Products Report');
    writeFile(workbook, `top-products-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Failed to load report data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no data available
  if (data.message || data.monthlyReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            {data.message || 'No sales data found for the past 7 months'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No approved sales found in the database for the last 7 months.</p>
            <p className="text-sm mt-2">Please ensure there are approved sales to generate this report.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedData = getSelectedMonthData();
  const chartData = data.monthlyReports.map((report) => ({
    month: `${report.month.slice(0, 3)} ${report.year}`,
    revenue: report.topByRevenue.reduce((sum, p) => sum + p.totalRevenue, 0),
    quantity: report.topByQuantity.reduce((sum, p) => sum + p.totalQuantity, 0),
  }));

  const getStockBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical Stock</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low Stock</Badge>;
      case 'ADEQUATE':
        return <Badge variant="secondary">Adequate Stock</Badge>;
      default:
        return <Badge variant="default">High Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'ETB',
              }).format(data.summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 months
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalQuantity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Units sold
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.uniqueProductsSold.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Different products sold
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'ETB',
              }).format(data.summary.averageMonthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average revenue per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Section - Only show if prediction exists */}
      {data.prediction.topPredictedProduct && data.prediction.stockStatus && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-primary" />
                  Next Month&apos;s Top Predicted Product
                </CardTitle>
                <CardDescription>
                  Based on historical data analysis and trend prediction
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Confidence: {data.prediction.topPredictedProduct.confidence}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">
                    {data.prediction.topPredictedProduct.productName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Code: {data.prediction.topPredictedProduct.productCode} | 
                    Category: {data.prediction.topPredictedProduct.categoryName} | 
                    Brand: {data.prediction.topPredictedProduct.brandName}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Predicted Revenue</p>
                    <p className="text-xl font-bold text-green-700">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(data.prediction.topPredictedProduct.predictedRevenue)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Predicted Quantity</p>
                    <p className="text-xl font-bold text-blue-700">
                      {data.prediction.topPredictedProduct.predictedQuantity.toLocaleString()} units
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStockBadge(data.prediction.stockStatus.stockLevel)}
                    <span className="text-sm">
                      Stock: {data.prediction.stockStatus.currentStock.totalStock} units
                    </span>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Stock Recommendation
                    </p>
                    <p className="text-sm">{data.prediction.stockStatus.recommendation}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Alternative Top Products</h4>
                <div className="space-y-3">
                  {data.prediction.alternativeProducts.map((alt, idx) => (
                    <div key={alt.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{alt.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {alt.categoryName} | Rank #{alt.predictedRank}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Confidence: {alt.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            {data.prediction.recommendations && data.prediction.recommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Actionable Recommendations</h4>
                <div className="space-y-2">
                  {data.prediction.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 7 Months)</CardTitle>
          <CardDescription>Monthly revenue and quantity trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                name="Revenue (ETB)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="quantity"
                stroke="#82ca9d"
                name="Quantity Sold"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Report Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Top Products Report</CardTitle>
              <CardDescription>
                Top 50 products by revenue and quantity for each month
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Select Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months Combined</SelectItem>
                    {data.monthlyReports.map((report, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {report.month} {report.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="revenue">Top by Revenue</TabsTrigger>
              <TabsTrigger value="quantity">Top by Quantity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedData && getFilteredProducts(selectedData.topByRevenue || []).map((product, idx) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.productCode}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell>{product.brandName}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                          }).format(product.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                          }).format(product.averagePrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!selectedData?.topByRevenue || selectedData.topByRevenue.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="quantity" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedData && getFilteredProducts(selectedData.topByQuantity || []).map((product, idx) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.productCode}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell>{product.brandName}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                          }).format(product.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                          }).format(product.averagePrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!selectedData?.topByQuantity || selectedData.topByQuantity.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}