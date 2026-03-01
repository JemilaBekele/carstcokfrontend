/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconEdit, IconDotsVertical, IconTrash, IconBuildingStore } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { deleteProductBatch, updateShopStock } from '@/service/productBatchService';
import { IProductBatch } from '@/models/Product';
import { Edit } from 'lucide-react';
import { IShop } from '@/models/shop';
import { getShopsall } from '@/service/shop';

interface ProductBatchCellActionProps {
  data: IProductBatch;
}

export const ProductBatchCellAction: React.FC<ProductBatchCellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [shops, setShops] = useState<IShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const router = useRouter();

  // Fetch shops when dialog opens
  useEffect(() => {
    if (stockDialogOpen) {
      fetchShops();
    }
  }, [stockDialogOpen]);

  const fetchShops = async () => {
    try {
      const shopsData = await getShopsall();
      setShops(shopsData);
    } catch (error) {
      toast.error('Failed to fetch shops');
    }
  };

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Batch ID is missing. Cannot delete batch.');
      return;
    }

    setLoading(true);
    try {
      await deleteProductBatch(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Batch deleted successfully');
    } catch {
      toast.error('Error deleting batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShopStock = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop');
      return;
    }

    if (!quantity || isNaN(Number(quantity))) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const numericQuantity = Number(quantity);
    
    setLoading(true);
    try {
      const result = await updateShopStock(
        selectedShopId,
        data.id,
        numericQuantity,
        null // unitOfMeasureId set to null as per your requirement
      );

      toast.success(
        numericQuantity >= 0 
          ? `Successfully added ${numericQuantity} items to shop stock`
          : `Successfully removed ${Math.abs(numericQuantity)} items from shop stock`
      );
      
      setStockDialogOpen(false);
      setSelectedShopId('');
      setQuantity('');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error updating shop stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />

      {/* Shop Stock Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shop Stock</DialogTitle>
            <DialogDescription>
              Add or remove stock from shops for batch: {data.batchNumber}
              {data.product && ` (${data.product.name})`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shop">Select Shop</Label>
              <Select
                value={selectedShopId}
                onValueChange={setSelectedShopId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Quantity (Positive to add, Negative to remove)
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Use positive number to add stock, negative to remove
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateShopStock}
              disabled={loading || !selectedShopId || !quantity}
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Batch Actions</DropdownMenuLabel>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_BATCH.UPDATE.name}
          >
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/ProductBatch/${data.id}`)}
            >
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_BATCH.VIEW.name}
          >
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/ProductBatch/view?id=${data.id}`)
              }
            >
              <Edit className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem>
          </PermissionGuard>

          {/* New Shop Stock Management Option */}
         
            {/* <DropdownMenuItem
              onClick={() => setStockDialogOpen(true)}
            >
              <IconBuildingStore className='mr-2 h-4 w-4' /> Manage Shop Stock
            </DropdownMenuItem> */}

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_BATCH.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};