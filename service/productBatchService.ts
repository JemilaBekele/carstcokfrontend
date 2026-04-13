/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { api } from './api';
import { TransferEntityType } from '@/models/transfer';

// Pagination + filters
export interface ProductBatchParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Response type
interface ProductBatchResponse {
  success: boolean;
  count: number;
  productBatches: any[];
}

// ✅ Get all product batches
export const getAllProductBatches = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: ProductBatchParams = {}): Promise<{
  data: any[];
  totalCount: number;
  success?: boolean;
}> => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const url = `/product-batches?${query}`;

    const response = await api.get<ProductBatchResponse>(url);

    return {
      data: response.data.productBatches,
      totalCount: response.data.count ?? response.data.productBatches.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// ✅ Get product batch by ID
export const getProductBatchById = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = req ? axiosWithAuth(req) : api;
    const response = await axiosInstance.get(`/product-batches/${id}`);
    return response.data.batch as any;
  } catch (error) {
    throw error;
  }
};
export const getProductBatchId = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/product-batches/${id}`);
    return response.data.batch as any;
  } catch (error) {
    throw error;
  }
};
export const getProductInfoByBatchId = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(
      `/product-batches/product/${id}/info`
    );
    return response.data.product; // { id, name }
  } catch (error) {
    throw error;
  }
};
// Add this function to your service layer
// Add this function to your service layer
export const getAvailableProductsBySource = async (
  sourceType: TransferEntityType,
  sourceId: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    let response;
    if (sourceType === TransferEntityType.STORE) {
      response = await axiosInstance.get(
        `/find/store/${sourceId}/stock/product`
      );
    } else {
      response = await axiosInstance.get(
        `/find/shop/${sourceId}/stock/product`
      );
    }

    // Handle the response structure - return the full store stock items
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data; // Return the full store stock items with batch info
    } else if (Array.isArray(response.data)) {
      return response.data; // Direct array response (fallback)
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

// ✅ Create product batch
export const createProductBatch = async (
  data: Partial<any> | FormData,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/product-batches`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Update product batch
export const updateProductBatch = async (
  id: string,
  data: Partial<any> | FormData,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(
      `/product-batches/${id}`,
      data,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateShopStock = async (
  shopId: string,
  batchId: string,
  quantity: number,
  unitOfMeasureId?: string | null,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.put(
      `/update/shops/${shopId}/batches/${batchId}/stock`,
      {
        quantity,
        unitOfMeasureId: unitOfMeasureId || null,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
// ✅ Delete product batch
export const deleteProductBatch = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.delete(`/product-batches/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
