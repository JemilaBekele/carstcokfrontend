'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { AlertCircle, CalendarDays, Check } from 'lucide-react';
import { SellCellAction } from './cell-action';
import { ISell, SaleStatus } from '@/models/Sell';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const getSaleStatusColor = (status: SaleStatus) => {
  switch (status) {
    case SaleStatus.APPROVED:
      return 'bg-blue-500 text-white';
    case SaleStatus.NOT_APPROVED:
      return 'bg-gray-500 text-white';
    case SaleStatus.PARTIALLY_DELIVERED:
      return 'bg-orange-500 text-white';
    case SaleStatus.DELIVERED:
      return 'bg-green-600 text-white';
    case SaleStatus.CANCELLED:
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

export const sellColumns: ColumnDef<ISell>[] = [
  {
    accessorKey: 'saleDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ISell['saleDate']>();
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
    accessorKey: 'invoiceNo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order No' />
    ),
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const invoiceNo = cell.getValue<ISell['invoiceNo']>();
      
      return (
        <div 
          className='cursor-pointer hover:text-primary hover:underline'
          onClick={() => router.push(`/dashboard/Sell/view?id=${row.original.id}`)}
        >
          {invoiceNo}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISell['customer']>()?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
   {
    accessorKey: 'createdBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Seller' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISell['createdBy']>()?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'branch',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Branch' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ISell['branch']>()?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'totalProducts',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Products' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['totalProducts']>()}</div>,
    enableColumnFilter: false
  },
  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['grandTotal']>()}</div>,
    enableColumnFilter: false
  },
  {
    accessorKey: 'NetTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Net Total' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISell['NetTotal']>()}</div>,
    enableColumnFilter: false
  },
  {
    accessorKey: 'saleStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sale Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<SaleStatus>();
      return (
        <Badge className={`${getSaleStatusColor(status)}`}>{status}</Badge>
      );
    },
    enableColumnFilter: true
  },
// {
//   accessorKey: 'SellStockCorrection',
//   header: ({ column }) => (
//     <DataTableColumnHeader column={column} title='Sell Correction' />
//   ),
//   cell: ({ cell }) => {
//     const corrections = cell.getValue<ISell['SellStockCorrection']>();
    
//     if (!corrections || corrections.length === 0) {
//       return <div className="text-gray-400">-</div>;
//     }

//     // For now, just show the status without check information
//     const firstStatus = corrections[0]?.status || 'UNKNOWN';
//     const hasMultiple = corrections.length > 1;
    
//     // If you want to show a count of different statuses
//     const statusCounts = corrections.reduce((acc, correction) => {
//       const status = correction.status || 'UNKNOWN';
//       acc[status] = (acc[status] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);
    
//     const hasMultipleStatuses = Object.keys(statusCounts).length > 1;

//     return (
//       <div className="flex flex-col gap-1">
//         <div className="flex items-center gap-2">
//           <Badge 
//             variant="outline" 
//             className={`
//               font-medium
//               ${firstStatus === 'PENDING'
//                 ? "bg-yellow-100 text-yellow-800 border-yellow-300"
//                 : firstStatus === 'APPROVED'
//                 ? "bg-green-100 text-green-800 border-green-300"
//                 : firstStatus === 'PARTIAL'
//                 ? "bg-blue-100 text-blue-800 border-blue-300"
//                 : firstStatus === 'REJECTED'
//                 ? "bg-red-100 text-red-800 border-red-300"
//                 : "bg-purple-100 text-purple-800 border-purple-300"
//               }
//             `}
//           >
//             {firstStatus}
//           </Badge>
          
//           {hasMultiple && (
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Badge variant="secondary" className="text-xs cursor-help">
//                     {corrections.length}
//                   </Badge>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <div className="space-y-1 min-w-[120px]">
//                     <div className="font-medium mb-1">Correction Statuses:</div>
//                     {Object.entries(statusCounts).map(([status, count]) => (
//                       <div key={status} className="flex items-center justify-between gap-4">
//                         <span>{status}:</span>
//                         <span>{count}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           )}
//         </div>
        
//         {/* Show multiple status indicator */}
//         {hasMultipleStatuses && (
//           <div className="text-xs text-gray-500 flex items-center gap-1">
//             <span>Multiple statuses</span>
//           </div>
//         )}
//       </div>
//     );
//   },
//   enableColumnFilter: true
// },
  {
    id: 'actions',
    cell: ({ row }) => <SellCellAction data={row.original} />
  }
];
