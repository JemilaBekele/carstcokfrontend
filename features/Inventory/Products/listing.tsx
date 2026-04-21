/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import type { IProduct } from "@/models/Product";
import { getAllProducts } from "@/service/Product";
import { productColumns } from "./tables/columns";
import * as XLSX from 'xlsx';

type ProductsListingPageProps = object;

// Helper function to format quantity in boxes and pieces (same as in columns)
const formatBoxPieceQuantity = (quantityInPieces: number, hasBox: boolean, boxSize: number | null | undefined): string => {
  if (!hasBox || !boxSize || boxSize <= 0) {
    return `${quantityInPieces} pcs`;
  }
  
  if (quantityInPieces === 0) return '0 pcs';
  
  const boxes = Math.floor(quantityInPieces / boxSize);
  const pieces = quantityInPieces % boxSize;
  
  const parts = [];
  if (boxes > 0) {
    parts.push(`${boxes} box${boxes !== 1 ? 'es' : ''}`);
  }
  if (pieces > 0) {
    parts.push(`${pieces} piece${pieces !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' + ');
};

// Helper function to calculate total stock from stockSummary
const calculateTotalStock = (product: IProduct): number => {
  let total = 0;
  const { shopStocks, storeStocks } = product.stockSummary || { shopStocks: {}, storeStocks: {} };

  Object.values(shopStocks).forEach((stockInfo: any) => {
    total += stockInfo?.quantity || 0;
  });

  Object.values(storeStocks).forEach((stockInfo: any) => {
    total += stockInfo?.quantity || 0;
  });

  return total;
};

const flattenStockData = (products: IProduct[]) => {
  const allShopNames = new Set<string>();
  const allStoreNames = new Set<string>();

  products.forEach((product) => {
    const { shopStocks = {}, storeStocks = {} } = product.stockSummary || {};
    Object.keys(shopStocks).forEach((shopName) => allShopNames.add(shopName));
    Object.keys(storeStocks).forEach((storeName) => allStoreNames.add(storeName));
  });

  return products.map((product) => {
    const hasBox = product.hasBox;
    const boxSize = product.boxSize;
    
    const flatProduct: any = {
      'Product Code': product.productCode,
      'Product Name': product.name,
      'Generic': product.generic,
      'Category': product.category,
      'Has Box': hasBox ? 'Yes' : 'No',
      'Box Size (Pieces)': boxSize || '-',
      'Unit': product.unitOfMeasure?.symbol,
      'Selling Price': product.sellPrice,
      'Total Stock (Pieces)': calculateTotalStock(product),
      'Total Stock (Boxes & Pieces)': formatBoxPieceQuantity(calculateTotalStock(product), hasBox, boxSize),
      'Created At': product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-',
    };

    // Add shop stock columns with both pieces and formatted display
    const { shopStocks = {} } = product.stockSummary || {};
    allShopNames.forEach((shopName) => {
      const stockInfo = shopStocks[shopName];
      const quantity = stockInfo?.quantity || 0;
      
      flatProduct[`Shop: ${shopName} (Pieces)`] = quantity;
      flatProduct[`Shop: ${shopName} (Boxes & Pieces)`] = formatBoxPieceQuantity(quantity, hasBox, boxSize);
      
      if (stockInfo?.branchName) {
        flatProduct[`Shop: ${shopName} (Branch)`] = stockInfo.branchName;
      }
    });

    // Add store stock columns with both pieces and formatted display
    const { storeStocks = {} } = product.stockSummary || {};
    allStoreNames.forEach((storeName) => {
      const stockInfo = storeStocks[storeName];
      const quantity = stockInfo?.quantity || 0;
      
      flatProduct[`Store: ${storeName} (Pieces)`] = quantity;
      flatProduct[`Store: ${storeName} (Boxes & Pieces)`] = formatBoxPieceQuantity(quantity, hasBox, boxSize);
      
      if (stockInfo?.branchName) {
        flatProduct[`Store: ${storeName} (Branch)`] = stockInfo.branchName;
      }
    });

    return flatProduct;
  });
};

const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns (optional but helpful)
  const maxWidth = 50;
  const colWidths: any = {};
  Object.keys(data[0] || {}).forEach((key) => {
    let maxLength = key.length;
    data.forEach((row) => {
      const value = row[key]?.toString() || '';
      maxLength = Math.max(maxLength, value.length);
    });
    colWidths[key] = Math.min(maxLength, maxWidth);
  });
  
worksheet['!cols'] = Object.values(colWidths).map((width: any) => ({ wch: width }));  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Stock Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};



export default function ProductsListingPage({}: ProductsListingPageProps) {
  const { page, search, limit } = useTableQueryParams();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllProducts({ page, limit });

        if (cancelled) return;

        setProducts(response.products || []);
        setTotalCount(response.totalCount || 0);
      } catch (loadError) {
        console.error("Error loading products:", loadError);
        if (!cancelled) {
          setError("Error loading products. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, [limit, page]);

  const filteredData = useMemo(() => {
    if (!search) return products;
    const searchLower = search.toLowerCase();
    return products.filter((item) => {
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        item.generic?.toLowerCase().includes(searchLower) ||
        item.productCode?.toLowerCase().includes(searchLower)
      );
    });
  }, [products, search]);

  const exportData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return flattenStockData(filteredData);
  }, [filteredData]);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleExportExcel = () => {
    if (exportData.length === 0) {
      alert('No data to export');
      return;
    }
    exportToExcel(exportData, `products-stock-report-${new Date().toISOString().split('T')[0]}`);
  };


  if (loading) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button onClick={handleExportExcel} variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export to Excel
        </Button>
    
      </div>
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={productColumns}
      />
    </div>
  );
}