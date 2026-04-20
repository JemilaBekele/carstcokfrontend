/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Add this import
import { IStore } from '@/models/store';
import { IShop } from '@/models/shop';
import { getStores } from '@/service/store';
import { getShopsall } from '@/service/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy, Store, ShoppingBag } from 'lucide-react';
import { createProductstock } from '@/service/Product';

interface ProductStockFormProps {
  productId?: string; // Make it optional since we'll get from URL
}

interface StockFormData {
  locationType: 'store' | 'shop';
  storeId?: string;
  shopId?: string;
  pieceQuantity: number;
  boxQuantity: number;
  notes?: string;
}

const ProductStockForm: React.FC<ProductStockFormProps> = ({ productId: propProductId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get productId from URL query param if not provided as prop
  const productId = propProductId || searchParams.get('id');
  
  const [stocks, setStocks] = useState<StockFormData[]>([
    {
      locationType: 'store',
      storeId: '',
      pieceQuantity: 0,
      boxQuantity: 0,
      notes: ''
    }
  ]);

  const [stores, setStores] = useState<IStore[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const [storesResponse, shopsResponse] = await Promise.all([
          getStores(),
          getShopsall()
        ]);
        setStores(storesResponse);
        setShops(shopsResponse);
      } catch {
        setError('Failed to load stores and shops');
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Add validation for productId on mount
  useEffect(() => {
    if (!productId) {
      setError('Product ID is missing from the URL');
    }
  }, [productId]);

  const handleStockChange = (index: number, field: string, value: any) => {
    setStocks(prev =>
      prev.map((stock, i) => {
        if (i === index) {
          const updated = { ...stock, [field]: value };
          if (field === 'locationType') {
            updated.storeId = undefined;
            updated.shopId = undefined;
          }
          return updated;
        }
        return stock;
      })
    );
  };

  const addStock = () => {
    setStocks(prev => [
      ...prev,
      {
        locationType: 'store',
        storeId: '',
        pieceQuantity: 0,
        boxQuantity: 0,
        notes: ''
      }
    ]);
  };

  const removeStock = (index: number) => {
    if (stocks.length > 1) {
      setStocks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateStock = (index: number) => {
    const copy = { 
      ...stocks[index], 
      storeId: stocks[index].locationType === 'store' ? '' : undefined,
      shopId: stocks[index].locationType === 'shop' ? '' : undefined
    };
    setStocks(prev => [...prev, copy]);
  };

  const validateStocks = (): boolean => {
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      
      if (stock.locationType === 'store' && !stock.storeId) {
        setError(`Stock ${i + 1}: Please select a store`);
        return false;
      }
      if (stock.locationType === 'shop' && !stock.shopId) {
        setError(`Stock ${i + 1}: Please select a shop`);
        return false;
      }
      
      if (stock.pieceQuantity <= 0 && stock.boxQuantity <= 0) {
        setError(`Stock ${i + 1}: Please enter either piece quantity or box quantity (greater than 0)`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!productId) {
      setError('Product ID is missing. Please ensure the URL contains ?id=...');
      return;
    }
    
    if (!validateStocks()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const stocksData = stocks.map(stock => ({
        ...(stock.locationType === 'store' 
          ? { storeId: stock.storeId } 
          : { shopId: stock.shopId }),
        pieceQuantity: stock.pieceQuantity || 0,
        boxQuantity: stock.boxQuantity || 0,
        notes: stock.notes || undefined
      }));

      
      await createProductstock(productId, stocksData);

      const totalEntries = stocks.length;
      setSuccess(`Successfully added stock to ${totalEntries} location(s)`);
      
      setTimeout(() => {
        router.push('/dashboard/Products');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Error details:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to add stock');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingLocations && stores.length === 0 && shops.length === 0) {
    return (
      <Card className='mx-auto w-full'>
        <CardContent className='py-8'>
          <div className='text-center'>Loading stores and shops...</div>
        </CardContent>
      </Card>
    );
  }

  if (!productId) {
    return (
      <Card className='mx-auto w-full'>
        <CardContent className='py-8'>
          <Alert variant='destructive'>
            <AlertDescription>
              Product ID is missing. Please ensure you&apos;re accessing this page with a valid product ID in the URL.
              <br />
              <br />
              Expected URL format: /dashboard/Products/ProductBatch?id=PRODUCT_ID
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
          <span>Add Initial Stock</span>
          <Button onClick={addStock} variant='outline' size='sm'>
            <Plus className='mr-2 h-4 w-4' /> Add Location
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='border-green-200 bg-green-50 mb-4'>
            <AlertDescription className='text-green-800'>
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {stocks.map((stock, i) => (
            <div key={i} className='border p-4 rounded-lg space-y-4'>
              {/* ... rest of your form JSX remains the same ... */}
              <div className='flex justify-between items-start'>
                <h3 className='font-semibold'>Entry {i + 1}</h3>
                <div className='flex gap-2'>
                  <Button 
                    type='button' 
                    size='sm' 
                    variant='outline'
                    onClick={() => duplicateStock(i)}
                  >
                    <Copy className='h-4 w-4 mr-1' /> Duplicate
                  </Button>
                  {stocks.length > 1 && (
                    <Button
                      type='button'
                      size='sm'
                      variant='destructive'
                      onClick={() => removeStock(i)}
                    >
                      <Trash2 className='h-4 w-4 mr-1' /> Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Location Type Selection */}
              <div className='space-y-2'>
                <Label>Location Type *</Label>
                <div className='flex gap-4'>
                  <Button
                    type='button'
                    variant={stock.locationType === 'store' ? 'default' : 'outline'}
                    onClick={() => handleStockChange(i, 'locationType', 'store')}
                    className='flex-1'
                  >
                    <Store className='mr-2 h-4 w-4' />
                    Store
                  </Button>
                  <Button
                    type='button'
                    variant={stock.locationType === 'shop' ? 'default' : 'outline'}
                    onClick={() => handleStockChange(i, 'locationType', 'shop')}
                    className='flex-1'
                  >
                    <ShoppingBag className='mr-2 h-4 w-4' />
                    Shop
                  </Button>
                </div>
              </div>

              {/* Store Selection */}
              {stock.locationType === 'store' && (
                <div className='space-y-2'>
                  <Label>Store *</Label>
                  <Select
                    value={stock.storeId}
                    onValueChange={v => handleStockChange(i, 'storeId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select Store' />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Shop Selection */}
              {stock.locationType === 'shop' && (
                <div className='space-y-2'>
                  <Label>Shop *</Label>
                  <Select
                    value={stock.shopId}
                    onValueChange={v => handleStockChange(i, 'shopId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select Shop' />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quantity Section */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label>Piece Quantity</Label>
                  <Input
                    type='number'
                    min='0'
                    value={stock.pieceQuantity || ''}
                    onChange={e =>
                      handleStockChange(i, 'pieceQuantity', parseInt(e.target.value) || 0)
                    }
                    placeholder='Number of pieces'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Individual pieces
                  </p>
                </div>

                <div>
                  <Label>Box Quantity</Label>
                  <Input
                    type='number'
                    min='0'
                    value={stock.boxQuantity || ''}
                    onChange={e =>
                      handleStockChange(i, 'boxQuantity', parseInt(e.target.value) || 0)
                    }
                    placeholder='Number of boxes'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Boxes (will be converted to pieces if product has box size)
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={stock.notes || ''}
                  onChange={e => handleStockChange(i, 'notes', e.target.value)}
                  placeholder='Add any notes about this stock entry...'
                  rows={2}
                />
              </div>
            </div>
          ))}

          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductStockForm;