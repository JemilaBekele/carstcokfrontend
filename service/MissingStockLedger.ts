/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { IProduct } from '@/models/Product';
import { api } from './api';

/**
 * Find all missing stock ledgers across all sales
 */
export const getMissingStockLedgers = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(
      `/stock-ledger-reconciliation/missing`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create missing stock ledger entries for a specific sale
 */
export const createMissingStockLedgerForSale = async (
  saleId: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.post(
      `/stock-ledger-reconciliation/create/${saleId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getProductsall   = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get(`/sell-corrections/products`);
    return response.data.products as any;
  } catch (error) {
    throw error;
  }
};

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

// Get all Products (paginated) getAllProductsallsell
export const getAllProductsallsell = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/sell-corrections/products?${query}`;
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

//delete/stockLedger

export const deleteStockLedgerByIds = async (id: string, req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.delete(`/delete/stockLedger/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};