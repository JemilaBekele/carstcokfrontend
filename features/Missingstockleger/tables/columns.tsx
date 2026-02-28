/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Package, Store, ShoppingCart } from 'lucide-react';
import { IProduct } from '@/models/Product';
import { ProductCellAction } from './cell-action';

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
    cell: ({ cell }) => (
      <div className='flex items-center gap-2'>
        <Package className='text-muted-foreground h-4 w-4' />
        {cell.getValue<IProduct['name']>()}
      </div>
    ),
    enableColumnFilter: true
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
