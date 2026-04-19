import { axiosInstance } from "./axiosIntance";
import { ICategory, ISubCategory } from "@/models/Category";

// Generic Pagination Params
export interface GetParams {
  page?: number;
  limit?: number;
}

// ========================= CATEGORIES ========================= //

// Get all categories
interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: ICategory[];
}

export const getAllCategories = async ({
  page = 1,
  limit = 10,
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `categories?${query}`;
    const response = await axiosInstance.get<CategoriesResponse>(url);
    const categories = response.data.categories;

    return {
      categories,
      totalCount: response.data.count ?? categories.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};
export const getCategoriesapi = async () => {
  try {
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data.category as ICategory;
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (data: Partial<ICategory>) => {
  try {
    const response = await axiosInstance.post(`/categories`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (id: string, data: Partial<ICategory>) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
