import { ICategory } from './Category';
import { IShop } from './shop';
import { IBrand } from './brand';

export interface IProduct {
  id: string;
  viscosity?: string;      // 0W-20, 5W-30
  oilType?: string;        // Fully Synthetic, Semi Synthetic
  additiveType?: string; 
    warningQuantity?: number;
  productCode: string;
  name: string;
  generic?: string;
  description?: string;
  // ✅ Oil Fields


  imageUrl?: string;

  sellPrice?: number;

  categoryId: string;
  category: ICategory;

  brandId?: string;
  brand?: IBrand;

  // ✅ Box Support
  hasBox: boolean;
  boxSize?: number;

  // ✅ Unit
  UnitOfMeasure?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  // ✅ Stock Summary
  stockSummary: IStockSummary;

  // ✅ Overall totals
  overallTotals: IOverallTotals;

  // ✅ Additional price
  AdditionalPrice: IAdditionalPrice[];
}

export interface IAdditionalPrice {
  id: string;
  label?: string;
  price: number;
 isBox: boolean; // ✅ Box or Piece

  productId: string;

  shopId?: string;
  shop?: IShop;

  createdAt: string;
  updatedAt: string;
}

export interface IStockSummary {
  shopStocks: {
    [shopName: string]: {
      quantity: number;
      branchId?: string;
      branchName?: string;
    };
  };

  storeStocks: {
    [storeName: string]: {
      quantity: number;
      branchId?: string;
      branchName?: string;
    };
  };

  totalShopStock: number;
  totalStoreStock: number;
  totalStock: number;
}

export interface IOverallTotals {
  totalShopStock: number;
  totalStoreStock: number;
  totalAllStock: number;
  shopTotals: { [shopName: string]: number };
  storeTotals: { [storeName: string]: number };
}