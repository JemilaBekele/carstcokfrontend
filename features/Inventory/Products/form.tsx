/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm, useFieldArray } from 'react-hook-form';
import { createProduct, updateProduct } from '@/service/Product';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { IProduct } from '@/models/Product';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Select, { SingleValue } from 'react-select';
import { Modal } from '@/components/ui/modal';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { IShop } from '@/models/shop';
import { IBrand } from '@/models/brand';
import { getBrands } from '@/service/brand';

interface ProductFormValues {
  productCode: string;
  name: string;
  generic?: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  UnitOfMeasure?: string;
  sellPrice: number | null;
  imageUrl: string;
  hasBox: boolean;
  boxSize?: number | null;
  isActive: boolean;
  additionalPrices: {
    label: string;
    price: number;
    shopId?: string;
  }[];
}

interface SelectOption {
  value: string;
  label: string;
}

interface ProductFormProps {
  initialData: IProduct | null;
  pageTitle: string;
  categories?: { id: string; name: string }[];
  subCategories?: { id: string; name: string; categoryId: string }[];
  shops?: IShop[];
}

export default function ProductForm({
  initialData,
  pageTitle,
  categories = [],
  shops: initialShops = []
}: ProductFormProps) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);

  // Use shops directly from props
  const shops = initialShops;

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoadingBrands(true);
        const fetchedBrands = await getBrands();
        setBrands(fetchedBrands || []);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
        toast.error('Failed to load brands');
      } finally {
        setIsLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      productCode: initialData?.productCode || '',
      name: initialData?.name || '',
      generic: initialData?.generic || '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || '',
      brandId: initialData?.brandId || '',
      UnitOfMeasure: initialData?.UnitOfMeasure || '',
      sellPrice: initialData?.sellPrice || null,
      imageUrl: initialData?.imageUrl || '',
      hasBox: initialData?.hasBox ?? false,
      boxSize: initialData?.boxSize || null,
      isActive: initialData?.isActive ?? true,
      additionalPrices: initialData?.AdditionalPrice?.map((price, index) => ({
        label: price.label || `Label ${index + 1}`,
        price: price.price,
        shopId: price.shopId || ''
      })) || [
        { label: 'Label 1', price: 0, shopId: '' },
        { label: 'Label 2', price: 0, shopId: '' }
      ]
    }),
    [initialData]
  );

  const form = useForm<ProductFormValues>({
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'additionalPrices'
  });

  // Handle image preview
  useEffect(() => {
    if (initialData?.imageUrl) {
      setPreviewImage(initialData.imageUrl);
    } else {
      setPreviewImage(null);
    }
  }, [initialData]);

  const brandOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'None' },
      ...(brands || []).map((brand) => ({
        value: brand.id,
        label: brand.name
      }))
    ],
    [brands]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => (categories || []).map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const shopOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'None' },
      ...(shops || []).map((shop) => ({
        value: shop.id,
        label: shop.name
      }))
    ],
    [shops]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      form.setValue('imageUrl', file.name);
    } else {
      if (initialData?.imageUrl) {
        setPreviewImage(initialData.imageUrl);
      }
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const formData = new FormData();

      // Convert boolean values properly
      const processedData = {
        ...data,
        isActive:
          typeof data.isActive === 'string'
            ? data.isActive === 'true'
            : Boolean(data.isActive),
        hasBox: Boolean(data.hasBox),
        boxSize: data.hasBox ? data.boxSize : null
      };

      const { additionalPrices, ...formValues } = processedData;

      // Append main product data
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append additional prices
      additionalPrices.forEach((price, index) => {
        if (price.label && price.price > 0) {
          formData.append(`additionalPrices[${index}][label]`, price.label);
          formData.append(
            `additionalPrices[${index}][price]`,
            price.price.toString()
          );
          if (price.shopId) {
            formData.append(`additionalPrices[${index}][shopId]`, price.shopId);
          }
        }
      });

      const imageInput = document.getElementById('image') as HTMLInputElement;
      if (imageInput?.files?.[0]) {
        formData.append('image', imageInput.files[0]);
      }

      setIsUploading(true);

      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
        toast.success('Product updated successfully');
        router.push(`/dashboard/Products`);
      } else {
        const createdProduct = await createProduct(formData);
        toast.success('Product created successfully');
        router.push(
          `/dashboard/Products`
        );
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving product');
    } finally {
      setIsUploading(false);
    }
  };

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    input: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  const addAdditionalPrice = () => {
    const newIndex = fields.length + 1;
    append({
      label: `Label ${newIndex}`,
      price: 0,
      shopId: ''
    });
  };

  // Watch hasBox to conditionally show boxSize field
  const hasBox = form.watch('hasBox');

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Left Column */}
                <div className='space-y-4'>
                  <FormField
                    name='productCode'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., PRD001' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='name'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Paracetamol 500mg'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='generic'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generic Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., Acetaminophen' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='description'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Product description...'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='sellPrice'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard Sell Price</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='Enter sell price'
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === '' ? null : parseFloat(value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Box Support Section */}
                  <FormField
                    control={form.control}
                    name='hasBox'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                        <div className='space-y-0.5'>
                          <FormLabel>Has Box/Packaging</FormLabel>
                          <div className='text-muted-foreground text-sm'>
                            {field.value
                              ? 'Product is sold in boxes/packs'
                              : 'Product is sold individually'}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {hasBox && (
                    <FormField
                      name='boxSize'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Box Size (Quantity per Box)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              placeholder='e.g., 12'
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === '' ? null : parseInt(value)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Active Status Switch */}
                  <FormField
                    control={form.control}
                    name='isActive'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                        <div className='space-y-0.5'>
                          <FormLabel>Product Status</FormLabel>
                          <div className='text-muted-foreground text-sm'>
                            {field.value
                              ? 'Product is active and visible'
                              : 'Product is inactive and hidden'}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  <FormField
                    name='UnitOfMeasure'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Tablet, Capsule, Bottle'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name='categoryId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            options={categoryOptions}
                            onChange={(option) => field.onChange(option?.value)}
                            value={
                              categoryOptions.find(
                                (c) => c.value === field.value
                              ) || null
                            }
                            placeholder='Select a category'
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name='brandId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand (Optional)</FormLabel>
                        <FormControl>
                          <Select
                            options={brandOptions}
                            onChange={(option) => field.onChange(option?.value)}
                            value={
                              brandOptions.find(
                                (b) => b.value === field.value
                              ) || null
                            }
                            placeholder={
                              isLoadingBrands
                                ? 'Loading brands...'
                                : 'Select a brand'
                            }
                            isDisabled={isLoadingBrands}
                            isClearable
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload Section */}
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className='flex flex-col gap-4'>
                      {previewImage && (
                        <div className='relative h-48 w-full overflow-hidden rounded-md border'>
                          <Image
                            src={previewImage}
                            alt='Product preview'
                            fill
                            className='object-contain'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <Input
                        id='image'
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                      />
                      {initialData?.imageUrl && !previewImage && (
                        <p className='text-muted-foreground text-sm'>
                          Current image: {initialData.imageUrl}
                        </p>
                      )}
                    </div>
                    <FormMessage>
                      {form.formState.errors.imageUrl?.message}
                    </FormMessage>
                  </FormItem>
                </div>
              </div>

              {/* Additional Prices Section */}
              <div className='border-t pt-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <CardTitle className='text-lg'>Additional Prices</CardTitle>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addAdditionalPrice}
                    className='flex items-center gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Add Price
                  </Button>
                </div>

                <div className='space-y-4'>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-12'
                    >
                      {/* Label Input - 3 columns */}
                      <div className='md:col-span-3'>
                        <FormField
                          control={form.control}
                          name={`additionalPrices.${index}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Label</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`Label ${index + 1}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Price Input - 3 columns */}
                      <div className='md:col-span-3'>
                        <FormField
                          control={form.control}
                          name={`additionalPrices.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  min='0'
                                  placeholder='0.00'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Shop Select - 4 columns */}
                      <div className='md:col-span-4'>
                        <FormField
                          control={form.control}
                          name={`additionalPrices.${index}.shopId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shop (Optional)</FormLabel>
                              <FormControl>
                                <Select
                                  options={shopOptions}
                                  value={
                                    shopOptions.find(
                                      (option) => option.value === field.value
                                    ) || shopOptions[0]
                                  }
                                  onChange={(selectedOption) => {
                                    field.onChange(selectedOption?.value || '');
                                  }}
                                  placeholder='Select shop...'
                                  styles={isDark ? darkStyles : {}}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Remove Button - 2 columns */}
                      <div className='md:col-span-2'>
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          className='w-full'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full md:w-auto'
                  disabled={isUploading}
                >
                  {isUploading
                    ? 'Uploading...'
                    : initialData
                      ? 'Update Product'
                      : 'Create Product'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}