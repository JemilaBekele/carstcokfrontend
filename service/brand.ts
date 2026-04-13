/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { api } from './api';
import { GetParams } from './roleService';
import { IBrand } from '@/models/brand';

// Get all brands (paginated)
interface BrandsResponse {
  success: boolean;
  count: number;
  brands: IBrand[];
}

export const getAllBrands = async ({
  page = 1,
  limit = 10,
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `brands?${query}`;

    const response = await api.get<BrandsResponse>(url);
    const brands = response.data.brands;

    return {
      brands,
      totalCount: response.data.count ?? brands.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

// Get brands (SSR / server-side)
export const getBrands = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/brands`);
    return response.data.brands as IBrand[];
  } catch (error) {
    throw error;
  }
};

export const getTopBrands = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/brands?limit=10`);
    return response.data.brands as IBrand[];
  } catch (error) {
    throw error;
  }
};

// Get brand by ID
export const getBrandById = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = req ? axiosWithAuth(req) : api;
    const response = await axiosInstance.get(`/brands/${id}`);
    return response.data.brand as IBrand;
  } catch (error) {
    throw error;
  }
};

// Create brand
export const createBrand = async (
  data: Partial<IBrand>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    
    const response = await axiosInstance.post(`/brands`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
};

// Update brand
export const updateBrand = async (
  id: string,
  data: Partial<IBrand>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    
    const response = await axiosInstance.put(`/brands/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating brand:', error);
    throw error;
  }
};

// Delete brand
export const deleteBrand = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.delete(`/brands/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};








