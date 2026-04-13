/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosWithAuth } from './cli';
import { api } from './api';
import { SalesReportResponse } from '@/features/Dasboard/ReportSell/staticgenerate';

// ========================= SELL REPORTS ========================= //

// Sell Trend (Monthly totals)
export interface SellTrend {
  month: string;
  total: number;
}

interface SellTrendResponse {
  success: boolean;
  chartData: SellTrend[];
}

export const getSellTrendApi = async (req?: IncomingMessage) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get<SellTrendResponse>(`/trend`);
    return response.data.chartData;
  } catch (error) {
    throw error;
  }
};

// ========================= TOTAL SOLD ========================= //

interface TotalSoldResponse {
  success: boolean;
  totalSold: number;
  startDate?: string;
  endDate?: string;
}

export const getTotalSold = async (
  params: { startDate?: string; endDate?: string } = {},
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get<TotalSoldResponse>(
      `/total-sold?${query}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTotalSoldApi = async (
  params: { startDate?: string; endDate?: string } = {}
) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await api.get<TotalSoldResponse>(
      `/api/total-sold?${query}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================= ALL SELLS ========================= //

export interface SellItem {
  id: string;
  saleDate: string;
  NetTotal: number;
  branch?: any;
  customer?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdBy?: any;
  items?: any[];
  _count?: { items: number };
}

interface AllSellsResponse {
  success: boolean;
  sells: SellItem[];
  count: number;
}

export const getAllSells = async (
  params: {
    startDate?: string;
    endDate?: string;
    createdById?: string;
    customerId?: string;
    branchId?: string;
    saleStatus?: string; // Add saleStatus filter
    itemSaleStatus?: string;
  } = {},
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get<AllSellsResponse>(
      `/trend/all/sell?${query}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSalesReports = async (
  params: {
    startDate?: string;
    endDate?: string;
    shopId?: string;
    limit?: number;
    slowMoveThreshold?: number;
  } = {},
  req?: IncomingMessage
) => {
  try {
    const axiosInstance = axiosWithAuth(req);

    const query = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>
      )
    ).toString();

    const response = await axiosInstance.get<SalesReportResponse>(
      `/reports/sales/rank?${query}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserDashboardSummaryApi = async (
  params: { startDate?: string; endDate?: string; req?: IncomingMessage } = {}
) => {
  try {
    const { req } = params;
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get(`/reports/sales/user/dashboard`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getSalesCreatorDashboardSummaryApi = async (
  params: { req?: IncomingMessage } = {}
) => {
  try {
    const { req } = params;
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get(
      '/reports/sales/user/creator/dashboard'
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch Financial Totals for Dashboard
 */
export const getFinancialTotalsApi = async (
  params: { req?: IncomingMessage } = {}
) => {
  try {
    const { req } = params;
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get('/dashboard/financial-totals');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch Sell Status Pie Chart Data
 */
export const getSellStatusChartApi = async (
  params: { req?: IncomingMessage } = {}
) => {
  try {
    const { req } = params;
    const axiosInstance = axiosWithAuth(req);

    const response = await axiosInstance.get('/dashboard/sell-status-chart');
    return response.data;
  } catch (error) {
    throw error;
  }
};
