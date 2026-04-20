/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";
import { PaginationParams } from "./store";
import { ISell } from "@/models/Sell";

interface SellsResponse {
  success: boolean;
  count: number;
  sells: ISell[];
}

// ✅ Get all sells with pagination + filters
export const getAllSells = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate,
}: PaginationParams = {}): Promise<{
  data: ISell[];
  totalCount: number;
  success?: boolean;
}> => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) {
      query.append("startDate", startDate);
    }
    if (endDate) {
      query.append("endDate", endDate);
    }

    const url = `/sells?${query}`;
    const response = await axiosInstance.get<SellsResponse>(url);

    return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};
export const getAllSellsuserBased = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate,
}: PaginationParams = {}): Promise<{
  data: ISell[];
  totalCount: number;
  success?: boolean;
}> => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) {
      query.append("startDate", startDate);
    }
    if (endDate) {
      query.append("endDate", endDate);
    }

    const url = `/sells/user/based/web?${query}`;
    const response = await axiosInstance.get<SellsResponse>(url);
    return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};
export const getAllSellsstoregetAll = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate,
}: PaginationParams = {}): Promise<{
  data: ISell[];
  totalCount: number;
  success?: boolean;
}> => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) {
      query.append("startDate", startDate);
    }
    if (endDate) {
      query.append("endDate", endDate);
    }

    const url = `/sells/store/getAll/web?${query}`;
    const response = await axiosInstance.get<SellsResponse>(url);
    return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ Get sells (simple version)
export const getSells = async () => {
  try {
    const response = await axiosInstance.get(`/sells`);
    return response.data.sells as ISell[];
  } catch (error) {
    throw error;
  }
};

// ✅ Get sell by ID
export const getSellById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/sells/${id}`);
    return response.data.sell as ISell;
  } catch (error) {
    throw error;
  }
};
export const getSellByIds = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/sells/${id}`);
    return response.data.sell as ISell;
  } catch (error) {
    throw error;
  }
};
// ✅ Get sell by ID but user-based
export const getSellByIdByUser = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/sells/${id}/user/based`);
    return response.data.sell as ISell;
  } catch (error) {
    throw error;
  }
};
export const unlockSellById = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/sells/With/Lock/${id}`);
    return response.data; // You might want to specify a return type based on what your API returns
  } catch (error) {
    throw error;
  }
};
export const getSellId = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/sells/${id}`);
    return response.data.sell as ISell;
  } catch (error) {
    throw error;
  }
};

// ✅ Create a sell
export const createSell = async (data: any) => {
  try {
    const response = await axiosInstance.post(`/sells`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Update a sell
export const updateSell = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/sells/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
// service/Sell.ts
export const uploadSellFiles = async (
  id: string,
  data: FormData,
) => {
  try {

    const response = await axiosInstance.put(
      `/sell/${id}/upload/file`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Delete a sell
export const deleteSell = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/sells/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Deliver ALL items of a sale
// ✅ Deliver ALL items of a sale with batch assignment
export const deliverAllSaleItems = async (
  id: string,
  deliveryData: DeliveryData,
) => {
  try {
    const response = await axiosInstance.patch(`/sells/deliver/all/${id}`, {
      deliveryData,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Complete Sale Delivery with batch assignment
export const completeSaleDelivery = async (
  id: string,
  deliveryData: DeliveryData,
) => {
  try {
    const response = await axiosInstance.patch(`/sells/deliver/${id}`, {
      deliveryData,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Partial Sale Delivery with batch assignment
export const partialSaleDelivery = async (
  id: string,
  deliveryData: DeliveryData,
) => {
  try {
    const response = await axiosInstance.patch(`/sells/partial/deliver/${id}`, {
      deliveryData,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Types for batch delivery data
export interface DeliveryData {
  items: DeliveryItem[];
}

export interface DeliveryItem {
  itemId: string;
  givenQuantity?: number;

}

export interface BatchAssignment {
  batchId: string;
  quantity: number;
}

// ✅ Update Sale Status
export const updateSaleStatus = async (id: string, newStatus: string) => {
  try {
    const response = await axiosInstance.patch(`/sells/${id}/status`, {
      newStatus,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Update Payment Status
export const updatePaymentStatus = async (
  id: string,
  newPaymentStatus: string,
) => {
  try {
    const response = await axiosInstance.patch(`/sells/${id}/payment-status`, {
      newPaymentStatus,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Cancel Sale
export const cancelSale = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/sells/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};



export const addSellPayment = async (
  sellId: string,
  paymentData: {
    amount: number;
    notes?: string;
  },
) => {
  try {
    const response = await axiosInstance.post(
      `/sells/${sellId}/payments`,
      paymentData
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getSellPaymentHistory = async (
  sellId: string,
) => {
  try {
    const response = await axiosInstance.get(
      `/sells/${sellId}/payments`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};