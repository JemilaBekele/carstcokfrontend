'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { IBrand } from '@/models/brand';
import { BrandCellAction } from './cell-action';

//
// Brand Columns
//
export const brandColumns: ColumnDef<IBrand>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Brand Name" />
    ),
    cell: ({ cell }) => (
      <div className="font-medium">
        {cell.getValue<IBrand['name']>()}
      </div>
    ),
    enableColumnFilter: true,
  },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IBrand['createdAt']>();

      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false,
  },

  {
    id: 'actions',
    cell: ({ row }) => <BrandCellAction data={row.original} />,
  },
];