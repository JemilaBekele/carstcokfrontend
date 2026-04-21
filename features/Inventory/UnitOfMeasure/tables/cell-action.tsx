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

import { deleteUnitOfMeasure } from '@/service/UnitOfMeasure';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';
import UnitOfMeasureForm from '../form'; // Make sure you have a UnitOfMeasureForm component

interface UnitOfMeasureCellActionProps {
  data: IUnitOfMeasure;
}

export const UnitOfMeasureCellAction: React.FC<
  UnitOfMeasureCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Unit ID is missing. Cannot delete unit.');
      return;
    }

    setLoading(true);
    try {
      await deleteUnitOfMeasure(data.id);
      toast.success('Unit deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch  {
      toast.error('Error deleting unit. Please try again.');
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

      {/* Edit unit modal */}
      <Modal
        title='Edit Unit of Measure'
        description='Update the unit details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <UnitOfMeasureForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Action dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <PermissionGuard
            requiredPermission={PERMISSIONS.UNIT_OF_MEASURE.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>{' '}
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.UNIT_OF_MEASURE.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>{' '}
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
