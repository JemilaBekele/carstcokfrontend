/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-unresolved */
import { api } from './api';
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { GetParams } from './roleService';
import { ICustomer } from '@/models/customer';

interface CustomerResponse {
  success: boolean;
  count: number;
  customers: ICustomer[];
}

export const getAllCustomers = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/customers?${query}`;
    const response = await api.get<CustomerResponse>(url);
    const customers = response.data.customers;

    return {
      customers,
      totalCount: response.data.count ?? customers.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomer = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.get('/customers');
    return response.data.customers;
  } catch (error) {
    throw error;
  }
};

export const getCustomerById = async (id: string | number) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data.customer;
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (
  customerData: any,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.post('/customers', customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (
  id: string,
  updatedData: Partial<ICustomer>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.put(`/customers/${id}`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCustomer = async (
  id: string | number,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const response = await axiosInstance.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


/**
 * Get customer sells
 */
export const getCustomerSells = async (
  customerId: string,
  params?: Record<string, any>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get(
      `/customers/${customerId}/sells`,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get customer payment summary
 */
export const getCustomerPaymentSummary = async (
  customerId: string,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get(
      `/customers/${customerId}/payment-summary`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplierPurchases = async (
  supplierId: string,
  params?: Record<string, any>,
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get(
      `/suppliers/${supplierId}/purchases`,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};