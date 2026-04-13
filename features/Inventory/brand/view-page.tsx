'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { IBrand } from '@/models/brand';
import BrandForm from './form'; // Adjust path if needed

interface BrandModalProps {
  initialData?: IBrand | null;
  pageTitle?: string;
}

export default function BrandModal({
  initialData = null,
  pageTitle = 'Add New Brand'
}: BrandModalProps) {
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
        <Plus className='w-4 h-4 mr-2' />
        {initialData ? 'Edit Brand' : 'Add New Brand'}
      </button>

      <Modal
        title={initialData ? 'Edit Brand' : pageTitle}
        description={
          initialData
            ? 'Update the brand details below.'
            : 'Fill in the details below to add a new brand.'
        }
        isOpen={isModalOpen}
        onClose={handleModalClose}
        size='xl'
      >
        <BrandForm
          closeModal={handleModalClose}
          initialData={initialData || null}
          isEdit={!!initialData}
        />
      </Modal>
    </>
  );
}