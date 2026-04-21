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
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

import { Switch } from '@/components/ui/switch';
import { IShop } from '@/models/shop';
import { IBrand } from '@/models/brand';
import { getBrands } from '@/service/brand';
import { Plus, Trash2 } from 'lucide-react';
import { getUnitsOfMeasure } from '@/service/UnitOfMeasure';

interface IUnitOfMeasure {
  id: string;
  name: string;
  symbol?: string;
}

interface ProductFormValues {
  productCode: string;
  name: string;
  generic?: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;
  numberunitOfMeasure?: number;
  sellPrice: number | null;
  imageUrl: string;
  hasBox: boolean;
  boxSize?: number | null;
  isActive: boolean;
  viscosity?: string;
  oilType?: string;
  additiveType?: string;
  warningQuantity?: number | null;
  additionalPrices: {
    label: string;
    price: number;
    shopId?: string;
    isBox: boolean;
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
  const [unitOfMeasures, setUnitOfMeasures] = useState<IUnitOfMeasure[]>([]);
  const [isLoadingUnitOfMeasures, setIsLoadingUnitOfMeasures] = useState(false);

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

  // Fetch unit of measures on component mount
  useEffect(() => {
    const fetchUnitOfMeasures = async () => {
      try {
        setIsLoadingUnitOfMeasures(true);
        const fetchedUnits = await getUnitsOfMeasure();
        setUnitOfMeasures(fetchedUnits || []);
      } catch (error) {
        console.error('Failed to fetch unit of measures:', error);
        toast.error('Failed to load unit of measures');
      } finally {
        setIsLoadingUnitOfMeasures(false);
      }
    };
    fetchUnitOfMeasures();
  }, []);

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      productCode: initialData?.productCode || '',
      name: initialData?.name || '',
      generic: initialData?.generic || '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || '',
      brandId: initialData?.brandId || '',
      unitOfMeasureId: initialData?.unitOfMeasureId || '',
      numberunitOfMeasure: initialData?.numberunitOfMeasure || undefined,
      sellPrice: initialData?.sellPrice || null,
      imageUrl: initialData?.imageUrl || '',
      hasBox: initialData?.hasBox ?? false,
      boxSize: initialData?.boxSize || null,
      isActive: initialData?.isActive ?? true,
      viscosity: initialData?.viscosity || '',
      oilType: initialData?.oilType || '',
      additiveType: initialData?.additiveType || '',
      warningQuantity: initialData?.warningQuantity || null,
      additionalPrices: initialData?.AdditionalPrice?.map((price, index) => ({
        label: price.label || `Label ${index + 1}`,
        price: price.price,
        shopId: price.shopId || '',
        isBox: price.isBox ?? false
      })) || [
        { label: 'Label 1', price: 0, shopId: '', isBox: false },
        { label: 'Label 2', price: 0, shopId: '', isBox: false }
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

  const unitOfMeasureOptions: SelectOption[] = useMemo(
    () => (unitOfMeasures || []).map((unit) => ({
      value: unit.id,
      label: `${unit.name} (${unit.symbol})`
    })),
    [unitOfMeasures]
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

  // Viscosity options
  const viscosityOptions: SelectOption[] = [
    { value: '0W-16', label: '0W-16' },
    { value: '0W-20', label: '0W-20' },
    { value: '0W-30', label: '0W-30' },
    { value: '0W-40', label: '0W-40' },
    { value: '5W-20', label: '5W-20' },
    { value: '5W-30', label: '5W-30' },
    { value: '5W-40', label: '5W-40' },
    { value: '5W-50', label: '5W-50' },
    { value: '10W-30', label: '10W-30' },
    { value: '10W-40', label: '10W-40' },
    { value: '10W-50', label: '10W-50' },
    { value: '10W-60', label: '10W-60' },
    { value: '15W-40', label: '15W-40' },
    { value: '15W-50', label: '15W-50' },
    { value: '20W-20', label: '20W-20' },
    { value: '20W-50', label: '20W-50' },
    { value: '75W-80', label: '75W-80' },
    { value: '75W-90', label: '75W-90' },
    { value: '75W-140', label: '75W-140' },
    { value: '80W-90', label: '80W-90' },
    { value: '85W-90', label: '85W-90' },
    { value: '85W-140', label: '85W-140' },
    { value: '0W-8', label: '0W-8' },
    { value: '25W-40', label: '25W-40' },
    { value: '75W-85', label: '75W-85' },
    { value: '10', label: '10' },
    { value: '100', label: '100' },
    { value: '10W', label: '10W' },
    { value: '140', label: '140' },
    { value: '15', label: '15' },
    { value: '150', label: '150' },
    { value: '15w', label: '15w' },
    { value: '22', label: '22' },
    { value: '220', label: '220' },
    { value: '30', label: '30' },
    { value: '32', label: '32' },
    { value: '40', label: '40' },
    { value: '46', label: '46' },
    { value: '50', label: '50' },
    { value: '5w', label: '5w' },
    { value: '68', label: '68' },
    { value: '7,5W', label: '7,5W' },
    { value: '70w75', label: '70w75' },
    { value: '75w', label: '75w' },
    { value: '80w', label: '80w' },
    { value: '90', label: '90' },
    { value: 'other', label: 'other' }
  ];
  
  // Oil Type options
  const oilTypeOptions: SelectOption[] = [
    { value: 'Fully Synthetic', label: 'Fully Synthetic' },
    { value: 'Synthetic technology', label: 'Synthetic technology' },
    { value: 'Semi Synthetic', label: 'Semi Synthetic' },
    { value: 'Mineral-based', label: 'Mineral-based' },
    { value: 'Advanced full synthetic', label: 'Advanced full synthetic' },
    { value: 'Synthetic Blend', label: 'Synthetic Blend' },
    { value: 'other', label: 'other' }
  ];

  // Additive Type options
  const additiveTypeOptions: SelectOption[] = [
    { value: 'Gasoline additive', label: 'Gasoline additive' },
    { value: 'Diesel additive', label: 'Diesel additive' },
    { value: 'Oil additive', label: 'Oil additive' },
    { value: 'Radiator Additive', label: 'Radiator Additive' },
    { value: 'other', label: 'other' }
  ];

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
        boxSize: data.hasBox ? data.boxSize : null,
        warningQuantity: data.warningQuantity ? Number(data.warningQuantity) : null,
        numberunitOfMeasure: data.numberunitOfMeasure ? Number(data.numberunitOfMeasure) : null
      };

      const { additionalPrices, ...formValues } = processedData;

      // Ensure description is included even if empty
      const descriptionValue = formValues.description || '';
      
      // Append main product data
      const importantFields = ['description', 'generic', 'viscosity', 'oilType', 'additiveType', 'unitOfMeasureId', 'numberunitOfMeasure'];
      
      Object.entries(formValues).forEach(([key, value]) => {
        // For important fields, always send them (even if empty)
        if (importantFields.includes(key)) {
          const finalValue = value || '';
          formData.append(key, String(finalValue));
        }
        // For other fields, only send if they have values
        else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      // Append additional prices with isBox field
      additionalPrices.forEach((price, index) => {
        if (price.label && price.price > 0) {
          formData.append(`additionalPrices[${index}][label]`, String(price.label));
          formData.append(
            `additionalPrices[${index}][price]`,
            String(price.price)
          );
          if (price.shopId) {
            formData.append(`additionalPrices[${index}][shopId]`, String(price.shopId));
          }
          formData.append(`additionalPrices[${index}][isBox]`, String(price.isBox));
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
          `/dashboard/Products/ProductBatch?id=${createdProduct.product.id}`
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
      color: '#f9fafb',
      ':active': {
        backgroundColor: '#4b5563'
      }
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
      shopId: '',
      isBox: false
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
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
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
                            placeholder='e.g., Engine Oil 5W-30'
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

                  {/* Warning Quantity */}
                  <FormField
                    name='warningQuantity'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warning Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            placeholder='Enter warning quantity threshold'
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
                  {/* Unit of Measure Selection */}
                  <FormField
                    name='unitOfMeasureId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <FormControl>
                          <Select
                            options={unitOfMeasureOptions}
                            onChange={(option) => field.onChange(option?.value)}
                            value={
                              unitOfMeasureOptions.find(
                                (u) => u.value === field.value
                              ) || null
                            }
                            placeholder={
                              isLoadingUnitOfMeasures
                                ? 'Loading units...'
                                : 'Select unit of measure'
                            }
                            isDisabled={isLoadingUnitOfMeasures}
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Number of Unit of Measure */}
                  <FormField
                    name='numberunitOfMeasure'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Units</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            step='1'
                            placeholder='e.g., 1, 2, 5'
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === '' ? undefined : parseInt(value)
                              );
                            }}
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

                  {/* Viscosity Selection */}
                  <FormField
                    name='viscosity'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Viscosity</FormLabel>
                        <FormControl>
                          <Select
                            options={viscosityOptions}
                            onChange={(option) => field.onChange(option?.value || '')}
                            value={
                              viscosityOptions.find(
                                (v) => v.value === field.value
                              ) || null
                            }
                            placeholder='Select viscosity grade'
                            isClearable
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Oil Type Selection */}
                  <FormField
                    name='oilType'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oil Type</FormLabel>
                        <FormControl>
                          <Select
                            options={oilTypeOptions}
                            onChange={(option) => field.onChange(option?.value || '')}
                            value={
                              oilTypeOptions.find(
                                (o) => o.value === field.value
                              ) || null
                            }
                            placeholder='Select oil type'
                            isClearable
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additive Type Selection */}
                  <FormField
                    name='additiveType'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additive Type</FormLabel>
                        <FormControl>
                          <Select
                            options={additiveTypeOptions}
                            onChange={(option) => field.onChange(option?.value || '')}
                            value={
                              additiveTypeOptions.find(
                                (a) => a.value === field.value
                              ) || null
                            }
                            placeholder='Select additive type'
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

              {/* Additional Prices Section - Fully Responsive */}
              <div className='border-t pt-6'>
                <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                  <CardTitle className='text-lg'>Additional Prices</CardTitle>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addAdditionalPrice}
                    className='flex items-center gap-2 w-full sm:w-auto'
                  >
                    <Plus className='h-4 w-4' />
                    Add Price
                  </Button>
                </div>

                <div className='space-y-4'>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className='rounded-lg border p-4 space-y-4'
                    >
                      {/* Label - Full width on mobile */}
                      <div>
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

                      {/* Price and isBox - Side by side on mobile */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
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

                        <div>
                          <FormField
                            control={form.control}
                            name={`additionalPrices.${index}.isBox`}
                            render={({ field }) => (
                              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 h-full'>
                                <div className='space-y-0.5'>
                                  <FormLabel className='text-sm'>Type</FormLabel>
                                  <div className='text-muted-foreground text-xs'>
                                    {field.value ? 'Box' : 'Piece'}
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
                      </div>

                      {/* Shop Select - Full width */}
                      <div>
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

                      {/* Remove Button - Full width on mobile */}
                      <div>
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          className='w-full'
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          Remove
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