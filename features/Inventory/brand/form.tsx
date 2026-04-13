/* eslint-disable @next/next/no-img-element */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IBrand } from '@/models/brand';
import { createBrand, updateBrand } from '@/service/brand';

//
// Validation Schema
//
const formSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
});

interface BrandFormProps {
  initialData: IBrand | null;
  closeModal: () => void;
  isEdit?: boolean;
}

//
// Brand Form Component
//
export default function BrandForm({
  initialData,
  closeModal,
  isEdit = false
}: BrandFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
    }
  });

  //
  // Submit handler
  //
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      if (isEdit && initialData?.id) {
        await updateBrand(initialData.id, { name: data.name });
        toast.success('Brand updated successfully');
      } else {
        await createBrand({ name: data.name });
        toast.success('Brand created successfully');
      }

      router.refresh();
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error('Error saving brand');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-left">
          {isEdit ? 'Edit Brand' : 'Create Brand'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Samsung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Saving...'
                  : isEdit
                  ? 'Update Brand'
                  : 'Create Brand'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}