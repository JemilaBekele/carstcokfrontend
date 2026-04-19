/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { api } from './api';
import { IProduct } from '@/models/Product';

export interface GetParams {
  page?: number;
  limit?: number;
}

// Response for getAll
interface ProductsResponse {
  success: boolean;
  count: number;
  products: IProduct[];
}

// Get all Products (paginated)
export const getAllProducts = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/products?${query}`;
    const response = await api.get<ProductsResponse>(url);
    const products = response.data.products;
    return {
      products: products,
      totalCount: response.data.count ?? products.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get Products (SSR-safe)
export const getProducts = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/products`);
    return response.data.products as IProduct[];
  } catch (error) {
    throw error;
  }
};
export const getProductsnew = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = req ? axiosWithAuth(req) : api;

    const response = await axiosInstance.get(`/products`);
    return response.data.products as IProduct[];
  } catch (error) {
    throw error;
  }
};
export const ActivegetProducts = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/products/Active/All`);
    return response.data.products as IProduct[];
  } catch (error) {
    throw error;
  }
};


interface TopProductsOptions {
  searchTerm?: string;
  categoryName?: string;
  brandName?: string;
  req?: IncomingMessage;
}

export const TopProducts = async (options: TopProductsOptions = {}) => {
  try {
    const { searchTerm, categoryName, brandName, req } = options;
    const axiosInstance = axiosWithAuth(req);

    // Build query parameters - using names instead of IDs
    const params: any = {};
    if (searchTerm?.trim()) params.searchTerm = searchTerm.trim();
    if (categoryName?.trim()) params.categoryName = categoryName.trim();
    if (brandName?.trim()) params.brandName = brandName.trim();

    console.log('TopProducts request params:', params);

    const response = await axiosInstance.get(
      `/products/get/all/Top/Selling/Products`,
      {
        params
      }
    );

    console.log('TopProducts response status:', response.status);
    console.log('TopProducts response data count:', response.data?.products?.length || 0);

    // ✅ Extract only the product info from each item
    const products = (response.data?.products || []).map((item: any) => {
      // The product data is nested inside item.product
      const productData = item.product || item;

      return {
        ...productData,
        availableQuantity: item.availableQuantity ?? 0 // Use the availableQuantity from the item, not product
      };
    });

    return products as IProduct[];
  } catch (error) {
    console.error('TopProducts error:', error);
    throw error;
  }
};

// Get Product by ID /api/
export const getProductById = async (id: string) => {
  try {
    // const axiosInstance = req ? axiosWithAuth(req) : api;
    const response = await api.get(`/products/${id}`);
    return response.data.product as IProduct;
  } catch (error) {
    throw error;
  }
};
export const createProductstock = async (
  productId: string,
  data: any | FormData,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(
      `/products/${productId}/stocks`,
      data,
      config
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Product by Code
export const getProductByCode = async (code: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = req ? axiosWithAuth(req) : api;
    const response = await axiosInstance.get(`/products/code/${code}`);
    return response.data.product as IProduct;
  } catch (error) {
    throw error;
  }
};

// Create Product
export const createProduct = async (data: any, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/products`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Update Product
export const updateProduct = async (
  id: string,
  data: any,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(`/products/${id}`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete Product
export const deleteProduct = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getProductdetailaById = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/product/detail/${id}`);
    return response.data.product;
  } catch (error) {
    throw error;
  }
};

export const getProductByShops = async (
  productId: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(
      `/products/shop/find/ByShops/${productId}`
    );
    return response.data.products; // ✅ returns array of products with shops
  } catch (error) {
    throw error;
  }
};
