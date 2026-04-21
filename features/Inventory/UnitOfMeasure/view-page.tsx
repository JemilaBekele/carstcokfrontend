'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import UnitOfMeasureForm from './form'; // Adjust path if needed

interface UnitOfMeasureModalProps {
  initialData?: IUnitOfMeasure | null;
  pageTitle?: string;
}

export default function UnitOfMeasureModal({
  initialData = null,
  pageTitle = 'Add New Unit of Measure'
}: UnitOfMeasureModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => {
    setIsModalOpen(false);
    router.refresh(); // Refresh page on modal close
  };

  return (
    <>
      <button
        onClick={handleModalOpen}
        className={
          buttonVariants({ variant: 'default' }) + ' text-xs md:text-sm'
        }
      >
        <Plus className='mr-2 h-4 w-4' />
        {initialData ? 'Edit Unit' : 'Add New Unit'}
      </button>

      <Modal
        title={initialData ? 'Edit Unit of Measure' : pageTitle}
        description={
          initialData
            ? 'Update the unit details below.'
            : 'Fill in the details below to add a new unit of measure.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <UnitOfMeasureForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}
