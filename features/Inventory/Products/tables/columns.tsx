/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Package, Store, ShoppingCart, Box } from 'lucide-react';
import { IProduct } from '@/models/Product';
import { ProductCellAction } from './cell-action';

// Helper function to format quantity in boxes and pieces
const formatBoxPieceQuantity = (quantityInPieces: number, hasBox: boolean, boxSize: number | null | undefined): string => {
  if (!hasBox || !boxSize || boxSize <= 0) {
    return `${quantityInPieces} pcs`;
  }
  
  if (quantityInPieces === 0) return '0';
  
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

export const productColumns: ColumnDef<IProduct>[] = [
  {
    accessorKey: 'productCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Code' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<IProduct['productCode']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product Name' />
    ),
    cell: ({ cell, row }) => (
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Package className='text-muted-foreground h-4 w-4' />
          {cell.getValue<IProduct['name']>()}
        </div>
        {row.original.hasBox && row.original.boxSize && (
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <Box className='h-3 w-3' />
            <span>1 box = {row.original.boxSize} pieces</span>
          </div>
        )}
      </div>
    ),
    enableColumnFilter: true
  },
  {
    id: 'shopStocks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Shop Stock' />
    ),
    cell: ({ row }) => {
      const shopStocks = row.original.stockSummary.shopStocks;
      const hasBox = row.original.hasBox;
      const boxSize = row.original.boxSize;
      
      return (
        <div className='space-y-1'>
          {Object.entries(shopStocks).map(([shopName, stockInfo]: [string, any]) => (
            <div key={shopName} className='text-sm'>
              <div className='flex items-center gap-1'>
                <ShoppingCart className='h-3 w-3 text-blue-500' />
                <span className='font-medium'>{shopName}:</span>
                <span className='text-muted-foreground ml-1'>
                  {formatBoxPieceQuantity(stockInfo.quantity, hasBox, boxSize)}
                </span>
                <span className='text-muted-foreground ml-1 text-xs'>
                  {stockInfo.branchName ? `(${stockInfo.branchName})` : ''}
                </span>
              </div>
            </div>
          ))}
          {Object.keys(shopStocks).length === 0 && (
            <span className='text-muted-foreground text-sm'>No stock</span>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    id: 'storeStocks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Store Stock' />
    ),
    cell: ({ row }) => {
      const storeStocks = row.original.stockSummary.storeStocks;
      const hasBox = row.original.hasBox;
      const boxSize = row.original.boxSize;
      
      return (
        <div className='space-y-1'>
          {Object.entries(storeStocks).map(([storeName, stockInfo]: [string, any]) => (
            <div key={storeName} className='text-sm'>
              <div className='flex items-center gap-1'>
                <Store className='h-3 w-3 text-green-500' />
                <span className='font-medium'>{storeName}:</span>
                <span className='text-muted-foreground ml-1'>
                  {formatBoxPieceQuantity(stockInfo.quantity, hasBox, boxSize)}
                </span>
                <span className='text-muted-foreground ml-1 text-xs'>
                  {stockInfo.branchName ? `(${stockInfo.branchName})` : ''}
                </span>
              </div>
            </div>
          ))}
          {Object.keys(storeStocks).length === 0 && (
            <span className='text-muted-foreground text-sm'>No stock</span>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    id: 'totalStock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Branch Stock Summary' />
    ),
    cell: ({ row }) => {
      const { shopStocks, storeStocks } = row.original.stockSummary;
      const hasBox = row.original.hasBox;
      const boxSize = row.original.boxSize;

      // Separate shop and store stocks by branch
      const shopBranchTotals: Record<string, number> = {};
      const storeBranchTotals: Record<string, number> = {};
      const combinedBranchTotals: Record<string, number> = {};

      // Process shop stocks by branch
      Object.entries(shopStocks).forEach(([, stockInfo]: [string, any]) => {
        const branchName = stockInfo.branchName || 'Unknown Branch';
        const quantity = stockInfo.quantity || 0;

        shopBranchTotals[branchName] = (shopBranchTotals[branchName] || 0) + quantity;
        combinedBranchTotals[branchName] = (combinedBranchTotals[branchName] || 0) + quantity;
      });

      // Process store stocks by branch
      Object.entries(storeStocks).forEach(([, stockInfo]: [string, any]) => {
        const branchName = stockInfo.branchName || 'Unknown Branch';
        const quantity = stockInfo.quantity || 0;

        storeBranchTotals[branchName] = (storeBranchTotals[branchName] || 0) + quantity;
        combinedBranchTotals[branchName] = (combinedBranchTotals[branchName] || 0) + quantity;
      });

      // Get all unique branches
      const allBranches = Array.from(
        new Set([
          ...Object.keys(shopBranchTotals),
          ...Object.keys(storeBranchTotals)
        ])
      ).sort();

      // Calculate total combined quantity
      const totalCombinedQuantity = Object.values(combinedBranchTotals).reduce(
        (sum, qty) => sum + qty,
        0
      );

      return (
        <div className='space-y-3'>
          {/* Branch-wise breakdown */}
          {allBranches.length > 0 ? (
            <div className='space-y-2'>
              {allBranches.map((branchName) => {
                const shopQty = shopBranchTotals[branchName] || 0;
                const storeQty = storeBranchTotals[branchName] || 0;
                const combinedQty = combinedBranchTotals[branchName] || 0;

                return (
                  <div key={branchName} className='space-y-1'>
                    {/* Branch Header */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Package className='h-3 w-3 text-amber-500' />
                        <span className='text-sm font-medium'>
                          {branchName}
                        </span>
                      </div>
                      <span className='text-sm font-bold'>
                        {formatBoxPieceQuantity(combinedQty, hasBox, boxSize)}
                      </span>
                    </div>

                    {/* Shop and Store breakdown */}
                    <div className='text-muted-foreground ml-5 space-y-1 text-xs'>
                      {shopQty > 0 && (
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1'>
                            <ShoppingCart className='h-2.5 w-2.5 text-blue-500' />
                            <span>Shops:</span>
                          </div>
                          <span>{formatBoxPieceQuantity(shopQty, hasBox, boxSize)}</span>
                        </div>
                      )}
                      {storeQty > 0 && (
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1'>
                            <Store className='h-2.5 w-2.5 text-green-500' />
                            <span>Stores:</span>
                          </div>
                          <span>{formatBoxPieceQuantity(storeQty, hasBox, boxSize)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className='text-muted-foreground text-sm'>
              No stock in any branch
            </span>
          )}

          {/* Summary Totals */}
          <div className='space-y-2 border-t pt-2'>
            <div className='flex items-center justify-between pt-2'>
              <div className='flex items-center gap-2'>
                <Package className='h-3 w-3 text-amber-500' />
                <span className='text-sm font-bold'>Total :</span>
              </div>
              <span className='text-lg font-bold'>
                {formatBoxPieceQuantity(totalCombinedQuantity, hasBox, boxSize)}
              </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const getTotalStock = (row: any) => {
        const { shopStocks, storeStocks } = row.original.stockSummary;
        let total = 0;

        Object.values(shopStocks).forEach((stockInfo: any) => {
          total += stockInfo.quantity || 0;
        });

        Object.values(storeStocks).forEach((stockInfo: any) => {
          total += stockInfo.quantity || 0;
        });

        return total;
      };

      const totalA = getTotalStock(rowA);
      const totalB = getTotalStock(rowB);
      return totalA - totalB;
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IProduct['createdAt']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductCellAction data={row.original} />
  }
];