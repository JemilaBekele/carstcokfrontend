/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBranch } from './Branch';
import { IEmployee } from './employee';
import { IShop } from './shop';

export interface IStore {
  id: string;
  name: string;
  branchId: string;
  branch?: IBranch;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Enum mirrors
export type StockStatus =
  | 'Available'
  | 'Reserved'
  | 'Sold'
  | 'Damaged'
  | 'Returned';
export type StockMovementType =
  | 'IN'
  | 'OUT'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'RETERN';

// StoreStock
export interface IStoreStock {
  id: string;
  storeId: string;
  store?: IStore;
  batchId: number;
  batch?: any;
  quantity: number;
  status: StockStatus;
  branch?: IBranch;
  createdAt: string; // ISO date
  updatedAt: string;
  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: any; // ISO date
}

// ShopStock
export interface IShopStock {
  id: string;
  shopId: string;
  shop?: IShop;
  batchId: number;
  batch?: any;
  quantity: number;
  status: StockStatus;
  createdAt: string; // ISO date
  updatedAt: string;
  unitOfMeasureId: string;
  // foreign key
  unitOfMeasure?: any; // ISO date
}

// StockLedger
export interface IStockLedger {
  id: string;
  batchId: number;
  batch?: any;
  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: any;
  storeId?: string;
  store?: IStore;

  shopId?: string;
  shop?: IShop;

  movementType: StockMovementType;
  quantity: number;

  reference?: string;
  userId?: string;
  user?: IEmployee;

  notes?: string;
  movementDate: string; // ISO date
  createdAt: string;
  updatedAt: string;
}
