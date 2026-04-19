'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { AlertModal } from '@/components/modal/alert-modal';


import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';
import BrandForm from '../form'; // Make sure you have a BrandForm component
import { IBrand } from '@/models/brand';
import { deleteBrand } from '@/service/brand';

interface BrandCellActionProps {
  data: IBrand;
}

export const BrandCellAction: React.FC<BrandCellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Brand ID is missing. Cannot delete brand.');
      return;
    }

    setLoading(true);
    try {
      await deleteBrand(data.id);
      toast.success('Brand deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete confirmation modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit brand modal */}
      <Modal
        title='Edit Brand'
        description='Update the brand details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <BrandForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Action dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='w-8 h-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='w-4 h-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* <PermissionGuard fallback="hide"
            requiredPermission={PERMISSIONS.BRAND.UPDATE.name}
          > */}
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='w-4 h-4 mr-2' /> Update
            </DropdownMenuItem>
          {/* </PermissionGuard> */}

          {/* <PermissionGuard fallback="hide"
            requiredPermission={PERMISSIONS.BRAND.DELETE.name}
          > */}
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='w-4 h-4 mr-2' /> Delete
            </DropdownMenuItem>
          {/* </PermissionGuard> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};